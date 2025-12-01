import React from "react";
import { Image } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

// Screens
import HomeStack from "./home_stack"
import TimeTableStack from "./timetable_stack"
import NotificationStack from "./notification_stack"
import NewsEventsStack from "./newsevent_stack"
import ProfileStack from "./profile_stack"

// Your placeholder screen
import PlaceholderScreen from "../screens/place_holder";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarIcon: ({ focused }) => {
          let iconSource;

          if (route.name === "Home") {
            iconSource = require("../assets/home/home_icon.png");
          } else if (route.name === "Timetable") {
            iconSource = require("../assets/timetable/timetable_icon.png");
          } else if (route.name === "Notifications") {
            iconSource = require("../assets/notifications/notifications_icon.png");
          } else if (route.name === "Newsevent") {
            iconSource = require("../assets/newsevent/newsevent_icon.png");
          } else if (route.name === "Profile") {
            iconSource = require("../assets/profile/profile_icon.png");
          }

          return (
            <Image
              source={iconSource}
              style={{
                width: 26,
                height: 26,
                tintColor: focused ? "black" : "gray", 
                resizeMode: "contain",
              }}
            />
          );
        },

        tabBarShowLabel: true,
        tabBarActiveTintColor: "black",
        tabBarInactiveTintColor: "gray",
      })}
    >

      <Tab.Screen name="Home" component={HomeStack}></Tab.Screen>

      <Tab.Screen name="Timetable" component={TimeTableStack}></Tab.Screen>

      <Tab.Screen name="Notifications" component={NotificationStack}></Tab.Screen>

      <Tab.Screen name="Newsevent" component={NewsEventsStack}></Tab.Screen>

      <Tab.Screen name="Profile" component={ProfileStack}></Tab.Screen>
      
    </Tab.Navigator>
  );
}
