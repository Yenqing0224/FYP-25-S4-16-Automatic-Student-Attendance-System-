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
import api from "../../api/api_client"; 

const RESET_URL = "/reset-password/"; 

const ResetPasswordScreen = ({ route, navigation }) => {
  const { email, otp } = route.params || {};

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
    if (!email || !otp) {
      Alert.alert("Error", "Missing validation info (Email or OTP).");
      return;
    }

    try {
      setLoading(true);
      await api.post(RESET_URL, {
        email: email,
        otp: otp,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      Alert.alert("Success", "Your password has been updated successfully.", [
        {
          text: "Login Now",
          onPress: () => navigation.popToTop(), 
        },
      ]);
    } catch (err) {
      console.log("ResetPassword error:", err.response?.data || err);
      const errorMessage =
        err.response?.data?.error || "Failed to reset password. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled = !newPassword || !confirmPassword || loading;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backArrow}>{'<'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.innerContainer}
        >
          <View style={styles.topSection}>
            <Text style={styles.headerTitle}>Reset Password</Text>

            <Text style={styles.subtitle}>
              Create a new password for{"\n"}
              <Text style={{ fontWeight: "bold", color: "#333" }}>{email}</Text>
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, { paddingRight: 50 }]}
                  placeholder="Enter new password"
                  placeholderTextColor="#A0A0A0"
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Text style={styles.eyeText}>
                    {showNewPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, { paddingRight: 50 }]}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#A0A0A0"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text style={styles.eyeText}>
                    {showConfirmPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[
                styles.submitButton, // ✅ Updated Style Name
                isButtonDisabled && styles.submitButtonDisabled,
              ]}
              onPress={handleResetPassword}
              disabled={isButtonDisabled}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingHorizontal: 25,
    paddingTop: 10,
    paddingBottom: 5,
    justifyContent: 'center',
  },
  backArrow: { fontSize: 28, color: "#000", fontWeight: '300' },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 20,
    justifyContent: "space-between",
  },
  topSection: { marginTop: 10 },
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
    lineHeight: 20,
  },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    fontWeight: "500",
  },
  passwordWrapper: {
    position: "relative",
    justifyContent: "center",
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
  eyeButton: {
    position: "absolute",
    right: 15,
    height: "100%",
    justifyContent: "center",
  },
  eyeText: {
    color: "#3A7AFE", 
    fontSize: 14,
    fontWeight: "600",
  },
  bottomSection: { marginBottom: 20, alignItems: "center" },

  submitButton: {
    backgroundColor: "#3A7AFE",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  submitButtonDisabled: { 
    backgroundColor: "#A6C2FF" 
  },
  submitText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "700" 
  },
});

export default ResetPasswordScreen;