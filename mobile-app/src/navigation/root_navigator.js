import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "../screens/splash/splash_screen";
import LoginScreen from "../screens/auth/login_screen";
import WelcomeScreen from "../screens/onboarding/welcome_screen";
import ForgotPasswordScreen from "../screens/auth/forgotPassword_screen";
import ResetPasswordScreen from "../screens/auth/resetPassword_screen";
import TabNavigator from "./tab_navigator";


const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="MainTabs" component={TabNavigator} />

    </Stack.Navigator>
  );
}
