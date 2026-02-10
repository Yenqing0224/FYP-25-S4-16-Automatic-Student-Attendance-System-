// src/screens/student/timetable/class_detail_screen.js

import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
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
  chipBg: "rgba(58,122,254,0.12)",
};

const APPEAL_WINDOW_HOURS = 48;

const ClassDetailScreen = ({ route, navigation }) => {
  const { session_id } = route.params;

  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isMountedRef = useRef(true);

  const fetchData = useCallback(
    async (opts = { showSpinner: false }) => {
      const showSpinner = !!opts?.showSpinner;

      try {
        if (showSpinner) setRefreshing(true);

        const res = await api.get(`/class-details/${session_id}/`);

        if (isMountedRef.current) {
          setClassData(res.data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Fetch Details Error:", err);
        if (isMountedRef.current) {
          setLoading(false);
          if (showSpinner) Alert.alert("Error", "Could not refresh class details.");
        }
      } finally {
        if (isMountedRef.current) setRefreshing(false);
      }
    },
    [session_id]
  );

  useFocusEffect(
    useCallback(() => {
      isMountedRef.current = true;

      fetchData({ showSpinner: false });

      const interval = setInterval(() => fetchData({ showSpinner: false }), 5000);

      return () => {
        isMountedRef.current = false;
        clearInterval(interval);
      };
    }, [fetchData])
  );

  const formatTimeStr = (timeString) => {
    if (!timeString) return "-";
    const s = String(timeString);

    if (/^\d{2}:\d{2}/.test(s)) return s.slice(0, 5);

    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return d
        .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
        .toLowerCase();
    }
    return s.slice(0, 5);
  };

  const formatDateStr = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(`${dateString}T00:00:00`);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const getAppealDeadline = (dateStr, endTimeStr) => {
    if (!dateStr) return null;
    const t = String(endTimeStr || "00:00").slice(0, 5);
    const end = new Date(`${dateStr}T${t}:00+08:00`);
    if (isNaN(end.getTime())) return null;
    return new Date(end.getTime() + APPEAL_WINDOW_HOURS * 60 * 60 * 1000);
  };

  const isAppealExpired = (data) => {
    const deadline = getAppealDeadline(data?.date, data?.end_time);
    if (!deadline) return false;
    return new Date() > deadline;
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

  const expired = isAppealExpired(classData);

  const canAttemptAppeal = attendanceStatus === "absent" && status === "completed";
  const showExpiredUI = canAttemptAppeal && expired;
  const showAppealButton = canAttemptAppeal && !expired;

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView edges={["top"]} style={styles.topSafeArea} />
      <View style={styles.contentContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerPillBtn}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Class Details</Text>

          <TouchableOpacity
            onPress={() => fetchData({ showSpinner: true })}
            style={styles.headerPillBtn}
            activeOpacity={0.85}
            disabled={refreshing}
          >
            <Ionicons
              name={refreshing ? "time-outline" : "refresh"}
              size={18}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={styles.detailCard}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardAccent} />

              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={2}>
                  {moduleCode} · {moduleName}
                </Text>

                <View style={styles.metaLine}>
                  <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{formatDateStr(classData.date)}</Text>
                </View>

                <View style={styles.metaLine}>
                  <Ionicons name="time-outline" size={14} color={COLORS.primary} />
                  <Text style={[styles.metaText, styles.timeHighlight]}>
                    {formatTimeStr(classData.start_time)} – {formatTimeStr(classData.end_time)}
                  </Text>
                </View>

                <View style={styles.metaLine}>
                  <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {venue}
                  </Text>
                </View>

                <View style={styles.chipRow}>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>Class: {toText(status).toUpperCase()}</Text>
                  </View>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>
                      Attendance: {toText(attendanceStatus).toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

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

          {showExpiredUI && (
            <View style={styles.expiredBox}>
              <Ionicons name="lock-closed-outline" size={16} color="#475569" />
              <Text style={styles.expiredText}>Appeal period has expired</Text>
            </View>
          )}

          {showAppealButton && (
            <TouchableOpacity
              style={styles.appealButton}
              onPress={() => navigation.navigate("ApplyAppeal", { classSession: classData })}
              activeOpacity={0.92}
            >
              <Ionicons name="alert-circle-outline" size={18} color="#fff" />
              <Text style={styles.appealButtonText}>Submit Appeal</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.background },
  topSafeArea: { flex: 0, backgroundColor: COLORS.background },
  contentContainer: { flex: 1, backgroundColor: COLORS.background },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

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
  headerPillBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.chipBg,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: COLORS.textDark },

  body: { padding: 20, paddingTop: 18 },

  detailCard: {
    backgroundColor: "#F0F5FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },

  cardTopRow: { flexDirection: "row", alignItems: "flex-start" },
  cardAccent: {
    width: 4,
    borderRadius: 999,
    backgroundColor: "#3F4E85",
    marginRight: 14,
    marginTop: 2,
  },

  title: { fontSize: 17, fontWeight: "900", color: COLORS.textDark },

  metaLine: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  metaText: { fontSize: 13, fontWeight: "700", color: COLORS.textMuted, flexShrink: 1 },
  timeHighlight: { color: COLORS.primary, fontWeight: "800" },

  chipRow: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 12 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(58,122,254,0.12)",
  },
  chipText: { fontSize: 11, fontWeight: "900", color: COLORS.primary },

  divider: {
    height: 1,
    backgroundColor: "rgba(17,24,39,0.10)",
    marginVertical: 14,
  },

  attendanceRow: { flexDirection: "row", width: "100%", justifyContent: "space-around" },
  attendanceCol: { alignItems: "center", flex: 1 },
  attendanceLabel: { fontSize: 12, fontWeight: "800", color: COLORS.textMuted, marginBottom: 6 },
  attendanceValue: { fontSize: 14, fontWeight: "800", color: COLORS.textDark },
  verticalDivider: { width: 1, height: 34, backgroundColor: "rgba(17,24,39,0.18)" },

  appealButton: {
    marginTop: 16,
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  appealButtonText: { color: "#fff", fontSize: 15, fontWeight: "900" },

  expiredBox: {
    marginTop: 16,
    width: "100%",
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  expiredText: { color: "#475569", fontSize: 13.5, fontWeight: "900" },
});

export default ClassDetailScreen;
