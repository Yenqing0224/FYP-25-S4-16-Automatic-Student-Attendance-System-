// screens/auth/forgotPassword_screen.js
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

const REQUEST_URL =
  "https://attendify-ekg6.onrender.com/api/password-reset-request/"; 
// 👆 change to your actual endpoint

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendReset = async () => {
    if (!email.trim()) {
      Alert.alert("Missing email", "Please enter your email.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(REQUEST_URL, {
        email: email.trim(),
      });

      // If your backend ALSO returns a token (for demo), grab it here:
      const token = res.data?.token; // optional

      Alert.alert(
        "Reset link sent",
        "If this email is registered, a password reset link has been sent.",
        [
          {
            text: token ? "Reset Now" : "OK",
            onPress: () => {
              if (token) {
                // For demo / testing deep link:
                navigation.navigate("ResetPassword", {
                  email: email.trim(),
                  token,
                });
              } else {
                navigation.navigate("Login");
              }
            },
          },
        ]
      );
    } catch (err) {
      console.log("ForgotPassword error:", err.response?.data || err);
      Alert.alert(
        "Error",
        err.response?.data?.detail ||
          "Failed to send reset link. Please try again."
      );
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
          <View style={styles.topSection}>
            <Text style={styles.headerTitle}>Forgot Password</Text>
            <Text style={styles.subtitle}>
              Enter your registered email and we’ll send you a reset link.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email"
                placeholderTextColor="#A0A0A0"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[
                styles.resetButton,
                (!email.trim() || loading) && styles.resetButtonDisabled,
              ]}
              onPress={handleSendReset}
              disabled={!email.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.resetButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 40,
    paddingBottom: 20,
    justifyContent: "space-between",
  },
  topSection: { marginTop: 20 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 30,
  },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#000",
  },
  bottomSection: { marginBottom: 20, alignItems: "center" },
  resetButton: {
    backgroundColor: "#8E8E93",
    height: 55,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    marginBottom: 15,
  },
  resetButtonDisabled: { opacity: 0.5 },
  resetButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  backText: {
    fontSize: 14,
    color: "#333",
    textDecorationLine: "underline",
  },
});

export default ForgotPasswordScreen;
