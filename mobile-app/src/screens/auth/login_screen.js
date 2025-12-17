// mobile-app/screens/auth/login_screen.js
import React, { useState } from 'react';
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
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('alice'); // Default for testing
  const [password, setPassword] = useState('attendify');
  const [loading, setLoading] = useState(false);

  // Ensure this URL is correct and reachable
  const API_URL = 'https://attendify-ekg6.onrender.com/api/login/';

  const handleLogin = async () => {
    // Basic validation
    if (!username || !password) {
      Alert.alert("Error", "Please enter both username and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(API_URL, {
        username: username,
        password: password
      });

      // 1. Destructure Token and User from response
      const { token, user } = response.data;

      // 🔍 CONSOLE LOG: Check data
      console.log("------------------------------------------");
      console.log("✅ Login Successful!");
      console.log("🔑 Token received:", token);
      console.log("👤 User:", user.username);
      console.log("👤 User:", user.role_type);
      console.log("------------------------------------------");

      // 2. SAVE BOTH to Async Storage
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userInfo', JSON.stringify(user));

      // 3. NAVIGATE BASED ON ROLE
      if (user.role_type === 'lecturer') {
        // Navigate to the Lecturer's main Tab Navigator
        // Make sure "LecturerTabs" is defined in your Root Navigator (App.js)
        navigation.reset({ index: 0, routes: [{ name: "LecturerTabs" }] });
      } else {
        // Default to Student
        navigation.reset({ index: 0, routes: [{ name: "StudentTabs" }] });
      }

    } catch (error) {
      console.error("Login Error:", error);
      const errorMessage = error.response?.data?.error || "Unable to log in. Please check your network.";
      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.innerContainer}
        >
          {/* Top branding section */}
          <View style={styles.brandSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>A</Text>
            </View>
            <Text style={styles.appName}>Attendify</Text>
            <Text style={styles.appSubtitle}>
              Smart student attendance companion
            </Text>
          </View>

          {/* Card with form */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Log In</Text>
            <Text style={styles.cardSubtitle}>
              Enter your credentials to continue
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

            <TouchableOpacity
              style={styles.forgotLink}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* LOGIN BUTTON */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled
              ]}
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
          <TouchableOpacity
            style={styles.contactContainer}
            onPress={() => navigation.navigate("ContactUs")}
          >
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

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  brandSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0078D7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  logoText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  appSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: 2,
    marginBottom: 20,
  },
  forgotText: {
    color: '#0078D7',
    fontSize: 13,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#111827',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSection: {
    marginBottom: 20,
  },
  contactContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  contactText: {
    fontSize: 13,
    color: '#4B5563',
  },
  contactHighlight: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});