import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Calendar from "expo-calendar";
import * as Clipboard from "expo-clipboard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../../api/api_client";

const COLORS = {
  primary: "#6D5EF5",
  background: "#F6F5FF",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  soft: "#ECE9FF",
  danger: "#DC2626",
};

const REMINDER_KEY = "lecturerReminderIds_v1";

const LecturerClassDetailScreen = ({ route, navigation }) => {
  const cls = route?.params?.cls;

  const [cancelling, setCancelling] = useState(false);

  const titleText = cls?.title || "Class Details";
  const moduleText = cls?.module || "-";
  const venueText = cls?.venue || "-";
  const timeText = cls?.time || "-";
  const startISO = cls?.startISO || null;
  const endISO = cls?.endISO || null;

  const isCancelled = String(cls?.status || "").toLowerCase() === "cancelled";

  const getDisplayDate = () => {
    if (cls?.fullDate) return cls.fullDate;

    if (cls?.date) {
      const parts = cls.date.split("-");
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    return "-";
  };

  const dateText = getDisplayDate();

  const isUpcomingAndNotEnded = useMemo(() => {
    if (isCancelled) return false;

    if (endISO) {
      const end = new Date(endISO).getTime();
      return !isNaN(end) && end > Date.now();
    }
    if (startISO) {
      const start = new Date(startISO).getTime();
      return !isNaN(start) && start > Date.now();
    }
    return false;
  }, [startISO, endISO, isCancelled]);

  const isNextClass = useMemo(() => {
    if (!startISO || isCancelled) return false;
    const start = new Date(startISO).getTime();
    const now = Date.now();
    const diff = start - now;
    return diff > 0 && diff <= 24 * 60 * 60 * 1000;
  }, [startISO, isCancelled]);

  const formatCopyText = () =>
    `${moduleText} - ${titleText}\nDate: ${dateText}\nTime: ${timeText}\nVenue: ${venueText}`;

  const copyDetails = async () => {
    try {
      await Clipboard.setStringAsync(formatCopyText());
      Alert.alert("Copied", "Class details copied to clipboard.");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not copy.");
    }
  };

  const reminderIdFor = () => `${moduleText}|${startISO || ""}|${venueText}`;

  const addReminderToCalendar = async () => {
    if (!startISO || !endISO) {
      Alert.alert("Missing time", "This class has no start/end time to add to calendar.");
      return;
    }

    try {
      const raw = await AsyncStorage.getItem(REMINDER_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      const rid = reminderIdFor();
      if (Array.isArray(arr) && arr.includes(rid)) {
        Alert.alert("Already added", "Reminder already tracked in Attendify.");
        return;
      }

      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow Calendar access to add reminders.");
        return;
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCal = calendars.find((c) => c.allowsModifications) || calendars[0];

      if (!defaultCal) {
        Alert.alert("No calendar found", "Please enable a calendar on your device.");
        return;
      }

      await Calendar.createEventAsync(defaultCal.id, {
        title: `${moduleText} - ${titleText}`,
        startDate: new Date(startISO),
        endDate: new Date(endISO),
        location: venueText,
        notes: "Created from Attendify (Lecturer).",
        timeZone: "Asia/Singapore",
      });

      const next = Array.isArray(arr) ? arr : [];
      next.push(rid);
      await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(next));

      Alert.alert("Done", "Reminder added to your calendar.");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not add reminder.");
    }
  };

  const cancelSession = async () => {
    if (!cls?.id) {
      Alert.alert("Missing", "No session id found.");
      return;
    }

    Alert.alert(
      "Cancel this session?",
      "This will mark the session as CANCELLED. It will remain in history.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setCancelling(true);

              await api.post("/reschedule-class/", { session_id: String(cls.id) });

              Alert.alert("Done", "Session cancelled.");

              // ✅ Force refresh Sessions screen
              navigation.navigate("LSessions", { refreshKey: Date.now() });
            } catch (e) {
              console.log("cancel session error:", e?.response?.status, e?.response?.data);
              Alert.alert("Error", "Could not cancel session.");
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (!cls) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.headerTitle}>Class Details</Text>
        <View style={styles.card}>
          <Text style={styles.emptyText}>No class data provided.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Class Details</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isNextClass && (
          <View style={styles.nextPill}>
            <Ionicons name="sparkles-outline" size={16} color={COLORS.primary} />
            <Text style={styles.nextPillText}>Next class within 24 hours</Text>
          </View>
        )}

        {isCancelled && (
          <View style={styles.cancelPill}>
            <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
            <Text style={styles.cancelPillText}>This session is CANCELLED</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.module}>{moduleText}</Text>
          <Text style={styles.title}>{titleText}</Text>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.textMuted} />
              <Text style={styles.label}>Date</Text>
            </View>
            <Text style={styles.value}>{dateText}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="time-outline" size={18} color={COLORS.textMuted} />
              <Text style={styles.label}>Time</Text>
            </View>
            <Text style={styles.value}>{timeText}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="location-outline" size={18} color={COLORS.textMuted} />
              <Text style={styles.label}>Venue</Text>
            </View>
            <Text style={styles.value}>{venueText}</Text>
          </View>

          {cls?.enrolledCount != null && (
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="people-outline" size={18} color={COLORS.textMuted} />
                <Text style={styles.label}>Enrolled</Text>
              </View>
              <Text style={styles.value}>{cls.enrolledCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Actions</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.primaryBtn} onPress={addReminderToCalendar}>
              <Ionicons name="bookmark-outline" size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>Add reminder</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={copyDetails}>
              <Ionicons name="copy-outline" size={16} color={COLORS.primary} />
              <Text style={styles.secondaryBtnText}>Copy details</Text>
            </TouchableOpacity>
          </View>

          {isUpcomingAndNotEnded && (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.dangerBtn, cancelling && { opacity: 0.7 }]}
                onPress={cancelSession}
                disabled={cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="close-circle-outline" size={16} color="#fff" />
                    <Text style={styles.dangerBtnText}>Cancel class</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    backgroundColor: COLORS.background,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { width: 30 },
  headerTitle: { fontSize: 20, fontWeight: "900", color: COLORS.textDark },

  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },

  nextPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.soft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  nextPillText: { color: COLORS.primary, fontWeight: "900", fontSize: 12 },

  cancelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  cancelPillText: { color: COLORS.danger, fontWeight: "900", fontSize: 12 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },

  module: { fontWeight: "900", color: COLORS.primary },
  title: { marginTop: 4, fontSize: 18, fontWeight: "900", color: COLORS.textDark },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },

  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  infoLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { color: COLORS.textMuted, fontWeight: "800" },
  value: { color: COLORS.textDark, fontWeight: "900", maxWidth: "55%", textAlign: "right" },

  cardTitle: { fontSize: 16, fontWeight: "900", color: COLORS.textDark },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 12 },

  primaryBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  secondaryBtn: {
    flex: 1,
    backgroundColor: COLORS.soft,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: { color: COLORS.primary, fontWeight: "900" },

  dangerBtn: {
    flex: 1,
    backgroundColor: COLORS.danger,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dangerBtnText: { color: "#fff", fontWeight: "900" },

  emptyText: { color: COLORS.textMuted, fontWeight: "700", textAlign: "center", marginBottom: 12 },
});

export default LecturerClassDetailScreen;
