// utils/push.js
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
// ⚠️ Check this path: if utils is outside src, you likely need "../src/api/api_client"
import api from "../src/api/api_client"; 

// Optional: You can keep this handler here, or keep it in App.js (App.js is better)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushAndSync() {
  try {
    // 1. Android Channel Setup
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    // 2. Physical Device Check
    if (!Device.isDevice) {
      console.log("Must use physical device for Push Notifications");
      return null;
    }

    // 3. Permission Check
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token permission!");
      return null;
    }

    // 4. Get Expo Push Token
    // We use the Project ID from your app.json config to ensure it works on APKs
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId;

    const tokenRes = await Notifications.getExpoPushTokenAsync({ projectId });
    const expoPushToken = tokenRes.data;

    console.log("📍 EXPO PUSH TOKEN GENERATED:", expoPushToken);

    // 5. Send to Backend
    // ✅ CHANGED: URL must match your Django URL (api/users/push-token/)
    await api.post("/save-push-token/", { expo_push_token: expoPushToken });
    console.log("Token synced with backend successfully");
    
    return expoPushToken;

  } catch (e) {
    console.log("Push register error:", e);
    return null;
  }
}