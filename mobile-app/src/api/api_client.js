import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationService from '../../utils/navigationService';
import { Alert } from 'react-native';

const BASE_URL = 'https://attendify-40rk.onrender.com/api';

// 2. Create the Axios Instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // Wait for 10 seconds before failing
  headers: {
    'Content-Type': 'application/json',
  },
});

// 3. The Interceptor (The "Middleman")
// This runs AUTOMATICALLY before every single request you send using 'api'
api.interceptors.request.use(
  async (config) => {
    // A. Grab the token from storage
    const token = await AsyncStorage.getItem('userToken');

    // B. If token exists, attach it to the header
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isAlertVisible = false;

// 4. Optional: Response Interceptor (To handle 401 Unauthorized automatically)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      if (!isAlertVisible) {
        isAlertVisible = true;
        Alert.alert(
          "Session Expired",                   // Title
          "Your session has ended. Please log in again.", // Message
          [
            {
              text: "OK",
              onPress: async () => {
                // 👈 3. Logic runs ONLY after user clicks OK
                try {
                  await AsyncStorage.removeItem('userToken');
                  await AsyncStorage.removeItem('userInfo');

                  // Reset flag so alert can show again next time
                  isAlertVisible = false;

                  // Navigate to Login
                  NavigationService.navigate('Login');
                } catch (e) {
                  console.error("Logout error", e);
                }
              }
            }
          ],
          { cancelable: false } // Prevent closing by tapping outside
        );
      }
    }
    return Promise.reject(error);
  }
);

export default api;