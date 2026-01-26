// src/utils/push.js
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
      });
    }

    if (!Device.isDevice) return null;

    // Ask permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return null;

    // Get Expo push token
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId;

    const tokenRes = await Notifications.getExpoPushTokenAsync({ projectId });
    const expoPushToken = tokenRes.data;

    // Send token to your backend (save it under the logged-in student)
    await api.post("/push/register/", { expo_push_token: expoPushToken });
    console.log("EXPO PUSH TOKEN:", expoPushToken);   // 👈 ADD HERE
    
    return expoPushToken;
  } catch (e) {
    console.log("Push register error:", e);
    return null;
  }
}
