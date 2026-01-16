// screens/auth/verifyOtp_screen.js
import React, { useState, useRef, useEffect } from "react";
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

const VERIFY_URL = "/verify-otp/";

const VerifyOtpScreen = ({ route, navigation }) => {
  const { email } = route.params;
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleVerify = async () => {
    if (otp.length < 6) return;

    try {
      setLoading(true);
      await api.post(VERIFY_URL, { email, otp });

      // Navigate to Reset Password
      navigation.navigate("ResetPassword", { email, otp });

    } catch (err) {
      console.log("Verify OTP error:", err.response?.data || err);
      const errorMessage = err.response?.data?.error || "Invalid OTP. Please try again.";
      Alert.alert("Verification Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderOtpBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      const digit = otp[i] || "";
      const isFocused = i === otp.length; // The current box typing into
      const isFilled = i < otp.length;

      boxes.push(
        <View 
          key={i} 
          style={[
            styles.otpBox, 
            isFocused ? styles.otpBoxFocused : null, // Border color when active
            isFilled ? styles.otpBoxFilled : null,   // Optional: different style when filled
          ]}
        >
          <Text style={styles.otpText}>{digit}</Text>
        </View>
      );
    }
    return boxes;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Original Header Design */}
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
            <Text style={styles.headerTitle}>Verification</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{"\n"}
              <Text style={{ fontWeight: "bold", color: "#333" }}>{email}</Text>
            </Text>

            <View style={styles.otpWrapper}>
              {/* 2. The 6-Box Layout (Reference Style) */}
              <View style={styles.boxesRow}>
                {renderOtpBoxes()}
              </View>

              {/* Invisible Input for typing */}
              <TextInput
                ref={inputRef}
                value={otp}
                onChangeText={(text) => {
                    const numeric = text.replace(/[^0-9]/g, '');
                    if (numeric.length <= 6) setOtp(numeric);
                }}
                style={styles.hiddenInput}
                keyboardType="number-pad"
                maxLength={6}
                caretHidden={true}
              />
            </View>

            {/* Resend Link (Like in reference) */}
            <TouchableOpacity style={styles.resendContainer}>
              <Text style={styles.resendText}>Resend</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[
                styles.verifyButton,
                (otp.length < 6 || loading) && styles.verifyButtonDisabled,
              ]}
              onPress={handleVerify}
              disabled={otp.length < 6 || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify OTP</Text>
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
  
  // Original Header
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

  // --- NEW OTP BOX STYLES (Reference Look) ---
  otpWrapper: { position: 'relative', marginBottom: 10 },
  boxesRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    width: "100%" 
  },
  otpBox: {
    width: 48,  // Slightly wider
    height: 52, // Taller
    borderRadius: 12, // ✅ Highly rounded corners (Reference style)
    borderWidth: 1,
    borderColor: "#E5E7EB", // Grey border inactive
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  otpBoxFocused: {
    borderColor: "#3A7AFE", // ✅ Blue border when active (Your app color)
    borderWidth: 2,
  },
  otpBoxFilled: {
    borderColor: "#3A7AFE", // Blue border when filled
    backgroundColor: "#F0F6FF", // Optional: Slight blue tint when filled
  },
  otpText: { 
    fontSize: 22, 
    fontWeight: "600", 
    color: "#111827" 
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
  },
  
  resendContainer: { alignItems: 'flex-end', marginTop: 10 },
  resendText: { color: "#3A7AFE", fontWeight: "600", fontSize: 14 },

  // Original Button
  bottomSection: { marginBottom: 20, alignItems: "center" },
  verifyButton: {
    backgroundColor: "#8E8E93",
    height: 55,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
  },
  verifyButtonDisabled: { opacity: 0.5 },
  verifyButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});

export default VerifyOtpScreen;