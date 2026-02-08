import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform, Alert } from "react-native"; // ✅ IMPORT ALERT
import api from "../src/api/api_client"; 

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushAndSync() {
  try {
    // 🚨 DEBUG POINT 1
    Alert.alert("Debug 1", "Starting Push Logic...");

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (!Device.isDevice) {
      Alert.alert("Error", "Not a physical device");
      return null;
    }

    // 🚨 DEBUG POINT 2
    // Alert.alert("Debug 2", "Checking Permissions...");
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert("Error", "❌ Permission denied! Go to settings.");
      return null;
    }

    // 🚨 DEBUG POINT 3
    // Alert.alert("Debug 3", "Getting Project ID...");

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId;

    if (!projectId) {
      Alert.alert("Error", "❌ Missing Project ID. Check app.json!");
      return null;
    }

    // 🚨 DEBUG POINT 4
    Alert.alert("Debug 4", `Project ID found: ${projectId}\nRequesting Token...`);

    // This is where it usually crashes if config is wrong
    const tokenRes = await Notifications.getExpoPushTokenAsync({ projectId });
    const expoPushToken = tokenRes.data;

    // 🚨 DEBUG POINT 5
    Alert.alert("Debug 5", `Token Generated:\n${expoPushToken}`);

    // 🚨 DEBUG POINT 6
    Alert.alert("Debug 6", "Sending to Backend now...");

    // ✅ MATCHED: Uses /save-push-token/ based on your urls
    await api.post("/save-push-token/", { expo_push_token: expoPushToken });
    
    Alert.alert("Success", "✅ Token saved to Backend!");
    
    return expoPushToken;

  } catch (e) {
    // 🚨 CATCH THE ERROR
    Alert.alert("CRITICAL ERROR", JSON.stringify(e));
    return null;
  }
}