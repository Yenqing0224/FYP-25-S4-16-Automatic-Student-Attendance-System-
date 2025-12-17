// src/screens/auth/lecturer_login_screen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LecturerLoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState(""); // change if you want default
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = "https://attendify-ekg6.onrender.com/api/login/";

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter both username and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(API_URL, {
        username: username,
        password: password,
      });

      const { token, user } = response.data;

      console.log("------------------------------------------");
      console.log("✅ Lecturer Login Successful!");
      console.log("🔑 Token received:", token);
      console.log("👤 User:", user?.username);
      console.log("------------------------------------------");

      // save auth
      await AsyncStorage.setItem("userToken", token);
      await AsyncStorage.setItem("userInfo", JSON.stringify(user));

      // ✅ recommended: save role so Splash can auto-route later
      await AsyncStorage.setItem("userRole", "lecturer");

      // ✅ go lecturer UI
      navigation.reset({
        index: 0,
        routes: [{ name: "LecturerTabs" }],
      });
    } catch (error) {
      console.error("Lecturer Login Error:", error);
      const errorMessage =
        error.response?.data?.error || "Unable to log in. Please check your network.";
      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.innerContainer}
        >
          {/* Top branding section */}
          <View style={styles.brandSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>A</Text>
            </View>
            <Text style={styles.appName}>Attendify</Text>
            <Text style={styles.appSubtitle}>
              Lecturer attendance dashboard
            </Text>
          </View>

          {/* Card with form */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Lecturer Log In</Text>
            <Text style={styles.cardSubtitle}>
              Enter your lecturer credentials
            </Text>

            {/* USERNAME */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                placeholderTextColor="#A0A0A0"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            {/* PASSWORD */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="#A0A0A0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
              />
            </View>

            {/* optional: reuse forgot password */}
            <TouchableOpacity
              style={styles.forgotLink}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* LOGIN BUTTON */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Log In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Bottom helper */}
          <TouchableOpacity style={styles.contactContainer}>
            <Text style={styles.contactText}>
              Unable to login?{" "}
              <Text style={styles.contactHighlight}>Contact Us</Text>
            </Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default LecturerLoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    justifyContent: "space-between",
  },

  brandSection: { alignItems: "center", marginTop: 10, marginBottom: 10 },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#0078D7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  logoText: { color: "#fff", fontSize: 28, fontWeight: "800" },
  appName: { fontSize: 22, fontWeight: "800", color: "#111827" },
  appSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  cardTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
  cardSubtitle: { fontSize: 13, color: "#6B7280", marginTop: 4, marginBottom: 18 },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, color: "#374151", marginBottom: 6, fontWeight: "500" },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },

  forgotLink: { alignSelf: "flex-end", marginTop: 2, marginBottom: 20 },
  forgotText: { color: "#0078D7", fontSize: 13, fontWeight: "500" },

  loginButton: {
    backgroundColor: "#111827",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },

  contactContainer: { alignItems: "center", marginTop: 12 },
  contactText: { fontSize: 13, color: "#4B5563" },
  contactHighlight: { textDecorationLine: "underline", fontWeight: "600" },
});
