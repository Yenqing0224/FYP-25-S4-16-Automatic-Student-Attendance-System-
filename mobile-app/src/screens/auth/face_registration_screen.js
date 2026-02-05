import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

// API Imports
import api from '../../api/api_client'; 
import { verifyPose } from '../../api/student'; 

const { width } = Dimensions.get('window');
const SQUARE_SIZE = width * 0.9; 

const STEPS = [
  { id: 'center', label: 'Look Straight', color: '#6D5EF5' },
  { id: 'left', label: 'Turn Head Left', color: '#F59E0B' },
  { id: 'right', label: 'Turn Head Right', color: '#10B981' },
];

export default function FaceRegistrationScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  // State
  const [isStarted, setIsStarted] = useState(false); // ✅ New Start State
  const [stepIndex, setStepIndex] = useState(0);
  const [captures, setCaptures] = useState({});
  const [feedback, setFeedback] = useState("Align face in square");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const currentStep = STEPS[stepIndex];

  const handleExitToLogin = async () => {
    await AsyncStorage.removeItem("userToken");
    await AsyncStorage.removeItem("userInfo");
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  useEffect(() => {
    const backAction = () => {
      handleExitToLogin();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  // --- SCANNING LOOP (FastAPI) ---
  useEffect(() => {
    let interval;
    const scanLoop = async () => {
      // ✅ Added !isStarted to prevent loop from running early
      if (!isStarted || isUploading || isProcessing || !cameraRef.current) return;

      try {
        setIsProcessing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.2,
          skipProcessing: true,
          shutterSound: false,
          fastPrioritization: true, 
        });

        const result = await verifyPose(photo.uri, currentStep.id);

        if (result.valid) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          handleStepSuccess(currentStep.id.toUpperCase(), photo.uri);
        } else {
          setFeedback(result.detail || "Position face...");
        }
      } catch (err) {
        console.log("Verify Error:", err);
      } finally {
        setIsProcessing(false);
      }
    };

    if (!isUploading && isStarted) {
      interval = setInterval(scanLoop, 2500); 
    }
    return () => clearInterval(interval);
  }, [stepIndex, isUploading, isProcessing, isStarted]);

  const handleStepSuccess = async (key, uri) => {
    setFeedback("HOLD STILL...");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise(resolve => setTimeout(resolve, 500));

    const highResPhoto = await cameraRef.current.takePictureAsync({
      quality: 0.8,
      skipProcessing: false,
      shutterSound: false,
    });

    const newCaptures = { ...captures, [key]: highResPhoto.uri };
    setCaptures(newCaptures);

    if (stepIndex < STEPS.length - 1) {
      setStepIndex((prev) => prev + 1);
      setFeedback("Perfect! Next position...");
    } else {
      finishRegistration(newCaptures);
    }
  };

  const finishRegistration = async (finalCaptures) => {
    setIsUploading(true);
    setFeedback("Registering Face...");

    try {
      const formData = new FormData();
      formData.append('center', { uri: finalCaptures.CENTER, name: 'center.jpg', type: 'image/jpeg' });
      formData.append('left', { uri: finalCaptures.LEFT, name: 'left.jpg', type: 'image/jpeg' });
      formData.append('right', { uri: finalCaptures.RIGHT, name: 'right.jpg', type: 'image/jpeg' });

      const response = await api.post('/register-face/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });

      if (response.status === 201 || response.data.status === 'success') {
        const userString = await AsyncStorage.getItem("userInfo");
        let user = JSON.parse(userString);
        user.registration = true; 
        await AsyncStorage.setItem("userInfo", JSON.stringify(user));
        
        Alert.alert('Success', 'Face registered successfully!', [
          { text: 'Done', onPress: () => navigation.reset({ index: 0, routes: [{ name: "StudentTabs" }] }) }
        ]);
      }
    } catch (err) {
      console.log("Upload Error:", err.response?.data || err.message);
      Alert.alert(
        'Registration Failed', 
        'We could not verify your face. Please ensure you are in good lighting and not moving.',
        [{ text: 'Retry All', onPress: () => {
              setStepIndex(0);
              setCaptures({});
              setIsUploading(false);
              setIsStarted(false); // ✅ Reset start state on failure
              setFeedback("Align face in square");
            } 
          }]
      );
    }
  };

  if (!permission?.granted) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" mode="picture" />

      {/* SQUARE MASK */}
      <View style={styles.overlayContainer} pointerEvents="none">
         <View style={styles.squareTarget}>
            <View style={[styles.corner, styles.tl, { borderColor: isStarted ? currentStep.color : '#fff' }]} />
            <View style={[styles.corner, styles.tr, { borderColor: isStarted ? currentStep.color : '#fff' }]} />
            <View style={[styles.corner, styles.bl, { borderColor: isStarted ? currentStep.color : '#fff' }]} />
            <View style={[styles.corner, styles.br, { borderColor: isStarted ? currentStep.color : '#fff' }]} />
         </View>
      </View>

      <SafeAreaView style={styles.ui} pointerEvents="box-none">
        <View style={styles.header}>
          <TouchableOpacity onPress={handleExitToLogin} style={styles.closeBtn}>
            <Ionicons name="close-circle" size={42} color="#fff" />
          </TouchableOpacity>
          
          {isStarted && <Text style={[styles.instruction, { color: currentStep.color }]}>{currentStep.label}</Text>}
          
          {isStarted && (
            <View style={styles.messageBox}>
              <Text style={styles.feedbackText}>{feedback.toUpperCase()}</Text>
              {(isProcessing || isUploading) && <ActivityIndicator color={currentStep.color} style={{marginTop: 10}}/>}
            </View>
          )}
        </View>

        <View style={styles.footer}>
           {!isStarted ? (
             // ✅ START BUTTON
             <TouchableOpacity 
                style={styles.startBtn} 
                onPress={() => {
                  setIsStarted(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                }}
              >
               <Ionicons name="play" size={24} color="#fff" style={{marginRight: 10}} />
               <Text style={styles.startBtnText}>Start</Text>
             </TouchableOpacity>
           ) : (
             <View style={styles.dotRow}>
               {STEPS.map((_, i) => (
                 <View key={i} style={[styles.dot, i <= stepIndex && { backgroundColor: currentStep.color }]} />
               ))}
             </View>
           )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlayContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  squareTarget: { width: SQUARE_SIZE, height: SQUARE_SIZE, position: 'relative' },
  corner: { position: 'absolute', width: 60, height: 60, borderWidth: 8 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  ui: { flex: 1, justifyContent: 'space-between', paddingVertical: 20 },
  header: { alignItems: 'center', paddingTop: 20 },
  closeBtn: { alignSelf: 'flex-start', marginLeft: 20, marginBottom: 20 },
  instruction: { fontSize: 36, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 },
  messageBox: { marginTop: 20, backgroundColor: 'rgba(0,0,0,0.7)', padding: 20, borderRadius: 20, width: '85%', alignItems: 'center' },
  feedbackText: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  footer: { alignItems: 'center', marginBottom: 40 },
  dotRow: { flexDirection: 'row', gap: 15 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.3)' },
  // ✅ Start Button Styles
  startBtn: {
    backgroundColor: '#6D5EF5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 50,
    shadowColor: '#6D5EF5',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5
  },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 }
});