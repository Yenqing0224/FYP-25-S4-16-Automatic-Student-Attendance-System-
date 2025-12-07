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

const LoginScreen = ({ navigation }) => {
  // ✅ CHANGED: State is now 'username', not 'email'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // YOUR BACKEND URL
  const API_URL = 'https://attendify.onrender.com/api/login/';

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter both username and password.");
      return;
    }

    setLoading(true);

    try {
      // ✅ CHANGED: Sending 'username' variable directly
      const response = await axios.post(API_URL, {
        username: username, 
        password: password
      });

      console.log("Login Success:", response.data);
      Alert.alert("Success", "Welcome back, " + response.data.user.username);
      
      navigation.replace("MainTabs", { 
        screen: "Home", // Assuming your Tab Navigator has a screen named "Home"
        params: { user: response.data.user } // Pass the user object here!
      });

    } catch (error) {
      console.error("Login Error:", error);
      let errorMessage = "Something went wrong.";
      
      if (error.response) {
        errorMessage = error.response.data.error || "Invalid Credentials";
      } else if (error.request) {
        errorMessage = "Network error. Please check your internet.";
      }

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
          
          <View style={styles.formSection}>
            <Text style={styles.headerTitle}>Log In</Text>

            {/* ✅ CHANGED: Label and Placeholder are now Username */}
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
              <TouchableOpacity style={styles.forgotContainer}>
                <Text style={styles.forgotText}>Forget password?</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomSection}>
            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                 <ActivityIndicator color="#fff" />
              ) : (
                 <Text style={styles.loginButtonText}>Log In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactContainer}>
              <Text style={styles.contactText}>Unable to Login? Contact Us</Text>
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 40,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  formSection: {
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#000',
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotText: {
    color: '#333',
    fontSize: 14,
  },
  bottomSection: {
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#8E8E93',
    height: 55,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactContainer: {
    alignItems: 'center',
  },
  contactText: {
    fontSize: 14,
    color: '#333',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;