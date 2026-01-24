// src/lecturer/navigation/lecturer_home_stack.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LecturerHomeScreen from "../../screens/lecturer/home/home_screen";
import LecturerClassListScreen from "../../screens/lecturer/classes/class_list_screen";
import LecturerClassDetailScreen from "../../screens/lecturer/classes/class_detail_screen";
import LecturerAnnouncementDetailScreen from "../../screens/lecturer/announcements/announcement_detail_screen";
import LecturerRescheduleScreen from "../../screens/lecturer/classes/reschedule_screen";

const Stack = createNativeStackNavigator();

export default function LecturerHomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LecturerHomeMain" component={LecturerHomeScreen} />
      <Stack.Screen name="LecturerClassList" component={LecturerClassListScreen} />
      <Stack.Screen name="LecturerClassDetail" component={LecturerClassDetailScreen} />
      <Stack.Screen name="LecturerReschedule" component={LecturerRescheduleScreen} />
      <Stack.Screen
        name="LecturerAnnouncementDetail"
        component={LecturerAnnouncementDetailScreen}
      />
    </Stack.Navigator>
  );
}
