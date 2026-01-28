// src/screens/student/timetable/class_detail_screen.js

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../../api/api_client";


const toText = (v, fallback = "-") => {
  if (v == null) return fallback;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map((x) => toText(x, "")).filter(Boolean).join(", ") || fallback;
  if (typeof v === "object") return String(v.name ?? v.code ?? v.title ?? v.id ?? fallback);
  return fallback;
};

const COLORS = {
  primary: "#3A7AFE",
  background: "#F5F7FB",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  borderSoft: "#E5E7EB",
};

const ClassDetailScreen = ({ route, navigation }) => {
  const { session_id } = route.params;

  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);


  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchData = async () => {
        try {
          const res = await api.get(`/class-details/${session_id}/`);
          if (isActive) {
            setClassData(res.data);
            setLoading(false);
          }
        } catch (err) {
          console.error("Fetch Details Error:", err);
          if (isActive) setLoading(false);
        }
      };

      fetchData();
      const interval = setInterval(fetchData, 5000);

      return () => {
        isActive = false;
        clearInterval(interval);
      };
    }, [session_id])
  );

  const formatTimeStr = (timeString) => {
    if (!timeString) return "-";
    const d = new Date(timeString);
    if (!isNaN(d.getTime())) {
      return d
        .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
        .toLowerCase();
    }
    return String(timeString).slice(0, 5);
  };

  const formatDateStr = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!classData) return null;


  const moduleCode = toText(classData.module?.code, "CODE");
  const moduleName = toText(classData.module?.name, "Module");
  const venue = toText(classData.venue, "TBA");
  const status = toText(classData.status);
  const attendanceStatus = toText(classData.attendance_status);

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F0F2FA" />

        {/*  HEADER (same as Timetable) */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBox}>
            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Class Details</Text>

          {/* placeholder to keep title centered */}
          <View style={styles.headerIconBox} />
        </View>

        <View style={styles.content}>
          <View style={styles.blueCard}>
            <Text style={styles.moduleCode}>{moduleCode}</Text>
            <Text style={styles.moduleName}>{moduleName}</Text>

            <View style={styles.infoBlock}>
              <Text style={styles.dateText}>{formatDateStr(classData.date)}</Text>
              <Text style={styles.timeText}>
                {formatTimeStr(classData.start_time)} – {formatTimeStr(classData.end_time)}
              </Text>
              <Text style={styles.venueText}>{venue}</Text>
            </View>

            <View style={styles.attendanceRow}>
              <View style={styles.attendanceCol}>
                <Text style={styles.attendanceLabel}>Entry</Text>
                <Text style={styles.attendanceValue}>{formatTimeStr(classData.entry_time)}</Text>
              </View>

              <View style={styles.verticalDivider} />

              <View style={styles.attendanceCol}>
                <Text style={styles.attendanceLabel}>Exit</Text>
                <Text style={styles.attendanceValue}>{formatTimeStr(classData.exit_time)}</Text>
              </View>
            </View>
          </View>

          {attendanceStatus === "absent" && status === "completed" && (
            <TouchableOpacity
              style={styles.appealButton}
              onPress={() =>
                navigation.navigate("ApplyAppeal", {
                  classSession: classData,
                })
              }
            >
              <Text style={styles.appealButtonText}>Appeal</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};


const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F5F7FB" },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },


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

  content: { padding: 20, alignItems: "center", paddingTop: 40 },

  blueCard: {
    backgroundColor: "#B3E5FC",
    width: "100%",
    borderRadius: 16,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    elevation: 4,
    marginBottom: 20,
  },

  moduleCode: { fontSize: 18, fontWeight: "800", marginBottom: 5 },
  moduleName: { fontSize: 16, fontWeight: "600", marginBottom: 20 },

  infoBlock: { alignItems: "center", marginBottom: 25 },
  dateText: { fontSize: 14 },
  timeText: { fontSize: 14 },
  venueText: { fontSize: 14, fontWeight: "500" },

  attendanceRow: { flexDirection: "row", width: "80%", justifyContent: "space-around" },
  attendanceCol: { alignItems: "center" },
  attendanceLabel: { fontSize: 14, fontWeight: "700" },
  attendanceValue: { fontSize: 14 },
  verticalDivider: { width: 1, height: 30, backgroundColor: "#666" },

  appealButton: {
    width: "100%",
    backgroundColor: "#8E8E93",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  appealButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

export default ClassDetailScreen;
