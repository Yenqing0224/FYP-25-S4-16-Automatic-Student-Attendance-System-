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

      // Call API
      await api.post(REQUEST_URL, { email: email.trim() });

      // ✅ Navigate IMMEDIATELY (No Alert)
      navigation.navigate("VerifyOtp", {
        email: email.trim(),
      });

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
                styles.resetButton,
                (!email.trim() || loading) && styles.resetButtonDisabled,
              ]}
              onPress={handleSendReset}
              disabled={!email.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.resetButtonText}>Send OTP</Text>
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
  resetButton: { backgroundColor: "#8E8E93", height: 55, borderRadius: 10, justifyContent: "center", alignItems: "center", alignSelf: "stretch" },
  resetButtonDisabled: { opacity: 0.5 },
  resetButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});

export default ForgotPasswordScreen;