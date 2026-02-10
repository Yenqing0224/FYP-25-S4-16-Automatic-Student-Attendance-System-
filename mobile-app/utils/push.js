// utils/push.js
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
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
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    // Physical Device Check
    if (!Device.isDevice) {
      console.log("Must use physical device for Push Notifications");
      return null;
    }

    // Permission Check
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

    // Get Expo Push Token
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId;

    const tokenRes = await Notifications.getExpoPushTokenAsync({ projectId });
    const expoPushToken = tokenRes.data;

    console.log("📍 EXPO PUSH TOKEN GENERATED:", expoPushToken);

    // Send to Backend
    await api.post("/save-push-token/", { expo_push_token: expoPushToken });
    console.log("Token synced with backend successfully");
    
    return expoPushToken;

  } catch (e) {
    console.log("Push register error:", e);
    return null;
  }
}