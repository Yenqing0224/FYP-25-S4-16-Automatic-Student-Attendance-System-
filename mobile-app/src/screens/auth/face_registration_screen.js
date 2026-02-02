import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  StatusBar, 
  Alert, 
  ActivityIndicator, 
  Dimensions,
  Platform
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { runOnJS } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api_client'; 

const { width } = Dimensions.get('window');

const STEPS = {
  CENTER: { id: 'CENTER', label: "Look Straight", check: (yaw) => Math.abs(yaw) < 10 },
  LEFT: { id: 'LEFT',   label: "Turn Head Left",  check: (yaw) => yaw > 15 },
  RIGHT: { id: 'RIGHT',  label: "Turn Head Right", check: (yaw) => yaw < -15 }
};

export default function FaceRegistrationScreen({ navigation }) {
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();
  const camera = useRef(null);

  const [step, setStep] = useState('CENTER');
  const [captures, setCaptures] = useState({});
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [guidance, setGuidance] = useState("Position face in circle");

  // Force permission request on mount
  useEffect(() => {
    const checkPerms = async () => {
      if (!hasPermission) {
        await requestPermission();
      }
    };
    checkPerms();
  }, [hasPermission]);

  const { detectFaces } = useFaceDetector({
    performanceMode: 'fast',
    contourMode: 'none',
    landmarkMode: 'none',
    classificationMode: 'none'
  });

  // --- JS LOGIC (Safe to run) ---
  const processFace = useCallback((faceData) => {
    if (uploading || !faceData) return;

    // Default to 0 if data is missing to prevent crashes
    const yawAngle = faceData.yawAngle || 0;
    const rollAngle = faceData.rollAngle || 0;

    if (Math.abs(rollAngle) > 20) {
      setGuidance("Keep head straight (don't tilt)");
      setProgress(0);
      return;
    }

    const currentLogic = STEPS[step];
    
    if (currentLogic.check(yawAngle)) {
      setGuidance("Hold steady...");
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 4;
      });
    } else {
      setGuidance(currentLogic.label);
      setProgress((prev) => Math.max(0, prev - 10));
    }
  }, [step, uploading]);

  // --- CAPTURE & UPLOAD LOGIC ---
  useEffect(() => {
    if (progress >= 100 && !uploading) {
      takePhoto(step);
    }
  }, [progress, step, uploading]);

  const takePhoto = async (currentStepId) => {
    if (!camera.current) return;
    setProgress(0); 
    
    try {
      const photo = await camera.current.takePhoto({
        qualityPrioritization: 'speed',
        flash: 'off'
      });
      
      const uri = `file://${photo.path}`;
      const updatedCaptures = { ...captures, [currentStepId]: uri };
      setCaptures(updatedCaptures);

      if (currentStepId === 'CENTER') setStep('LEFT');
      else if (currentStepId === 'LEFT') setStep('RIGHT');
      else if (currentStepId === 'RIGHT') finishRegistration(updatedCaptures);
      
    } catch (e) {
      console.log("Capture failed", e);
    }
  };

  const finishRegistration = async (finalCaptures) => {
    setUploading(true);
    setGuidance("Uploading face data...");

    try {
      const uploadOne = async (uri, pose) => {
        const formData = new FormData();
        formData.append('file', {
          uri: uri,
          type: 'image/jpeg',
          name: `face_${pose}.jpg`,
        });
        formData.append('pose', pose); 

        return api.post('/register-face/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
      };

      await Promise.all([
        uploadOne(finalCaptures.CENTER, 'center'),
        uploadOne(finalCaptures.LEFT, 'left'),
        uploadOne(finalCaptures.RIGHT, 'right'),
      ]);

      Alert.alert("Success", "Face registered successfully!", [
        {
          text: "Continue",
          onPress: () => navigation.reset({ index: 0, routes: [{ name: "StudentTabs" }] })
        }
      ]);

    } catch (error) {
      console.error(error);
      Alert.alert("Upload Failed", "Could not verify faces. Please try again.");
      setStep('CENTER');
      setCaptures({});
      setUploading(false);
      setProgress(0);
    }
  };

  // --- LOADING SCREEN ---
  if (!device || !hasPermission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3A7AFE" />
        <Text style={{color: '#000', marginTop: 10}}>Requesting Camera...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
        pixelFormat="yuv"
        // --- SAFE FRAME PROCESSOR ---
        frameProcessor={(frame) => {
          'worklet';
          try {
            // 1. Try to detect faces
            const faces = detectFaces(frame);
            
            // 2. Only proceed if we have a valid array
            if (faces && faces.length > 0) {
              const face = faces[0];
              
              // 3. Extract data SAFELY. 
              // We check if properties exist before accessing them to avoid C++ crashes
              const cleanData = {
                yawAngle: face.yawAngle ? face.yawAngle : 0,
                rollAngle: face.rollAngle ? face.rollAngle : 0
              };

              // 4. Send to JS
              runOnJS(processFace)(cleanData);
            }
          } catch (e) {
            // 5. CATCH THE ERROR - Do not let the app crash!
            // This will swallow the "Value is undefined" error so the camera keeps running.
            // console.log("Detector Error:", e); // Optional: Uncomment to debug in Flipper
          }
        }}
      />

      <View style={styles.overlay}>
        <View style={styles.header}>
           <Text style={styles.title}>Face Scan</Text>
           <Text style={styles.stepTitle}>Step: {STEPS[step].label}</Text>
        </View>

        <View style={[styles.circle, { borderColor: progress > 0 ? '#4ADE80' : '#FFF' }]}>
            {uploading && <ActivityIndicator size="large" color="#4ADE80" />}
        </View>

        <View style={styles.footer}>
          <Text style={styles.instruction}>{guidance}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <View style={styles.dotsContainer}>
             <Dot label="Center" active={!!captures.CENTER} current={step === 'CENTER'} />
             <Dot label="Left"   active={!!captures.LEFT}   current={step === 'LEFT'} />
             <Dot label="Right"  active={!!captures.RIGHT}  current={step === 'RIGHT'} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const Dot = ({ label, active, current }) => (
  <View style={{ alignItems: 'center', opacity: (active || current) ? 1 : 0.4 }}>
    <View style={{ 
        width: 14, height: 14, borderRadius: 7, marginBottom: 6,
        backgroundColor: active ? '#4ADE80' : (current ? '#FACC15' : '#FFF') 
    }} />
    <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  overlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 40 },
  header: { alignItems: 'center' },
  title: { color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  stepTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', marginTop: 4 },
  circle: { 
      width: width * 0.75, height: width * 0.95, borderRadius: (width * 0.75) / 2, 
      borderWidth: 4, borderColor: '#FFF', backgroundColor: 'rgba(0,0,0,0.1)',
      justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed' 
  },
  footer: { width: '100%', alignItems: 'center', paddingHorizontal: 30 },
  instruction: { color: '#FFF', fontSize: 20, fontWeight: '700', marginBottom: 20, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 },
  progressTrack: { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, marginBottom: 25, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4ADE80' },
  dotsContainer: { flexDirection: 'row', width: '100%', justifyContent: 'space-around' }
});