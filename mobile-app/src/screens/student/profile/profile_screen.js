// mobile-app/screens/student/profile/profile_screen.js
import React, { useEffect, useState } from "react";
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

// ✅ NEW: auto-register push (no toggle UI)
import { registerForPushAndSync } from "../../../../utils/push";



const COLORS = {
  primary: "#3A7AFE",
  background: "#F5F7FB",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  borderSoft: "#E5E7EB",
};

const ProfileScreen = ({ navigation }) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
    // ✅ Always attempt to register push token (OS permission decides)
    registerForPushAndSync();
  }, []);

  const loadProfile = async () => {
    try {
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
            // 1) Call logout API
            await api.post("/logout/");

            // 2) Clear local storage
            await AsyncStorage.removeItem("userInfo");
            await AsyncStorage.removeItem("userToken");

            // 3) Reset to Login
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          } catch (e) {
            console.error("Logout failed:", e);
            Alert.alert(
              "Error",
              "Failed to communicate with the server. Please check your connection."
            );
          }
        },
      },
    ]);
  };

  const firstLetter =
    student?.user?.username?.[0]?.toUpperCase() ||
    student?.user?.first_name?.[0]?.toUpperCase() ||
    "S";

  const fullName = student?.user
    ? `${student.user.first_name || ""} ${student.user.last_name || ""}`.trim() ||
      student.user.username ||
      "Student"
    : "Loading...";

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView edges={["top"]} style={styles.topSafeArea} />
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Home")}
          style={styles.headerIconBox}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Profile</Text>

        <View style={styles.headerIconBox} />
      </View>

      {/* BODY */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* PROFILE CARD */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>{firstLetter}</Text>
              </View>
            </View>

            <View style={styles.textSection}>
              <Text style={styles.name}>{fullName}</Text>

              <Text style={styles.degree}>{student?.programme || "Student"}</Text>

              <Text style={styles.emailText}>{student?.user?.email || ""}</Text>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate("EditProfile")}
              >
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* SETTINGS CARD */}
          <View style={styles.settingsCard}>
            {/* ✅ Push toggle removed */}

            {/* Apply Leave */}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBorder]}
              onPress={() => navigation.navigate("ApplyLeave")}
            >
              <View>
                <Text style={styles.menuText}>Apply Leave of Absence</Text>
                <Text style={styles.menuSubText}>
                  Submit leave requests for upcoming classes.
                </Text>
              </View>
              <Text style={styles.arrow}>{">"}</Text>
            </TouchableOpacity>

            {/* Leave Status */}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBorder]}
              onPress={() => navigation.navigate("LeaveStatus")}
            >
              <View>
                <Text style={styles.menuText}>Leave Status</Text>
                <Text style={styles.menuSubText}>
                  Track approval status for your leave submissions.
                </Text>
              </View>
              <Text style={styles.arrow}>{">"}</Text>
            </TouchableOpacity>

            {/* Appeals Status */}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBorder]}
              onPress={() => navigation.navigate("AppealStatus")}
            >
              <View>
                <Text style={styles.menuText}>Appeal Module Status</Text>
                <Text style={styles.menuSubText}>
                  View updates on your module appeals.
                </Text>
              </View>
              <Text style={styles.arrow}>{">"}</Text>
            </TouchableOpacity>

            {/* Change Password */}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBorder]}
              onPress={() => navigation.navigate("ChangePassword")}
            >
              <View>
                <Text style={styles.menuText}>Change Password</Text>
                <Text style={styles.menuSubText}>
                  Update your login password securely.
                </Text>
              </View>
              <Text style={styles.arrow}>{">"}</Text>
            </TouchableOpacity>

            {/* FAQ */}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBorder]}
              onPress={() => navigation.navigate("FAQ")}
            >
              <View>
                <Text style={styles.menuText}>FAQ</Text>
                <Text style={styles.menuSubText}>
                  Find answers to common questions.
                </Text>
              </View>
              <Text style={styles.arrow}>{">"}</Text>
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Text style={[styles.menuText, { color: "#B91C1C" }]}>Log out</Text>
              <Text style={[styles.arrow, { color: "#B91C1C" }]}>{">"}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topSafeArea: {
    flex: 0,
    backgroundColor: COLORS.background,
  },

  header: {
    backgroundColor: COLORS.background,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#E6E6E6",
  },
  headerIconBox: {
    width: 32,
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textDark,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 16,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    color: COLORS.textMuted,
  },

  // PROFILE CARD
  profileCard: {
    flexDirection: "row",
    padding: 18,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    marginBottom: 20,

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#CBD5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: {
    fontSize: 34,
    color: "#1E1B4B",
    fontWeight: "800",
  },
  textSection: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  degree: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  emailText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  editButton: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  editButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  // SETTINGS CARD
  settingsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 4,

    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },

  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderSoft,
  },
  menuText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  menuSubText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    maxWidth: 220,
  },
  arrow: {
    fontSize: 18,
    color: COLORS.textMuted,
    fontWeight: "300",
  },
});

export default ProfileScreen;
