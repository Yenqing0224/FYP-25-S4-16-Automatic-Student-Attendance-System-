// src/screens/lecturer/profile/profile_screen.js
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../../api/api_client";

const COLORS = {
  primary: "#6D5EF5",
  background: "#F6F5FF",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  chipBg: "#ECE9FF",
};

// ✅ safe renderer for API values (string/number/object/array)
const toText = (v, fallback = "N/A") => {
  if (v == null) return fallback;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map((x) => toText(x, "")).filter(Boolean).join(", ") || fallback;
  if (typeof v === "object") return String(v.name ?? v.title ?? v.code ?? v.id ?? fallback);
  return fallback;
};

const LecturerProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [lecturer, setLecturer] = useState(null);

  // ❌ REMOVED: Mock 'teaching' state.
  // We now use data directly from 'lecturer' state.

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/profile/");
      setLecturer(res.data);
    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await api.post("/logout/");
            await AsyncStorage.multiRemove(["userToken", "userInfo"]);
            navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          } catch (e) {
            console.error("Logout failed:", e);
            Alert.alert("Error", "Failed to communicate with server. Logging out locally.");
            await AsyncStorage.multiRemove(["userToken", "userInfo"]);
            navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          }
        },
      },
    ]);
  };

  const goChangePassword = () => navigation.navigate("LecturerChangePassword");
  const goActiveClasses = () => navigation.navigate("LecturerActiveClasses");

  // ✅ New Handler: Show details on tap
  const handleModuleTap = (module) => {
    Alert.alert(
      `${module.code} - ${module.name}`,
      `Students: ${module.student_enrolled || 0}\nStatus: ${module.status?.toUpperCase()}`,
      [{ text: "OK" }]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const fullName = lecturer?.user
    ? `${toText(lecturer.user.first_name, "")} ${toText(lecturer.user.last_name, "")}`.trim() || "Lecturer"
    : "Lecturer";

  // ✅ Extract API Data (Safe Fallbacks)
  const activeModulesCount = lecturer?.active_modules_count ?? 0;
  const totalStudentsCount = lecturer?.total_students ?? 0;
  const activeModulesList = lecturer?.active_modules ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Lecturer Info */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color={COLORS.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{fullName}</Text>
              <Text style={styles.sub}>{toText(lecturer?.user?.email, "No Email")}</Text>
            </View>

            <View style={styles.roleChip}>
              <Text style={styles.roleChipText}>Lecturer</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Staff ID</Text>
            <Text style={styles.value}>{toText(lecturer?.staff_id)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Partner Uni</Text>
            <Text style={styles.value}>{toText(lecturer?.partner_uni?.name)}</Text>
          </View>
        </View>

        {/* Teaching Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Teaching Overview</Text>

          <View style={styles.kpiRow}>
            {/* KPI 1: Active Modules (Clickable) */}
            <Pressable style={styles.kpiBox} onPress={goActiveClasses}>
              <View style={styles.kpiTopRow}>
                {/* ✅ Connected to API Count */}
                <Text style={styles.kpiNumber}>{activeModulesCount}</Text>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </View>
              {/* ✅ Renamed Label */}
              <Text style={styles.kpiLabel}>Active Modules</Text>
              <Text style={styles.kpiHint}>Tap to view</Text>
            </Pressable>

            {/* KPI 2: Total Students (Static) */}
            <View style={styles.kpiBox}>
              <View style={styles.kpiTopRow}>
                {/* ✅ Connected to API Count */}
                <Text style={styles.kpiNumber}>{totalStudentsCount}</Text>
              </View>
              <Text style={styles.kpiLabel}>Students</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* ✅ Module List from API */}
          {activeModulesList.length > 0 ? (
            activeModulesList.map((m, i) => (
              <TouchableOpacity
                key={m.id || i}
                style={styles.moduleRow}
                onPress={() => handleModuleTap(m)}
                activeOpacity={0.7}
              >
                <Ionicons name="book-outline" size={16} color={COLORS.primary} />
                {/* ✅ Shows "Code - Name" */}
                <Text style={styles.moduleText} numberOfLines={1}>
                  {m.code} – {m.name}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
             <Text style={{color: COLORS.textMuted, marginTop: 5}}>No active modules.</Text>
          )}
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
      </ScrollView>
    </SafeAreaView>
  );
};

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
    width: 48,
    height: 48,
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
  sub: { marginTop: 2, color: COLORS.textMuted, fontWeight: "600", fontSize: 13 },

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

  kpiTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 24 },
  kpiNumber: { fontSize: 20, fontWeight: "900", color: COLORS.textDark },
  kpiLabel: { marginTop: 4, color: COLORS.textMuted, fontWeight: "700", fontSize: 13 },
  kpiHint: { marginTop: 2, color: COLORS.primary, fontWeight: "700", fontSize: 11 },

  moduleRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  moduleText: { color: COLORS.textDark, fontWeight: "700" },

  tapRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  tapTitle: { fontWeight: "700", color: COLORS.textDark },

  logoutBtn: {
    marginTop: 24,
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

export default LecturerProfileScreen;