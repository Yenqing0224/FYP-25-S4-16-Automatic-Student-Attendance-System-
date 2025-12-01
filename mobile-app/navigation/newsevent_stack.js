import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import NewsEventsScreen from "../screens/newsevent/newsevent_screen";

const Stack = createNativeStackNavigator();

export default function NewsEventsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NewseventMain" component={NewsEventsScreen} />
    </Stack.Navigator>
  );
}
