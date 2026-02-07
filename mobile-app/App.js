// App.js
import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { Platform, Alert } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import RootNavigator from "./src/navigation/root_navigator";
import { navigationRef } from "./utils/navigationService";

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import api from "./src/api/api_client";

// ✅ OS-level notification behavior while app is foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function ensureNotificationPermission() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

// ✅ Register push (token upload is optional; local testing still works)
async function registerForPush() {
  try {
    const granted = await ensureNotificationPermission();
    if (!granted) {
      console.log("Notification permission not granted.");
      return null;
    }

    // Android: channel required for heads-up banners
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    // Expo Go / simulator note:
    // Push token only makes sense on a physical device
    if (!Device.isDevice) {
      console.log("Not a physical device → skipping Expo push token.");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const expoPushToken = tokenData.data;
    console.log("Expo push token:", expoPushToken);

    // ✅ OPTIONAL: comment this out until backend endpoint exists
    // If your backend route is wrong, it will 404 — not a problem for local tests.
    try {
      await api.post("/users/push-token/", { expo_push_token: expoPushToken });
    } catch (err) {
      console.log(
        "Failed to save push token to backend:",
        err?.response?.status || err?.message || err
      );
    }

    return expoPushToken;
  } catch (e) {
    console.log("registerForPush error:", e);
    return null;
  }
}

export default function App() {
  useEffect(() => {
    // 1) ask permission + setup
    registerForPush().catch((e) => console.log("Push register error:", e));

    // 2) In-app popup when notification arrives in foreground
    const receivedSub = Notifications.addNotificationReceivedListener((notif) => {
      const title = notif?.request?.content?.title ?? "New notification";
      const body = notif?.request?.content?.body ?? "";

      Alert.alert(title, body, [{ text: "OK" }]);
    });

    // 3) Handle tap on notification
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response?.notification?.request?.content?.data;

        if (!data?.type) return;
        if (!navigationRef.isReady()) return;

        if (data.type === "notification") {
          navigationRef.navigate("Notifications", {
            screen: "NotificationDetail",
            params: { id: data.id },
          });
        }

        if (data.type === "announcement") {
          navigationRef.navigate("Newsevent", {
            screen: "AnnouncementDetail",
            params: { id: data.id },
          });
        }
      }
    );

    // 4) ✅ Local test notification (fires in 2 seconds)
    (async () => {
      // Ensure permission is granted before scheduling
      const granted = await ensureNotificationPermission();
      if (!granted) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test popup",
          body: "If you see this, notifications are working ✅",
          data: { type: "notification", id: 1 },
        },
        trigger: { seconds: 2 },
      });
    })();

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
