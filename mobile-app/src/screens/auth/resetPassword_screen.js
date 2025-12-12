// screens/auth/resetPassword_screen.js
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

const CONFIRM_URL =
  "https://attendify-ekg6.onrender.com/api/password-reset-confirm/";
// 👆 adjust to your backend

const ResetPasswordScreen = ({ route, navigation }) => {
  const { email, token } = route.params || {};

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }
    if (!token) {
      Alert.alert(
        "Invalid link",
        "Reset token is missing. Please request a new reset link."
      );
      return;
    }

    try {
      setLoading(true);

      await axios.post(CONFIRM_URL, {
        token,
        new_password: newPassword,
        confirm_password: confirmPassword, // remove if backend doesn't need it
      });

      Alert.alert("Success", "Your password has been updated.", [
        {
          text: "OK",
          onPress: () => navigation.replace("Login"),
        },
      ]);
    } catch (err) {
      console.log("ResetPassword error:", err.response?.data || err);
      Alert.alert(
        "Error",
        err.response?.data?.detail ||
          "Failed to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled = !newPassword || !confirmPassword || loading;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.innerContainer}
        >
          <View style={styles.topSection}>
            <Text style={styles.headerTitle}>Reset Password</Text>

            <Text style={styles.subtitle}>
              Enter a new password for{" "}
              <Text style={{ fontWeight: "600" }}>{email || "your account"}</Text>.
            </Text>

            {/* NEW PASSWORD */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, { paddingRight: 70 }]}
                  placeholder="Enter new password"
                  placeholderTextColor="#A0A0A0"
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword((prev) => !prev)}
                >
                  <Text style={styles.eyeText}>
                    {showNewPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* CONFIRM PASSWORD */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, { paddingRight: 70 }]}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#A0A0A0"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                >
                  <Text style={styles.eyeText}>
                    {showConfirmPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* BUTTONS */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[
                styles.resetButton,
                isButtonDisabled && styles.resetButtonDisabled,
              ]}
              onPress={handleResetPassword}
              disabled={isButtonDisabled}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.resetButtonText}>Update Password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>Back</Text>
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
  passwordWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  eyeButton: {
    position: "absolute",
    right: 15,
    height: "100%",
    justifyContent: "center",
  },
  eyeText: {
    color: "#0078D7",
    fontSize: 14,
    fontWeight: "500",
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

export default ResetPasswordScreen;
