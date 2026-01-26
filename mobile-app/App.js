import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import RootNavigator from "./src/navigation/root_navigator";
import { navigationRef } from "./utils/navigationService";

// ✅ Expo notifications
import * as Notifications from "expo-notifications";

// ✅ Make notifications show properly when app is foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  useEffect(() => {
    // ✅ When user taps notification (background / killed app)
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response?.notification?.request?.content?.data;

        // data example: { type: "notification", id: 12 }
        if (!data?.type) return;

        // Ensure nav is ready
        if (!navigationRef.isReady()) return;

        if (data.type === "notification") {
          // IMPORTANT: This must match your stack screen name
          navigationRef.navigate("Notifications", {
            screen: "NotificationDetail",
            params: { id: data.id }, // use id
          });
        }

        if (data.type === "announcement") {
          // IMPORTANT: Adjust these names to your actual stack/screen names
          navigationRef.navigate("Newsevent", {
            screen: "AnnouncementDetail",
            params: { id: data.id },
          });
        }
      }
    );

    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
