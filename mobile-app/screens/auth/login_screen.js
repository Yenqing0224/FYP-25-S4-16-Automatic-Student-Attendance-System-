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
  const [username, setUsername] = useState('alice');
  const [password, setPassword] = useState('attendify');
  const [loading, setLoading] = useState(false);

  // BACKEND URL
  const API_URL = 'https://attendify-ekg6.onrender.com/api/login/';

  const handleLogin = async () => {
  // ... validation ...
  setLoading(true);

  try {
    const response = await axios.post(API_URL, {
      username: username,
      password: password
    });

    // 2. SUCCESS: Save User Data to Hardware
    // We must turn the object into a String to save it
    const userData = response.data.user;
    await AsyncStorage.setItem('userInfo', JSON.stringify(userData));

    console.log("User saved to storage:", userData.username);
    
    // 3. Navigate (No need to pass params anymore!)
    navigation.replace("MainTabs");

  } catch (error) {
    // ... error handling ...
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