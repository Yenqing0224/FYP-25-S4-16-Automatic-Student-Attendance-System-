import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "../screens/splash/splash_screen";
import LoginScreen from "../screens/auth/login_screen";
import TabNavigator from "./tab_navigator";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      
      {/* First screen shown */}
      <Stack.Screen name="Splash" component={SplashScreen} />

      {/* Auth screens */}
      <Stack.Screen name="Login" component={LoginScreen} />

      {/* Main app (tabs) */}
      <Stack.Screen name="MainTabs" component={TabNavigator} />

    </Stack.Navigator>
  );
}
