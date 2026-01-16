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
  ActivityIndicator,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/api_client"; 

const REQUEST_URL = "/request-otp/"; 

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
      await api.post(REQUEST_URL, { email: email.trim() });
      navigation.navigate("VerifyOtp", { email: email.trim() });

    } catch (err) {
      console.log("ForgotPassword error:", err.response?.data || err);
      const errorMessage = err.response?.data?.error || "Failed to send OTP. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.headerTitle}>Forgot Password</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you an OTP code.
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
                styles.submitButton, // ✅ Updated Style Name
                (!email.trim() || loading) && styles.submitButtonDisabled,
              ]}
              onPress={handleSendReset}
              disabled={!email.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Send OTP</Text>
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
  header: { paddingHorizontal: 25, paddingTop: 10, paddingBottom: 5, justifyContent: 'center' },
  backArrow: { fontSize: 28, color: "#000", fontWeight: '300' },
  innerContainer: { flex: 1, paddingHorizontal: 25, paddingTop: 20, paddingBottom: 20, justifyContent: "space-between" },
  topSection: { marginTop: 10 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#000", textAlign: "center", marginBottom: 10 },
  subtitle: { fontSize: 14, color: "#555", textAlign: "center", marginBottom: 30, paddingHorizontal: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, color: "#333", marginBottom: 8, fontWeight: "500" },
  input: { height: 50, borderWidth: 1, borderColor: "#333", borderRadius: 10, paddingHorizontal: 15, fontSize: 16, color: "#000" },
  bottomSection: { marginBottom: 20, alignItems: "center" },

  // ✅ New "Pill Shape" Button Style matching ApplyLeaveScreen
  submitButton: {
    backgroundColor: "#3A7AFE", // Primary Blue
    paddingVertical: 14,
    borderRadius: 999, // Pill shape
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
    backgroundColor: "#A6C2FF" // Lighter blue for disabled
  },
  submitText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "700" 
  },
});

export default ForgotPasswordScreen;