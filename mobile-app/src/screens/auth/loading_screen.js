import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AuthLoadingScreen({ navigation }) {
  useEffect(() => {
    const boot = async () => {
      const token = await AsyncStorage.getItem("userToken");
      const userString = await AsyncStorage.getItem("userInfo");
      const user = userString ? JSON.parse(userString) : null;


      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      if (user.role_type === "lecturer") {
        navigation.reset({ index: 0, routes: [{ name: "LecturerTabs" }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: "StudentTabs" }] });
      }
    };

    boot();
  }, [navigation]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
