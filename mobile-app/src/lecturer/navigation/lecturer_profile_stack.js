// src/lecturer/navigation/lecturer_profile_stack.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LecturerProfileScreen from "../../screens/lecturer/profile/profile_screen";
import LecturerActiveClassesScreen from "../../screens/lecturer/profile/active_classes_screen";
import LecturerChangePasswordScreen from "../../screens/lecturer/profile/changePassword_screen";

const Stack = createNativeStackNavigator();

export default function LecturerProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="LecturerProfileMain"
        component={LecturerProfileScreen}
      />

      <Stack.Screen
        name="LecturerChangePassword"
        component={LecturerChangePasswordScreen}
      />
     
      <Stack.Screen
        name="LecturerActiveClasses"
        component={LecturerActiveClassesScreen}
      />
    </Stack.Navigator>
  );
}
