import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { registerFace } from '../../api/student';

const { width, height } = Dimensions.get('window');

// --- CONFIGURATION ---
const OVAL_WIDTH = width * 0.8;       // 80% of screen width
const OVAL_HEIGHT = OVAL_WIDTH * 1.3; // Taller than wide (Capsule shape)
const OVERLAY_COLOR = 'rgba(0,0,0,0.9)'; // Dark background

const STEPS = {
  CENTER: { 
    id: 'CENTER', label: 'Look Straight', hint: 'Center your face', color: '#3B82F6' 
  },
  LEFT: { 
    id: 'LEFT', label: 'Turn Left', hint: 'Turn head left', color: '#EAB308' 
  },
  RIGHT: { 
    id: 'RIGHT', label: 'Turn Right', hint: 'Turn head right', color: '#22C55E' 
  },
};

const STEP_ORDER = ['CENTER', 'LEFT', 'RIGHT'];

export default function FaceRegistrationScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const capturingRef = useRef(false);

  const [step, setStep] = useState('CENTER');
  const [captures, setCaptures] = useState({});
  const [count, setCount] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    if (count === null || uploading) return;
    let timer;
    if (count > 0) {
      timer = setTimeout(() => setCount((c) => c - 1), 1000);
    } else {
      autoCapture();
    }
    return () => clearTimeout(timer);
  }, [count, uploading]);

  const startCountdown = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setCount(3);
  };

  const autoCapture = async () => {
    if (!cameraRef.current || capturingRef.current) return;
    try {
      capturingRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7, skipProcessing: true,
      });
      saveAndNext(photo.uri);
    } catch (e) {
      Alert.alert('Camera Error', 'Try again.');
      setCount(null);
    } finally {
      capturingRef.current = false;
    }
  };

  const saveAndNext = (uri) => {
    const updatedCaptures = { ...captures, [step]: uri };
    setCaptures(updatedCaptures);
    setCount(null);
    const currentIndex = STEP_ORDER.indexOf(step);
    const nextStep = STEP_ORDER[currentIndex + 1];
    if (nextStep) setStep(nextStep);
    else finishRegistration(updatedCaptures);
  };

  const finishRegistration = async (finalCaptures) => {
    setUploading(true);
    try {
      await Promise.all([
        registerFace(finalCaptures.CENTER, 'center'),
        registerFace(finalCaptures.LEFT, 'left'),
        registerFace(finalCaptures.RIGHT, 'right'),
      ]);
      Alert.alert('Success', 'Face registered!', [
        { text: 'Done', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'StudentTabs' }] }) }
      ]);
    } catch (err) {
      Alert.alert('Failed', err.message || 'Retake photos.', [
        { text: 'Retry', onPress: () => {
            setStep('CENTER'); setCaptures({}); setUploading(false); setCount(null);
        }}
      ]);
    }
  };

  if (!permission) return <View style={styles.loadingContainer}><ActivityIndicator color="#fff" /></View>;
  if (!permission.granted) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.permText}>Camera Access Needed</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stepConfig = STEPS[step];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* 1. CAMERA LAYER (z-Index: 0) */}
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" />

      {/* 2. MASK LAYER (z-Index: 10) */}
      <View style={styles.maskWrapper}>
        
        {/* Top Block */}
        <View style={styles.maskBlockFlex} />

        {/* Middle Row */}
        <View style={{ flexDirection: 'row', height: OVAL_HEIGHT }}>
            {/* Left Block */}
            <View style={styles.maskBlockFlex} />
            
            {/* THE HOLE AREA */}
            <View style={styles.holeContainer}>
                
                {/* CORNER PATCHES: 
                   These 4 views sit in the corners of the hole to turn the 
                   sharp rectangle into a round oval.
                */}
                <View style={[styles.cornerPatch, styles.topLeft]} />
                <View style={[styles.cornerPatch, styles.topRight]} />
                <View style={[styles.cornerPatch, styles.bottomLeft]} />
                <View style={[styles.cornerPatch, styles.bottomRight]} />

                {/* The Glowing Ring */}
                <View style={[styles.ring, { borderColor: stepConfig.color, shadowColor: stepConfig.color }]} />
            </View>

            {/* Right Block */}
            <View style={styles.maskBlockFlex} />
        </View>

        {/* Bottom Block */}
        <View style={styles.maskBlockFlex} />
      </View>

      {/* 3. UI LAYER (z-Index: 20) */}
      <SafeAreaView style={styles.uiContainer} pointerEvents="box-none">
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.stepLabel, { color: stepConfig.color }]}>STEP {STEP_ORDER.indexOf(step) + 1}/3</Text>
          <Text style={styles.title}>{stepConfig.label}</Text>
          <Text style={styles.subtitle}>{stepConfig.hint}</Text>
        </View>

        {/* Center Countdown */}
        <View style={styles.centerArea}>
          {uploading ? (
             <View style={styles.pill}>
               <ActivityIndicator size="small" color="#fff" style={{marginRight:8}} />
               <Text style={{color:'#fff', fontWeight:'600'}}>Uploading...</Text>
             </View>
           ) : (
             count !== null && <Text style={styles.countdown}>{count}</Text>
           )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.dotsRow}>
             {STEP_ORDER.map(s => (
               <View key={s} style={[styles.dot, s === step && { backgroundColor: stepConfig.color, width: 24 }]} />
             ))}
          </View>

          {count === null && !uploading && (
            <TouchableOpacity style={styles.btn} onPress={startCountdown}>
               <Ionicons name="camera" size={24} color="#000" />
               <Text style={styles.btnText}>START SCAN</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  permText: { color: '#fff', fontSize: 18, marginBottom: 20 },
  permBtn: { padding: 12, backgroundColor: '#3B82F6', borderRadius: 8 },
  permBtnText: { color: '#fff', fontWeight: 'bold' },

  // --- MASK STYLES ---
  maskWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10, // Ensure it's above camera
    justifyContent: 'space-between', // Spread top/middle/bottom
  },
  maskBlockFlex: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
  },
  holeContainer: {
    width: OVAL_WIDTH,
    height: OVAL_HEIGHT,
    backgroundColor: 'transparent',
    overflow: 'hidden', // Ensures corners are clipped
    position: 'relative',
  },
  
  // CORNER PATCHES (The Magic for Ovals)
  // These are opaque blocks with inverse border radius
  cornerPatch: {
    position: 'absolute',
    width: OVAL_WIDTH / 2,
    height: OVAL_HEIGHT / 2,
    backgroundColor: OVERLAY_COLOR, // Same color as overlay
    zIndex: 1,
  },
  // We use border radius to "cut out" the transparency
  topLeft: { top: 0, left: 0, borderBottomRightRadius: OVAL_WIDTH }, // Inverted curve
  topRight: { top: 0, right: 0, borderBottomLeftRadius: OVAL_WIDTH },
  bottomLeft: { bottom: 0, left: 0, borderTopRightRadius: OVAL_WIDTH },
  bottomRight: { bottom: 0, right: 0, borderTopLeftRadius: OVAL_WIDTH },

  // The Ring sits on TOP of the corner patches
  ring: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    borderRadius: OVAL_WIDTH / 2, // Matches the inverted curves
    borderWidth: 3,
    borderStyle: 'dashed',
  },

  // --- UI ---
  uiContainer: { 
    flex: 1, 
    zIndex: 20, // Topmost layer
    justifyContent: 'space-between' 
  },
  header: { alignItems: 'center', marginTop: 30 },
  stepLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5, marginBottom: 6 },
  title: { color: '#fff', fontSize: 26, fontWeight: '700' },
  subtitle: { color: '#ccc', fontSize: 16 },

  centerArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  countdown: { fontSize: 100, fontWeight: '900', color: '#fff' },
  pill: { flexDirection: 'row', backgroundColor: '#222', padding: 12, borderRadius: 20 },

  footer: { paddingBottom: 40, alignItems: 'center' },
  dotsRow: { flexDirection: 'row', marginBottom: 24, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#555' },
  btn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingVertical: 16, paddingHorizontal: 36, borderRadius: 50,
  },
  btnText: { color: '#000', fontSize: 16, fontWeight: '800', marginLeft: 8 },
});