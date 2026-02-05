import React, { useEffect, useRef } from "react";
import { 
  View, 
  StyleSheet, 
  Animated, 
  StatusBar, // ✅ Added this import
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    // 1. Branding Animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();

    let timer;

    const goNext = async () => {
      try {
        // Grab token and user object from cache
        const token = await AsyncStorage.getItem("userToken");
        const userString = await AsyncStorage.getItem("userInfo");
        const user = userString ? JSON.parse(userString) : null;
        
        timer = setTimeout(() => {
          // A. No token or user found -> Send to Login
          if (!token || !user) {
            navigation.reset({ index: 0, routes: [{ name: "Login" }] });
            return;
          }

          // B. Lecturer Logic
          if (user.role_type === 'lecturer') {
            navigation.reset({ index: 0, routes: [{ name: "LecturerTabs" }] });
          } 
          
          // C. Student Logic (THE "NO-SKIP" CHECK)
          else if (user.role_type === 'student') {
            // Check the cached registration status
            // If false, they haven't finished the scan; force them back.
            if (user.registration === false) {
              navigation.reset({ index: 0, routes: [{ name: "FaceRegistrationIntro" }] });
            } else {
              navigation.reset({ index: 0, routes: [{ name: "StudentTabs" }] });
            }
          } 
          
          // D. Fallback for undefined roles
          else {
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
      {/* StatusBar now correctly imported */}
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FB" />
      
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