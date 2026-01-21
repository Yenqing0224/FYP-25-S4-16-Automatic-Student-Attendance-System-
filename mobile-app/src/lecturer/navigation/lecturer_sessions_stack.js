// src/lecturer/navigation/lecturer_sessions_stack.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LecturerSessionsScreen from "../../screens/lecturer/sessions/sessions_screen";
import LecturerClassDetailScreen from "../../screens/lecturer/classes/class_detail_screen";
import LecturerRescheduleScreen from "../../screens/lecturer/classes/reschedule_screen";

const Stack = createNativeStackNavigator();

export default function LecturerSessionsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LecturerSessionsMain" component={LecturerSessionsScreen} />
      <Stack.Screen name="LecturerClassDetail" component={LecturerClassDetailScreen} />
      <Stack.Screen name="LecturerReschedule" component={LecturerRescheduleScreen} />
    </Stack.Navigator>
  );
}
