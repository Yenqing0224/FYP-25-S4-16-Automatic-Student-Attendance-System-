// src/screens/student/profile/appeal_detail_screen.js
// ✅ Beautified to match Timetable/NewsEvents vibe (pill header, chips, icon rows, nicer document card)
// ✅ Safer date parsing for "YYYY-MM-DD" (no UTC shift)
// ✅ Safer time formatting for "HH:MM:SS" or ISO datetime

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../../api/api_client";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  primary: "#3A7AFE",
  background: "#F5F7FB",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  chipBg: "rgba(58,122,254,0.12)",
};

const toText = (v, fallback = "-") => {
  if (v == null) return fallback;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map((x) => toText(x, "")).filter(Boolean).join(", ") || fallback;
  if (typeof v === "object") return String(v.name ?? v.title ?? v.code ?? v.id ?? fallback);
  return fallback;
};

const formatStatus = (status) => {
  const s = String(status || "");
  if (!s) return "-";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// ✅ Safe for both "YYYY-MM-DD" and ISO strings
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const s = String(dateString);

  // if it's YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(`${s}T00:00:00`);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  const d = new Date(s);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatTime = (timeString) => {
  if (!timeString) return "-";
  const s = String(timeString);

  // HH:MM:SS or HH:MM
  if (/^\d{2}:\d{2}/.test(s)) return s.slice(0, 5);

  // ISO datetime
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d
      .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
      .toLowerCase();
  }

  return s.slice(0, 5);
};

const statusUI = (statusRaw) => {
  const s = String(statusRaw || "").toLowerCase();

  if (s === "approved")
    return { label: "APPROVED", icon: "checkmark-circle-outline", fg: "#16A34A", bg: "rgba(22,163,74,0.12)" };

  if (s === "rejected")
    return { label: "REJECTED", icon: "close-circle-outline", fg: "#DC2626", bg: "rgba(220,38,38,0.12)" };

  return { label: "PENDING", icon: "time-outline", fg: "#D97706", bg: "rgba(217,119,6,0.14)" };
};

