// src/screens/lecturer/profile/profile_screen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const COLORS = {
  primary: "#6D5EF5",
  background: "#F6F5FF",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  chipBg: "#ECE9FF",
};

export default function LecturerProfileScreen({ navigation }) {
  const [lecturer, setLecturer] = useState({
    name: "Lecturer Name",
    email: "staff@uow.edu",
    staffId: "L123456",
    department: "School of Computing",
  });

  const [teaching, setTeaching] = useState({
    modules: ["CSIT321 – Software Design", "CSIT314 – Agile Methods"],
    activeClasses: 3,
    totalStudents: 128,
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const raw = await AsyncStorage.getItem("userInfo");
        if (raw) {
          const info = JSON.parse(raw);
          setLecturer((prev) => ({
            ...prev,
            name: info?.name || prev.name,
            email: info?.email || prev.email,
            staffId: info?.staffId || prev.staffId,
            department: info?.department || prev.department,
          }));
        }
      } catch (e) {}
    };

    loadProfile();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(["userToken", "userInfo"]);
    Alert.alert("Logged out", "You have been logged out.");
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  const goChangePassword = () => {
    navigation.navigate("ForgotPassword"); // change if needed
  };


  const goActiveClasses = () => {
    navigation.navigate("LecturerActiveClasses"); 
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Lecturer Info */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{lecturer.name}</Text>
              <Text style={styles.sub}>{lecturer.email}</Text>
            </View>
            <View style={styles.roleChip}>
              <Text style={styles.roleChipText}>Lecturer</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Staff ID</Text>
            <Text style={styles.value}>{lecturer.staffId}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Department</Text>
            <Text style={styles.value}>{lecturer.department}</Text>
          </View>
        </View>

        {/* Teaching Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Teaching Overview</Text>

          <View style={styles.kpiRow}>
            {/* ✅ Clickable KPI */}
            <Pressable style={styles.kpiBox} onPress={goActiveClasses}>
              <View style={styles.kpiTopRow}>
                <Text style={styles.kpiNumber}>{teaching.activeClasses}</Text>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </View>
              <Text style={styles.kpiLabel}>Active Classes</Text>
              <Text style={styles.kpiHint}>Tap to view</Text>
            </Pressable>

            {/* Not clickable */}
            <View style={styles.kpiBox}>
              <Text style={styles.kpiNumber}>{teaching.totalStudents}</Text>
              <Text style={styles.kpiLabel}>Students</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {teaching.modules.map((m, i) => (
            <View key={i} style={styles.moduleRow}>
              <Ionicons name="book-outline" size={16} color={COLORS.primary} />
              <Text style={styles.moduleText}>{m}</Text>
            </View>
          ))}
        </View>

        {/* Security */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Security</Text>

          <Pressable style={styles.tapRow} onPress={goChangePassword}>
            <Text style={styles.tapTitle}>Change Password</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </Pressable>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20 },

  header: { paddingTop: 14, paddingBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: "900", color: COLORS.textDark },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 12,
  },

  row: { flexDirection: "row", alignItems: "center", gap: 12 },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: COLORS.chipBg,
    alignItems: "center",
    justifyContent: "center",
  },

  roleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.chipBg,
  },
  roleChipText: { color: COLORS.primary, fontWeight: "900", fontSize: 12 },

  name: { fontSize: 16, fontWeight: "900", color: COLORS.textDark },
  sub: { marginTop: 2, color: COLORS.textMuted, fontWeight: "600" },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },

  infoRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  label: { color: COLORS.textMuted, fontWeight: "700" },
  value: { color: COLORS.textDark, fontWeight: "800" },

  cardTitle: { fontSize: 16, fontWeight: "900", color: COLORS.textDark },

  kpiRow: { flexDirection: "row", gap: 12, marginTop: 12 },

  kpiBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 12,
    backgroundColor: "#FAFAFF",
  },

  kpiTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  kpiNumber: { fontSize: 18, fontWeight: "900", color: COLORS.textDark },
  kpiLabel: { marginTop: 4, color: COLORS.textMuted, fontWeight: "700" },
  kpiHint: { marginTop: 2, color: COLORS.textMuted, fontWeight: "600", fontSize: 12 },

  moduleRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  moduleText: { color: COLORS.textDark, fontWeight: "700" },

  tapRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  tapTitle: { fontWeight: "900", color: COLORS.textDark },

  logoutBtn: {
    marginTop: 18,
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: { color: "#fff", fontWeight: "900" },
});
