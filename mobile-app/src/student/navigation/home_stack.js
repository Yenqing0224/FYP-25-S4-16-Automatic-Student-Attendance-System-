// src/student/navigation/home_stack.js
import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import HomeScreen from "../../screens/student/home/home_screen";
import AttendanceHistoryScreen from "../../screens/student/attendance/attendanceHistory_screen";
import StudentAnnouncementDetailScreen from "../../screens/student/newsevent/announcement_detail_screen";
import WelcomeScreen from "../../screens/student/onboarding/welcome_screen"; // ✅ add this

const Stack = createNativeStackNavigator();
const ONBOARDING_KEY = "studentOnboardingSeen_v1";

export default function HomeStack() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
        setInitialRoute(seen === "1" ? "HomeMain" : "Welcome");
      } catch (e) {
        setInitialRoute("HomeMain"); // fallback
      }
    })();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />

      <Stack.Screen name="HomeMain" component={HomeScreen} />

      <Stack.Screen
        name="AttendanceHistory"
        component={AttendanceHistoryScreen}
        options={{ title: "Attendance History" }}
      />
      <Stack.Screen name="StudentAnnouncementDetail" component={StudentAnnouncementDetailScreen} />
    </Stack.Navigator>
  );
}