const AppealDetailScreen = ({ navigation, route }) => {
  const { appeal } = route.params || {};
  const [opening, setOpening] = useState(false);

  const handleOpenFile = async () => {
    const hasFile = appeal?.document_path || appeal?.document_url;

    if (!hasFile) {
      Alert.alert("No file", "There is no file attached to this appeal.");
      return;
    }

    setOpening(true);

    try {
      const response = await api.get(`/get-appeals-document/${appeal.id}/`);
      const { document_url } = response.data || {};

      if (!document_url) {
        Alert.alert("Error", "Could not retrieve document link.");
        return;
      }

      // canOpenURL is fine, but even if false, openURL will often still work
      await Linking.openURL(document_url);
    } catch (error) {
      console.error("Open File Error:", error);
      Alert.alert("Error", "Failed to open the file. Please try again.");
    } finally {
      setOpening(false);
    }
  };

  if (!appeal) {
    return (
      <View style={styles.mainContainer}>
        <SafeAreaView edges={["top"]} style={styles.topSafeArea} />
        <View style={styles.contentContainer}>
          <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} activeOpacity={0.85}>
              <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Appeal Details</Text>

            <View style={{ width: 40 }} />
          </View>

          <View style={styles.emptyContainer}>
            <Ionicons name="warning-outline" size={40} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No record found</Text>
            <Text style={styles.emptySub}>We couldn’t load the appeal details.</Text>
          </View>
        </View>
      </View>
    );
  }

  const reason = toText(appeal.reason, "-");
  const status = toText(appeal.status, "pending");
  const s = statusUI(status);

  const moduleCode = toText(appeal.session?.module?.code, "MOD");
  const moduleName = toText(appeal.session?.module?.name, "Module");

  const classDate = appeal.session?.date ? formatDate(appeal.session.date) : "-";
  const classTime =
    appeal.session?.start_time && appeal.session?.end_time
      ? `${formatTime(appeal.session.start_time)} – ${formatTime(appeal.session.end_time)}`
      : "-";

  const submittedOn = appeal.created_at ? formatDate(appeal.created_at) : "-";

  const hasFile = !!(appeal.document_path || appeal.document_url);

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView edges={["top"]} style={styles.topSafeArea} />
      <View style={styles.contentContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

        {/* ✅ Timetable-style header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Appeal Details</Text>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top summary card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryLabel}>Reason</Text>
                <Text style={styles.summaryValue} numberOfLines={2}>
                  {reason}
                </Text>
              </View>

              <View style={[styles.statusChip, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon} size={14} color={s.fg} />
                <Text style={[styles.statusChipText, { color: s.fg }]}>{s.label}</Text>
              </View>
            </View>

            {appeal.description ? (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.miniLabel}>Description</Text>
                <View style={styles.noteBox}>
                  <Text style={styles.noteText}>{toText(appeal.description, "")}</Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Details card */}
          <View style={styles.detailCard}>
            <Text style={styles.cardTitle}>Details</Text>

            <View style={styles.detailRow}>
              <View style={styles.iconBubble}>
                <Ionicons name="book-outline" size={16} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Module</Text>
                <Text style={styles.fieldValue} numberOfLines={2}>
                  {moduleCode} · {moduleName}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.iconBubble}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Class Date</Text>
                <Text style={styles.fieldValue}>{classDate}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.iconBubble}>
                <Ionicons name="time-outline" size={16} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Class Time</Text>
                <Text style={styles.fieldValue}>{classTime}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.iconBubble}>
                <Ionicons name="send-outline" size={16} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Submitted On</Text>
                <Text style={styles.fieldValue}>{submittedOn}</Text>
              </View>
            </View>
          </View>

          {/* Document card */}
          <View style={styles.docCard}>
            <View style={styles.docTopRow}>
              <View style={styles.docIcon}>
                <Ionicons name="document-attach-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle2}>Attached file</Text>
                <Text style={styles.docSub}>
                  {hasFile ? "Document uploaded" : "No file attached"}
                </Text>
              </View>
            </View>

            {hasFile ? (
              <TouchableOpacity
                style={[styles.docBtn, opening && { opacity: 0.7 }]}
                onPress={handleOpenFile}
                disabled={opening}
                activeOpacity={0.9}
              >
                {opening ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="open-outline" size={16} color="#fff" />
                    <Text style={styles.docBtnText}>View document</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.background },
  topSafeArea: { flex: 0, backgroundColor: COLORS.background },
  contentContainer: { flex: 1, backgroundColor: COLORS.background },

  // Timetable-style header
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
    backgroundColor: COLORS.chipBg,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: COLORS.textDark },

  scrollContent: { padding: 16, paddingBottom: 28 },

  // Empty
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
  emptyTitle: { marginTop: 10, fontSize: 15, fontWeight: "900", color: "#64748B" },
  emptySub: { marginTop: 4, fontSize: 12.5, fontWeight: "700", color: "#94A3B8", textAlign: "center" },

  // Summary
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  summaryTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  summaryLabel: { fontSize: 12, fontWeight: "800", color: COLORS.textMuted },
  summaryValue: { marginTop: 4, fontSize: 18, fontWeight: "900", color: COLORS.textDark },

  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  statusChipText: { fontSize: 11.5, fontWeight: "900", letterSpacing: 0.2 },

  miniLabel: { fontSize: 12, fontWeight: "800", color: COLORS.textMuted, marginBottom: 6 },
  noteBox: {
    borderWidth: 1,
    borderColor: "#EEF0F6",
    backgroundColor: "#F7F8FC",
    borderRadius: 14,
    padding: 12,
  },
  noteText: { fontSize: 13.5, fontWeight: "700", color: COLORS.textDark, lineHeight: 20 },

  // Details
  detailCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: "900", color: COLORS.textDark, marginBottom: 10 },

  detailRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "rgba(58,122,254,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  fieldLabel: { fontSize: 12, fontWeight: "800", color: COLORS.textMuted },
  fieldValue: { marginTop: 3, fontSize: 14.5, fontWeight: "800", color: COLORS.textDark },

  // Document
  docCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  docTopRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(58,122,254,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle2: { fontSize: 14, fontWeight: "900", color: COLORS.textDark },
  docSub: { marginTop: 2, fontSize: 12.5, fontWeight: "700", color: COLORS.textMuted },

  docBtn: {
    height: 48,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  docBtnText: { color: "#fff", fontSize: 14, fontWeight: "900" },
});

export default AppealDetailScreen;
