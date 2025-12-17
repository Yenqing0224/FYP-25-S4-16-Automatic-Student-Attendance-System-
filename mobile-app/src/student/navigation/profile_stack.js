// mobile-app/src/student/navigation/profile_stack.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProfileScreen from "../../screens/student/profile/profile_screen";
import EditProfileScreen from "../../screens/student/profile/editProfile_screen";         
import ApplyLeaveScreen from "../../screens/student/profile/applyLeave_screen";          
import ApplyLeaveSuccessScreen from "../../screens/student/profile/applyLeaveSuccess_screen"; 
import LeaveStatusScreen from '../../screens/student/profile//leave_status_screen';
import LeaveDetailScreen from '../../screens/student/profile//leave_detail_screen';
import AppealStatusScreen from '../../screens/student/profile//appeal_status_screen';
import AppealDetailScreen from "../../screens/student/profile/appeal_detail_screen";
import ChangePasswordScreen from "../../screens/student/profile/changePassword_screen";
import FAQScreen from '../../screens/student/profile//faq_screen';




const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ApplyLeave" component={ApplyLeaveScreen} />
      <Stack.Screen name="ApplyLeaveSuccess" component={ApplyLeaveSuccessScreen} />
      <Stack.Screen name="LeaveStatus" component={LeaveStatusScreen} />
      <Stack.Screen name="LeaveDetail" component={LeaveDetailScreen} />
      <Stack.Screen name="AppealStatus" component={AppealStatusScreen} />
      <Stack.Screen name="AppealDetail" component={AppealDetailScreen}/>
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} />


    </Stack.Navigator>
  );
}
