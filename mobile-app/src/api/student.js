// api/student.js
import api from './api_client'; // Point this to the file you just pasted above

export const registerFace = async (fileUri, pose) => {
  const formData = new FormData();

  // 1. Prepare the file for React Native
  formData.append('file', {
    uri: fileUri,
    type: 'image/jpeg',
    name: `face_${pose}.jpg`,
  });

  // 2. Add the pose data
  formData.append('pose', pose);

  try {
    // 3. Send using your custom Axios instance
    // Note: We MUST override Content-Type to multipart/form-data
    const response = await api.post('/register-face/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    // 4. Extract the clean error message for the UI
    let message = "Upload failed";
    if (error.response && error.response.data) {
       // Check for specific backend error messages
       message = error.response.data.message || error.response.data.detail || message;
    }
    // Throw a simple error object that the UI can read
    throw new Error(message);
  }
};