import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const COLORS = {
  primary: "#3A7AFE",
  bg: "#FFFFFF",
  text: "#111827",
  muted: "#6B7280",
  blueLight: "#EFF6FF",
};

export default function FaceRegistrationIntroScreen({ navigation }) {
  
  const handleStart = () => {
    navigation.replace("FaceRegistration");
  };

  const handleBack = async () => {
    await AsyncStorage.removeItem("userToken");
    await AsyncStorage.removeItem("userInfo");
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Face Registration</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        
        {/* Hero Icon */}
        <View style={styles.heroContainer}>
          <View style={styles.circleBg}>
            <Ionicons name="scan-outline" size={80} color={COLORS.primary} />
            {/* Corner decorations */}
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>
        </View>

        {/* Simplified Text */}
        <Text style={styles.title}>Face Registration</Text>
        <Text style={styles.subtitle}>
          Register your face for attendance taking.
        </Text>

      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.privacyText}>
          Your data is used only for class attendance.
        </Text>
        
        <TouchableOpacity style={styles.primaryBtn} onPress={handleStart} activeOpacity={0.9}>
          <Ionicons name="camera" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.btnText}>Start Face Scan</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },

  // ✅ UPDATED: Moved content up
  content: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "flex-start", // Changed from 'center' to 'flex-start'
    paddingTop: 60,               // Added top padding to push it down slightly from header
    paddingHorizontal: 24 
  },

  heroContainer: { marginBottom: 40 },
  circleBg: {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: COLORS.blueLight,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "#DBEAFE",
    borderStyle: "dashed",
  },
  
  // Corners
  cornerTL: { position: "absolute", top: 40, left: 40, width: 20, height: 20, borderTopWidth: 4, borderLeftWidth: 4, borderColor: COLORS.primary, borderTopLeftRadius: 8 },
  cornerTR: { position: "absolute", top: 40, right: 40, width: 20, height: 20, borderTopWidth: 4, borderRightWidth: 4, borderColor: COLORS.primary, borderTopRightRadius: 8 },
  cornerBL: { position: "absolute", bottom: 40, left: 40, width: 20, height: 20, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: COLORS.primary, borderBottomLeftRadius: 8 },
  cornerBR: { position: "absolute", bottom: 40, right: 40, width: 20, height: 20, borderBottomWidth: 4, borderRightWidth: 4, borderColor: COLORS.primary, borderBottomRightRadius: 8 },

  title: { fontSize: 26, fontWeight: "900", color: COLORS.text, textAlign: "center", marginBottom: 12 },
  subtitle: { fontSize: 16, color: COLORS.muted, textAlign: "center", lineHeight: 24, paddingHorizontal: 20 },

  footer: { padding: 24, alignItems: "center", paddingBottom: 40 },
  privacyText: { fontSize: 13, color: COLORS.muted, textAlign: "center", marginBottom: 20 },
  
  primaryBtn: {
    width: "100%", height: 56, backgroundColor: COLORS.primary,
    borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center",
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 6 },
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});