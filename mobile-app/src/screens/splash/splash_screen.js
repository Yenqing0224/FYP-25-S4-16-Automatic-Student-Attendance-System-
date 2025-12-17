import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    // animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();

    let timer;

    const goNext = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        const userString = await AsyncStorage.getItem("userInfo"); // "student" | "lecturer"
        const user = userString ? JSON.parse(userString) : null;
        
        timer = setTimeout(() => {
          if (token && user && user.role_type === 'lecturer') {
            navigation.reset({ index: 0, routes: [{ name: "LecturerTabs" }] });
          } else if (token && user && user.role_type === 'student') {
            navigation.reset({ index: 0, routes: [{ name: "StudentTabs" }] });
          } else {
            // not logged in OR role missing
            navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          }
        }, 1500);
      } catch (e) {
        console.log("Splash storage check failed:", e);
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      }
    };

    goNext();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [navigation, fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require("../../../assets/attendify.png")}
        style={[
          styles.logo,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      />
      <Animated.Text style={[styles.text, { opacity: fadeAnim }]}>
        Attendify
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: { width: 220, height: 220, marginBottom: 10 },
  text: { fontSize: 26, fontWeight: "700", color: "#3A7AFE", letterSpacing: 1.2 },
});
