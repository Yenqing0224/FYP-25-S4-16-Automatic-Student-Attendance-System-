import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://attendify-ekg6.onrender.com/api'; 

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

// 4. Optional: Response Interceptor (To handle 401 Unauthorized automatically)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid -> Logout user
      // You might want to navigate to Login here or clear storage
      console.log("Session expired. Please login again.");
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
    }
    return Promise.reject(error);
  }
);

export default api;