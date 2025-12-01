import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import NotificationScreen from "../screens/notifications/notifications_screen";

const Stack = createNativeStackNavigator();

export default function NotificationStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NotificationsMain" component={NotificationScreen} />
    </Stack.Navigator>
  );
}
