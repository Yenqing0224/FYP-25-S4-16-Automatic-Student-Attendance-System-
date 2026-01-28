// mobile-app/screens/auth/login_screen.js
import React, { useMemo, useState } from "react";
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
  StatusBar,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState("alice");
  const [password, setPassword] = useState("attendify");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const API_URL = "https://attendify-40rk.onrender.com/api/login/";

  const canSubmit = useMemo(() => {
    return username.trim().length > 0 && password.trim().length > 0 && !loading;
  }, [username, password, loading]);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both username and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(API_URL, {
        username: username.trim(),
        password: password,
      });

      const { token, user } = response.data;

      await AsyncStorage.setItem("userToken", token);
      await AsyncStorage.setItem("userInfo", JSON.stringify(user));
      await AsyncStorage.setItem("userRole", user.role_type); // optional (helps your splash)

      if (user.role_type === "lecturer") {
        navigation.reset({ index: 0, routes: [{ name: "LecturerTabs" }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: "StudentTabs" }] });
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Unable to log in. Please check your network.";
      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.innerContainer}
        >
          {/* HEADER (minimalist) */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.logoCircle}>
                <Image
                  source={require("../../../assets/attendify.png")}
                  style={styles.logoIcon}
                  resizeMode="contain"
                />
              </View>


              <View style={{ flex: 1 }}>
                <Text style={styles.appName}>Attendify</Text>
                <Text style={styles.appSubtitle}>Attendance made simple</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>Welcome back</Text>
          </View>

          {/* small controlled gap (no big empty space) */}
          <View style={{ height: 12 }} />

          {/* CARD */}
          <View style={styles.card}>
            <Text style={styles.label}>Username or Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color={COLORS.muted} />
              <TextInput
                style={styles.input}
                placeholder="Enter username or email"
                placeholderTextColor={COLORS.placeholder}
                value={username}
                onChangeText={setUsername}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.muted} />
              <TextInput
                style={[styles.input, { paddingRight: 42 }]}
                placeholder="Enter password"
                placeholderTextColor={COLORS.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel="Toggle password visibility"
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={COLORS.muted}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.rowBetween}>
              <TouchableOpacity
                style={styles.forgotLink}
                onPress={() => navigation.navigate("ForgotPassword")}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, !canSubmit && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={!canSubmit}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.loginButtonText}>Log In</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Need help?</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.contactContainer}
              onPress={() => navigation.navigate("ContactUs")}
            >
              <Ionicons name="help-circle-outline" size={18} color={COLORS.primary} />
              <Text style={styles.contactText}>
                Trouble logging in? <Text style={styles.contactHighlight}>Contact Support</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 12 }} />
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );

};

export default LoginScreen;

const COLORS = {
  bg: "#F4F6FB",
  card: "#FFFFFF",
  text: "#0F172A",
  muted: "#64748B",
  placeholder: "#94A3B8",
  border: "#E5E7EB",
  soft: "#F8FAFC",
  primary: "#3A7AFE",
  primaryDark: "#1E40AF",
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // ✅ no "space-between" so it won't push card too far down
  innerContainer: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    justifyContent: "flex-start",
  },

  // ✅ minimalist header (no glow, no big hero block)
  header: {
    paddingHorizontal: 2,
    paddingTop: 6,
  },

  brandRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  appName: { fontSize: 18, fontWeight: "900", color: COLORS.text, letterSpacing: 0.2 },
  appSubtitle: { fontSize: 12.5, color: COLORS.muted, marginTop: 2 },

  // ✅ tighter spacing
  heroTitle: { marginTop: 10, fontSize: 22, fontWeight: "900", color: COLORS.text },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,

    // ✅ flatter shadow (more minimalist)
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  label: { fontSize: 12.5, color: "#334155", marginBottom: 8, fontWeight: "700" },
  inputWrap: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: COLORS.soft,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, color: COLORS.text },

  eyeBtn: {
    position: "absolute",
    right: 10,
    height: 48,
    width: 42,
    justifyContent: "center",
    alignItems: "center",
  },

  rowBetween: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },
  forgotLink: { paddingVertical: 6 },
  forgotText: { color: COLORS.primaryDark, fontSize: 13, fontWeight: "700" },

  loginButton: {
    marginTop: 14,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonDisabled: { opacity: 0.55 },
  btnRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  loginButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },

  dividerRow: { marginTop: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: { fontSize: 12, color: COLORS.muted, fontWeight: "700" },

  contactContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#F1F5FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  contactText: { fontSize: 13, color: "#334155", fontWeight: "600" },
  contactHighlight: {
    color: COLORS.primaryDark,
    textDecorationLine: "underline",
    fontWeight: "900",
  },
  logoIcon: {
  width: 22,
  height: 22,
},

});