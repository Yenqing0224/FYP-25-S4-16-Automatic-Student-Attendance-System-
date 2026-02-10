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
  Animated,
  Easing,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import api from '../../api/api_client'; 
import { verifyPose } from '../../api/student'; 

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.9;
const SCAN_DURATION = 2000;

const THEME_COLOR = '#3A7AFE'; 

const STEPS = [
  { id: 'center', label: 'Look Straight', icon: 'happy-outline' },
  { id: 'left', label: 'Turn Left', icon: 'arrow-back' },
  { id: 'right', label: 'Turn Right', icon: 'arrow-forward' },
];

export default function FaceRegistrationScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const [isStarted, setIsStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [captures, setCaptures] = useState({});
  const [feedback, setFeedback] = useState("Align your face");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const scanAnim = useRef(new Animated.Value(0)).current;
  const currentStep = STEPS[stepIndex];

  // Animation
  useEffect(() => {
    if (isStarted && !isUploading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: SCAN_DURATION,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: SCAN_DURATION,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanAnim.setValue(0);
    }
  }, [isStarted, isUploading]);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_SIZE - 4],
  });

  const handleExitToLogin = async () => {
    await AsyncStorage.removeItem("userToken");
    await AsyncStorage.removeItem("userInfo");
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleExitToLogin();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  // Loop
  useEffect(() => {
    let interval;
    const scanLoop = async () => {
      if (!isStarted || isUploading || isProcessing || !cameraRef.current) return;

      try {
        setIsProcessing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.2, skipProcessing: true, shutterSound: false, fastPrioritization: true, 
        });

        const result = await verifyPose(photo.uri, currentStep.id);

        if (result.valid) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          handleStepSuccess(currentStep.id.toUpperCase(), photo.uri);
        } else {
          setFeedback(result.detail || "Align face...");
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
    await new Promise(resolve => setTimeout(resolve, 1500));

    const highResPhoto = await cameraRef.current.takePictureAsync({
      quality: 0.8, skipProcessing: false, shutterSound: false,
    });

    const newCaptures = { ...captures, [key]: highResPhoto.uri };
    setCaptures(newCaptures);

    if (stepIndex < STEPS.length - 1) {
      setStepIndex((prev) => prev + 1);
      setFeedback("Perfect! Next...");
    } else {
      finishRegistration(newCaptures);
    }
  };

  const finishRegistration = async (finalCaptures) => {
    setIsUploading(true);
    setFeedback("Registering...");

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
        [{ text: 'Retry', onPress: () => {
              setStepIndex(0);
              setCaptures({});
              setIsUploading(false);
              setIsStarted(false);
              setFeedback("Tap Start to begin");
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

      {/* --- MASK --- */}
      <View style={styles.maskOverlay} pointerEvents="none">
         <View style={styles.maskTop} />
         <View style={styles.maskMiddle}>
            <View style={styles.maskSide} />
            <View style={styles.maskHole} />
            <View style={styles.maskSide} />
         </View>
         <View style={styles.maskBottom} />
      </View>

      {/* --- SCANNER BOX --- */}
      <View style={styles.scanContainer} pointerEvents="none">
         <View style={[styles.scanFrame, { borderColor: isStarted ? THEME_COLOR : 'rgba(255,255,255,0.5)' }]}>
            {isStarted && !isUploading && (
               <Animated.View 
                  style={[
                    styles.laserLine, 
                    { backgroundColor: THEME_COLOR, transform: [{ translateY }] }
                  ]} 
               />
            )}
            <View style={[styles.corner, styles.tl, { borderColor: isStarted ? THEME_COLOR : '#fff' }]} />
            <View style={[styles.corner, styles.tr, { borderColor: isStarted ? THEME_COLOR : '#fff' }]} />
            <View style={[styles.corner, styles.bl, { borderColor: isStarted ? THEME_COLOR : '#fff' }]} />
            <View style={[styles.corner, styles.br, { borderColor: isStarted ? THEME_COLOR : '#fff' }]} />
         </View>
      </View>

      {/* --- UI LAYER --- */}
      <SafeAreaView style={styles.uiLayer} pointerEvents="box-none">
        
        <View style={styles.header}>
          <TouchableOpacity onPress={handleExitToLogin} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {isStarted && (
            <View style={styles.instructionContainer}>
                <Ionicons 
                    name={currentStep.icon} 
                    size={50} 
                    color={THEME_COLOR} 
                    style={{ marginBottom: 10, textShadowColor:'rgba(0,0,0,0.5)', textShadowRadius: 10 }} 
                />
                <Text style={[styles.instructionText, { color: THEME_COLOR }]}>
                    {currentStep.label}
                </Text>
            </View>
        )}

        <View style={styles.footer}>
           <View style={styles.feedbackPill}>
              {(isProcessing || isUploading) && (
                  <ActivityIndicator color="#fff" size="small" style={{marginRight: 8}}/>
              )}
              <Text style={styles.feedbackText}>{feedback}</Text>
           </View>

           {!isStarted ? (
             <TouchableOpacity 
                style={[styles.startBtn, { backgroundColor: THEME_COLOR, shadowColor: THEME_COLOR }]} 
                activeOpacity={0.8}
                onPress={() => {
                  setIsStarted(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
               <Ionicons name="scan-outline" size={24} color="#fff" style={{marginRight: 10}} />
               <Text style={styles.startBtnText}>START SCAN</Text>
             </TouchableOpacity>
           ) : (
             <View style={styles.progressContainer}>
                {STEPS.map((step, i) => (
                    <View key={step.id} style={styles.stepWrapper}>
                        <View style={[
                            styles.stepDot, 
                            i <= stepIndex && { backgroundColor: THEME_COLOR, transform: [{scale: 1.3}] },
                            i > stepIndex && { backgroundColor: 'rgba(255,255,255,0.3)' }
                        ]} />
                    </View>
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
  maskOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center' },
  maskTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  maskBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  maskMiddle: { flexDirection: 'row', height: SCAN_SIZE },
  maskSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  maskHole: { width: SCAN_SIZE, height: SCAN_SIZE, backgroundColor: 'transparent' },

  scanContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: SCAN_SIZE, height: SCAN_SIZE, position: 'relative' },
  
  laserLine: {
      width: '100%', height: 3, opacity: 0.8,
      shadowColor: '#000', shadowOpacity: 0.8, shadowRadius: 10, elevation: 10
  },

  corner: { position: 'absolute', width: 40, height: 40, borderWidth: 5, borderRadius: 4 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 16 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 16 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 16 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 16 },

  uiLayer: { flex: 1, justifyContent: 'space-between' },
  header: { padding: 20, alignItems: 'flex-start' },
  closeBtn: {
      width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center', alignItems: 'center'
  },
  instructionContainer: { alignItems: 'center', justifyContent: 'center', marginTop: -80 },
  instructionText: {
      fontSize: 28, fontWeight: '900', textTransform: 'uppercase', 
      textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 15, letterSpacing: 1
  },
  footer: { alignItems: 'center', paddingBottom: 40, paddingHorizontal: 20 },
  feedbackPill: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.75)', 
      paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30,
      marginBottom: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)'
  },
  feedbackText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },
  startBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 40, paddingVertical: 16, borderRadius: 30,
    shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: {width:0, height:4}, elevation: 8
  },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  progressContainer: { flexDirection: 'row', gap: 15, alignItems: 'center' },
  stepWrapper: { padding: 5 },
  stepDot: { width: 12, height: 12, borderRadius: 6 },
});