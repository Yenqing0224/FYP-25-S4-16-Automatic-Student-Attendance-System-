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
const REQUEST_URL = "/request-otp/"; 

const VerifyOtpScreen = ({ route, navigation }) => {
  const { email } = route.params;
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [timer, setTimer] = useState(60); 
  
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async () => {
    if (otp.length < 6) return;

    try {
      setLoading(true);
      await api.post(VERIFY_URL, { email, otp });
      navigation.navigate("ResetPassword", { email, otp });

    } catch (err) {
      console.log("Verify OTP error:", err.response?.data || err);
      const errorMessage = err.response?.data?.error || "Invalid OTP. Please try again.";
      Alert.alert("Verification Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;

    try {
      setLoading(true);
      await api.post(REQUEST_URL, { email });
      setTimer(60); 
    } catch (err) {
      console.log("Resend error:", err);
      Alert.alert("Error", "Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderOtpBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      const digit = otp[i] || "";
      const isFocused = i === otp.length; 
      const isFilled = i < otp.length;

      boxes.push(
        <View 
          key={i} 
          style={[
            styles.otpBox, 
            isFocused ? styles.otpBoxFocused : null, 
            isFilled ? styles.otpBoxFilled : null,   
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
              <View style={styles.boxesRow}>
                {renderOtpBoxes()}
              </View>

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

            {/* ✅ Updated Resend Logic */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendLabel}>Didn't receive code? </Text>
              <TouchableOpacity 
                onPress={handleResend}
                disabled={timer > 0 || loading} 
              >
                <Text style={[
                  styles.resendText, 
                  (timer > 0 || loading) && { color: '#999' }
                ]}>
                  {timer > 0 ? `Resend in ${timer}s` : "Resend"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[
                styles.submitButton, 
                (otp.length < 6 || loading) && styles.submitButtonDisabled,
              ]}
              onPress={handleVerify}
              disabled={otp.length < 6 || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Verify OTP</Text>
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

  otpWrapper: { position: 'relative', marginBottom: 20 },
  boxesRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    width: "100%" 
  },
  otpBox: {
    width: 48, 
    height: 52, 
    borderRadius: 12, 
    borderWidth: 1,
    borderColor: "#E5E7EB", 
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  otpBoxFocused: {
    borderColor: "#3A7AFE", 
    borderWidth: 2,
  },
  otpBoxFilled: {
    borderColor: "#3A7AFE", 
    backgroundColor: "#F0F6FF", 
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
  
  resendContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 10 
  },
  resendLabel: {
    color: "#555",
    fontSize: 14,
  },
  resendText: { 
    color: "#3A7AFE", 
    fontWeight: "600", 
    fontSize: 14 
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

export default VerifyOtpScreen;