import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TimetableScreen from "../screens/timetable/timetable_screen";
import ClassDetailScreen from "../screens/timetable/class_detail_screen";

const Stack = createNativeStackNavigator();

export default function TimeTableStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TimeTableMain" component={TimetableScreen} />
      <Stack.Screen name="ClassDetail" component={ClassDetailScreen} />
    </Stack.Navigator>
  );
}
