// mobile-app/screens/student/profile/profile_screen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../../api/api_client";
import { Ionicons } from "@expo/vector-icons";
import { registerForPushAndSync } from "../../../../utils/push";

const COLORS = {
  primary: "#3A7AFE",
  background: "#F5F7FB",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  soft: "#E7F0FF",
  danger: "#B91C1C",
};

const toText = (v, fallback = "") => {
  if (v == null) return fallback;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map((x) => toText(x, "")).filter(Boolean).join(", ") || fallback;
  if (typeof v === "object") return String(v.name ?? v.title ?? v.code ?? v.id ?? fallback);
  return fallback;
};

const ProfileScreen = ({ navigation }) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
    registerForPushAndSync();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/profile/");
      setStudent(response.data);
    } catch (error) {
      console.error("Profile Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await api.post("/remove-push-token/");
            await api.post("/logout/");
          } catch (e) {
            console.error("Logout API failed:", e);
          } finally {
            await AsyncStorage.multiRemove(["userInfo", "userToken"]);
            navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          }
        },
      },
    ]);
  };

  const firstLetter = useMemo(() => {
    const u = student?.user || {};
    return (u.username?.[0] || u.first_name?.[0] || "S").toUpperCase();
  }, [student]);

  const fullName = useMemo(() => {
    const u = student?.user || {};
    const name = `${toText(u.first_name, "")} ${toText(u.last_name, "")}`.trim();
    return name || toText(u.username, "Student");
  }, [student]);

  const programme = toText(student?.programme, "Student");
  const email = toText(student?.user?.email, "");
  const studentId = toText(student?.student_id ?? student?.matric_no ?? student?.matriculation_no, "—");

  const MenuItem = ({ icon, title, subtitle, onPress, danger }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.menuItem, danger && styles.menuItemDanger]}
      onPress={onPress}
    >
      <View style={styles.menuLeft}>
        <View style={[styles.menuIconBox, danger && styles.menuIconBoxDanger]}>
          <Ionicons
            name={icon}
            size={18}
            color={danger ? COLORS.danger : COLORS.primary}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.menuText, danger && { color: COLORS.danger }]} numberOfLines={1}>
            {title}
          </Text>
          {!!subtitle && (
            <Text style={styles.menuSubText} numberOfLines={2}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={danger ? COLORS.danger : COLORS.textMuted}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView edges={["top"]} style={styles.topSafeArea} />
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Home")}
          style={styles.headerBtn}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Profile</Text>

        <TouchableOpacity
          onPress={loadProfile}
          style={styles.headerBtn}
          activeOpacity={0.85}
        >
          <Ionicons name="refresh-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* BODY */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* PROFILE CARD */}
          <View style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>{firstLetter}</Text>
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{fullName}</Text>
              <Text style={styles.degree} numberOfLines={1}>{programme}</Text>
              {!!email && <Text style={styles.emailText} numberOfLines={1}>{email}</Text>}

              <View style={{ height: 10 }} />

              <View style={styles.pillRow}>
                <View style={styles.pill}>
                  <Ionicons name="id-card-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.pillText}>ID: {studentId}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => navigation.navigate("EditProfile")}
                activeOpacity={0.9}
              >
                <Ionicons name="create-outline" size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* QUICK ACTIONS */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Student Actions</Text>
          </View>

          <View style={styles.card}>
            <MenuItem
              icon="document-text-outline"
              title="Apply Leave of Absence"
              subtitle="Submit leave requests for upcoming classes."
              onPress={() => navigation.navigate("ApplyLeave")}
            />
            <View style={styles.divider} />

            <MenuItem
              icon="time-outline"
              title="Leave Status"
              subtitle="Track approval status for your leave submissions."
              onPress={() => navigation.navigate("LeaveStatus")}
            />
            <View style={styles.divider} />

            <MenuItem
              icon="albums-outline"
              title="Appeal Module Status"
              subtitle="View updates on your module appeals."
              onPress={() => navigation.navigate("AppealStatus")}
            />
          </View>

          {/* SECURITY */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Security & Help</Text>
          </View>

          <View style={styles.card}>
            <MenuItem
              icon="key-outline"
              title="Change Password"
              subtitle="Update your login password securely."
              onPress={() => navigation.navigate("ChangePassword")}
            />
            <View style={styles.divider} />

            <MenuItem
              icon="help-circle-outline"
              title="FAQ"
              subtitle="Find answers to common questions."
              onPress={() => navigation.navigate("FAQ")}
            />
          </View>

          {/* LOGOUT */}
          <View style={styles.card}>
            <MenuItem
              icon="log-out-outline"
              title="Log out"
              subtitle="Sign out of your account on this device."
              onPress={handleLogout}
              danger
            />
          </View>

          <View style={{ height: 16 }} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.background },
  topSafeArea: { flex: 0, backgroundColor: COLORS.background },

  header: {
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EDEEF2",
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.soft,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: COLORS.textDark },

  scrollContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 8, color: COLORS.textMuted, fontWeight: "600" },

  // PROFILE CARD
  profileCard: {
    flexDirection: "row",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  avatarWrap: { justifyContent: "flex-start" },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: COLORS.soft,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: { fontSize: 28, color: COLORS.primary, fontWeight: "900" },

  name: { fontSize: 18, fontWeight: "900", color: COLORS.textDark },
  degree: { marginTop: 2, fontSize: 13, fontWeight: "700", color: COLORS.textMuted },
  emailText: { marginTop: 2, fontSize: 12, fontWeight: "700", color: COLORS.textMuted },

  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F3F7FF",
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: { fontSize: 12, fontWeight: "900", color: COLORS.textDark },

  primaryBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: { color: "#fff", fontSize: 13, fontWeight: "900" },

  sectionTitleRow: { paddingHorizontal: 2, marginTop: 6, marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "900", color: COLORS.textDark },

  // LIST CARD
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  divider: { height: 1, backgroundColor: COLORS.border },

  menuItem: {
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },

  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.soft,
    justifyContent: "center",
    alignItems: "center",
  },
  menuIconBoxDanger: { backgroundColor: "#FEE2E2" },

  menuText: { fontSize: 14, fontWeight: "900", color: COLORS.textDark },
  menuSubText: { marginTop: 2, fontSize: 12, fontWeight: "700", color: COLORS.textMuted },

  menuItemDanger: {},
});

export default ProfileScreen;
