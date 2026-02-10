import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationService from '../../utils/navigationService';
import { Alert } from 'react-native';

const BASE_URL = 'https://attendify-40rk.onrender.com/api';

// Create Axios Instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use(
  async (config) => {
    // Grab token
    const token = await AsyncStorage.getItem('userToken');

    // If token exists, attach it to the header
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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      if (!isAlertVisible) {
        isAlertVisible = true;
        Alert.alert(
          "Session Expired",                  
          "Your session has ended. Please log in again.", 
          [
            {
              text: "OK",
              onPress: async () => {
                try {
                  await AsyncStorage.removeItem('userToken');
                  await AsyncStorage.removeItem('userInfo');

                  isAlertVisible = false;

                  // Navigate to Login
                  NavigationService.navigate('Login');
                } catch (e) {
                  console.error("Logout error", e);
                }
              }
            }
          ],
          { cancelable: false }
        );
      }
    }
    return Promise.reject(error);
  }
);

export default api;