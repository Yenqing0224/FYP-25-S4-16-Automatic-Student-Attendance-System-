//src/student/navigation/home_stack.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../../screens/student/home/home_screen";
import AttendanceHistoryScreen from "../../screens/student/attendance/attendanceHistory_screen";
import StudentAnnouncementDetailScreen from "../../screens/student/newsevent/announcement_detail_screen";


const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} options={{ title: "Attendance History" }}/>
      <Stack.Screen name="StudentAnnouncementDetail" component={StudentAnnouncementDetailScreen}/>
    </Stack.Navigator>

  );
}
