import React, { useEffect, useRef } from "react";
import { View, Text, Image, StyleSheet, Animated } from "react-native";

export default function SplashScreen({ navigation }) {
  
  const fadeAnim = useRef(new Animated.Value(0)).current;   // for fade-in
  const scaleAnim = useRef(new Animated.Value(0.85)).current; // slight zoom-in

  useEffect(() => {
    // Run animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();

    // Navigate after delay
    const timer = setTimeout(() => {
      navigation.replace("Login");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image 
        source={require("../../assets/attendify.png")}
        style={[
          styles.logo,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
        ]}
      />

      <Animated.Text 
        style={[
          styles.text,
          { opacity: fadeAnim }
        ]}
      >
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
  logo: {
    width: 220,
    height: 220,
    marginBottom: 10,
  },
  text: {
    fontSize: 26,
    fontWeight: "700",
    color: "#3A7AFE",
    letterSpacing: 1.2,
  },
});