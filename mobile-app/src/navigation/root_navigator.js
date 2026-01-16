//src/navigation/root_navigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "../screens/splash/splash_screen";
import LoginScreen from "../screens/auth/login_screen";
import WelcomeScreen from "../screens/student/onboarding/welcome_screen";
import ForgotPasswordScreen from "../screens/auth/forgotPassword_screen";
import VerifyOtpScreen from "../screens/auth/verifyOtp_screen";
import ResetPasswordScreen from "../screens/auth/resetPassword_screen";
import ContactUsScreen from "../screens/auth/contactUs_screen";

import TabNavigator from "../student/navigation/tab_navigator";

import LecturerTabNavigator from "../lecturer/navigation/lecturerTab_navigator";



const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />

      {/* Auth */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="ContactUs" component={ContactUsScreen} />

      {/* Apps */}
      <Stack.Screen name="StudentTabs" component={TabNavigator} />
      <Stack.Screen name="LecturerTabs" component={LecturerTabNavigator} />
    </Stack.Navigator>
  );
}
