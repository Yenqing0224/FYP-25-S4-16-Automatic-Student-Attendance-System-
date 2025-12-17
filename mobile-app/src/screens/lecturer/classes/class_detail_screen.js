import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Calendar from "expo-calendar";
import * as Clipboard from "expo-clipboard";
import AsyncStorage from "@react-native-async-storage/async-storage";

const COLORS = {
  // Lecturer theme (keep same structure as student, but different primary)
  primary: "#6D5EF5",
  background: "#F6F5FF",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  soft: "#ECE9FF",
};

const REMINDER_KEY = "lecturerReminderIds_v1";

export default function LecturerClassDetailScreen({ route, navigation }) {
  const cls = route?.params?.cls;

  const titleText = cls?.title || "Class Details";
  const moduleText = cls?.module || "-";
  const venueText = cls?.venue || "-";
  const timeText = cls?.time || "-";
  const startISO = cls?.startISO || null;
  const endISO = cls?.endISO || null;

  const isNextClass = useMemo(() => {
    // simple highlight: if class is today and in the future
    if (!startISO) return false;
    const start = new Date(startISO).getTime();
    const now = Date.now();
    const diff = start - now;
    // next class if within next 24h and not started yet
    return diff > 0 && diff <= 24 * 60 * 60 * 1000;
  }, [startISO]);

  const formatCopyText = () =>
    `${moduleText} - ${titleText}\n${timeText}\n${venueText}`;

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
      // optional: prevent duplicate in Attendify tracking
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

      // Save tracking id (so Sessions/Home shows Added ✅)
      const next = Array.isArray(arr) ? arr : [];
      next.push(rid);
      await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(next));

      Alert.alert("Done", "Reminder added to your calendar.");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not add reminder.");
    }
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Class Details</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Next class highlight */}
        {isNextClass && (
          <View style={styles.nextPill}>
            <Ionicons name="sparkles-outline" size={16} color={COLORS.primary} />
            <Text style={styles.nextPillText}>Next class within 24 hours</Text>
          </View>
        )}

        {/* Main card */}
        <View style={styles.card}>
          <Text style={styles.module}>{moduleText}</Text>
          <Text style={styles.title}>{titleText}</Text>

          <View style={styles.divider} />

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

          {/* Optional info (safe for lecturer) */}
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

        {/* Actions card */}
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
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

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

  emptyText: { color: COLORS.textMuted, fontWeight: "700", textAlign: "center", marginBottom: 12 },
});
