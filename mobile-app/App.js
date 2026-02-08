// App.js
import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { Alert } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import RootNavigator from "./src/navigation/root_navigator";
import { navigationRef } from "./utils/navigationService";
import * as Notifications from "expo-notifications";

// 1. Configure Notification Appearance (Foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Banner shows up
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  useEffect(() => {
    // 2. Foreground Listener (Optional Popup)
    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      // Optional: Handle foreground logic if needed
    });

    // 3. Background/Tap Listener (Navigation)
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response?.notification?.request?.content?.data;

        // Ensure navigation is ready
        if (!navigationRef.isReady()) return;

        // ✅ STRICTLY ONLY HANDLES "notification" TYPE
        // Ignores announcements, news, or any other type
        if (data?.type === "notification") {
          navigationRef.navigate("Notifications", {
            screen: "NotificationsMain", // Goes straight to the list
          });
        }
      }
    );

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