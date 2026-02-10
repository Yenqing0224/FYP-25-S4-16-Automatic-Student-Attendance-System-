//src/lecturer/navigation/lecturerTab_navigator.js
import React from "react";
import { Image } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import LecturerHomeStack from "./lecturer_home_stack";
import LecturerSessionsStack from "./lecturer_sessions_stack";
import LecturerProfileStack from "./lecturer_profile_stack";

const Tab = createBottomTabNavigator();

export default function LecturerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          let iconSource;

          if (route.name === "LHome") iconSource = require("../../../assets/home/home_icon.png");
          else if (route.name === "LSessions") iconSource = require("../../../assets/timetable/timetable_icon.png");
          else if (route.name === "LProfile") iconSource = require("../../../assets/profile/profile_icon.png");

          return (
            <Image
              source={iconSource}
              style={{
                width: 26,
                height: 26,
                tintColor: focused ? "#6D5EF5" : "gray",
                resizeMode: "contain",
              }}
            />
          );
        },
        tabBarShowLabel: true,
        tabBarActiveTintColor: "blue",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="LHome" component={LecturerHomeStack} options={{ title: "Home" }} />
      <Tab.Screen name="LSessions" component={LecturerSessionsStack} options={{ title: "Sessions" }} />
      <Tab.Screen name="LProfile" component={LecturerProfileStack} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}
