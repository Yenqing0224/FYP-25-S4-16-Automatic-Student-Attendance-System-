import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FaceRegistrationScreen({ navigation }) {
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();
  
  // 1. Initialize Detector with EMPTY options (Uses Library Defaults)
  const { detectFaces } = useFaceDetector({});

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission]);

  if (!device || !hasPermission) {
    return (
      <View style={{flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#3A7AFE" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'black'}}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
        pixelFormat="yuv" // Critical for Android Face Detection
        // 2. The Simplest Frame Processor Possible
        frameProcessor={(frame) => {
          'worklet';
          try {
            const faces = detectFaces(frame);
            
            // If this logs, the detector IS WORKING.
            if (faces.length > 0) {
              console.log("Face Detected:", faces[0].bounds);
            }
          } catch (e) {
            console.log("Frame Error:", e.message); 
          }
        }}
      />
      
      {/* Visual Overlay */}
      <View style={{position: 'absolute', bottom: 50, width: '100%', alignItems: 'center'}}>
        <Text style={{color: '#4ADE80', fontSize: 18, fontWeight: 'bold'}}>
          Face Detector Active
        </Text>
        <Text style={{color: 'white'}}>Check your Terminal for logs!</Text>
      </View>
    </SafeAreaView>
  );
}