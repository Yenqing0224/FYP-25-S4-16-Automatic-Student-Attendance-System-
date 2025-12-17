//src/student/navigation/timetable_stack.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TimetableScreen from "../../screens/student/timetable/timetable_screen";
import ClassDetailScreen from "../../screens/student/timetable/class_detail_screen";
import ApplyAppealScreen from "../../screens/student/timetable/applyAppeal_screen";
import ApplyAppealSuccessScreen from "../../screens/student/timetable/applyAppealSuccess_screen";

const Stack = createNativeStackNavigator();

export default function TimeTableStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TimeTableMain" component={TimetableScreen} />
      <Stack.Screen name="ClassDetail" component={ClassDetailScreen} />
      <Stack.Screen name="ApplyAppeal" component={ApplyAppealScreen} />
      <Stack.Screen name="ApplyAppealSuccess" component={ApplyAppealSuccessScreen} />
    </Stack.Navigator>
  );
} 
