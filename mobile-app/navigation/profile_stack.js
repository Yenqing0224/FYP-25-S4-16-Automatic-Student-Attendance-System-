import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProfileScreen from "../screens/profile/profile_screen";
import LeaveStatusScreen from '../screens/profile//leave_status_screen';
import LeaveDetailScreen from '../screens/profile//leave_detail_screen';
import AppealStatusScreen from '../screens/profile//appeal_status_screen';
import AppealDetailScreen from "../screens/profile/appeal_detail_screen";
import FAQScreen from '../screens/profile//faq_screen';


const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="LeaveStatus" component={LeaveStatusScreen} />
      <Stack.Screen name="LeaveDetail" component={LeaveDetailScreen}/>
      <Stack.Screen name="AppealStatus" component={AppealStatusScreen} />
      <Stack.Screen name="AppealDetail" component={AppealDetailScreen}/>
      <Stack.Screen name="FAQ" component={FAQScreen} />
    </Stack.Navigator>
  );
}
