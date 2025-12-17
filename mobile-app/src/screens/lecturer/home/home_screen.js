// src/screens/lecturer/home/home_screen.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Calendar from "expo-calendar";
import AsyncStorage from "@react-native-async-storage/async-storage";

const COLORS = {
  primary: "#6D5EF5",
  background: "#F6F5FF",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  soft: "#ECE9FF",
};

const REMINDER_KEY = "lecturerReminderIds_v1";

export default function LecturerHomeScreen({ navigation }) {
  const [savedReminderIds, setSavedReminderIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);

  // ✅ Dummy data now (swap to API later)
  const classes = [
    {
      id: "1",
      module: "CSIT321",
      title: "Software Dev Methodologies (Lecture)",
      dateLabel: "Today",
      startISO: "2025-12-16T10:00:00+08:00",
      endISO: "2025-12-16T12:00:00+08:00",
      time: "10:00 – 12:00",
      venue: "LT27",
    },
    {
      id: "2",
      module: "IS312",
      title: "Tutorial",
      dateLabel: "Today",
      startISO: "2025-12-16T14:00:00+08:00",
      endISO: "2025-12-16T16:00:00+08:00",
      time: "14:00 – 16:00",
      venue: "COM2-02-15",
    },
  ];

  const nextClass = classes[0];

  const summary = {
    today: classes.filter((c) => c.dateLabel === "Today").length,
    week: 7, // dummy
  };

  const announcements = [
    { id: "a1", title: "Week 10 makeup class", desc: "Venue changed to LT19A for CSIT321.", date: "Today" },
    { id: "a2", title: "System maintenance", desc: "Attendify may be slow on Friday 8–10pm.", date: "Fri" },
  ];

  const reminderIdFor = (cls) => `${cls.module}|${cls.startISO}|${cls.venue}`;
  const isAdded = (cls) => savedReminderIds.has(reminderIdFor(cls));
  const isSavingThis = (cls) => savingId === reminderIdFor(cls);

  // Load saved reminder ids once
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(REMINDER_KEY);
        if (!raw) return;
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setSavedReminderIds(new Set(arr));
      } catch (e) {
        console.error("Failed to load reminder ids", e);
      }
    })();
  }, []);

  const persistReminderIds = async (nextSet) => {
    try {
      await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(Array.from(nextSet)));
    } catch (e) {
      console.error("Failed to save reminder ids", e);
    }
  };

  const goToSessionsTab = () => {
    const parent = navigation.getParent?.();
    if (parent) parent.navigate("LSessions");
    else navigation.navigate("LSessions");
  };

  const addReminderToCalendar = async (cls) => {
    const rid = reminderIdFor(cls);

    if (savedReminderIds.has(rid)) {
      Alert.alert("Already added", "This reminder is already in your calendar.");
      return;
    }

    setSavingId(rid);

    try {
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
        title: `${cls.module} - ${cls.title}`,
        startDate: new Date(cls.startISO),
        endDate: new Date(cls.endISO),
        location: cls.venue,
        notes: "Created from Attendify (Lecturer).",
        timeZone: "Asia/Singapore",
      });

      // ✅ Update UI + persist
      const next = new Set(savedReminderIds);
      next.add(rid);
      setSavedReminderIds(next);
      await persistReminderIds(next);

      Alert.alert("Done", "Reminder added to your calendar.");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not add reminder.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.hi}>Welcome back</Text>
            <Text style={styles.name}>Lecturer 👩‍🏫</Text>

            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>Lecturer Mode</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.iconBtn} onPress={goToSessionsTab}>
            <Ionicons name="calendar-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Summary (pressable) */}
        <View style={styles.summaryRow}>
          <TouchableOpacity
            style={styles.summaryCard}
            onPress={() => navigation.navigate("LecturerClassList", { mode: "today", classes })}
          >
            <Text style={styles.summaryValue}>{summary.today}</Text>
            <Text style={styles.summaryLabel}>Classes today</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.summaryCard}
            onPress={() => navigation.navigate("LecturerClassList", { mode: "week", classes })}
          >
            <Text style={styles.summaryValue}>{summary.week}</Text>
            <Text style={styles.summaryLabel}>Classes this week</Text>
          </TouchableOpacity>
        </View>

        {/* Next class */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle}>Next class</Text>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{nextClass.dateLabel}</Text>
            </View>
          </View>

          <Text style={styles.module}>{nextClass.module}</Text>
          <Text style={styles.title}>{nextClass.title}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{nextClass.time}</Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{nextClass.venue}</Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.primaryBtn} onPress={goToSessionsTab}>
              <Ionicons name="open-outline" size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>View sessions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, isAdded(nextClass) && { opacity: 0.65 }]}
              disabled={isAdded(nextClass) || isSavingThis(nextClass)}
              onPress={() => addReminderToCalendar(nextClass)}
            >
              <Ionicons
                name={isAdded(nextClass) ? "checkmark-circle-outline" : "bookmark-outline"}
                size={16}
                color={COLORS.primary}
              />
              <Text style={styles.secondaryBtnText}>
                {isSavingThis(nextClass) ? "Adding..." : isAdded(nextClass) ? "Added" : "Add reminder"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.detailLink}
            onPress={() => navigation.navigate("LecturerClassDetail", { cls: nextClass })}
          >
            <Text style={styles.detailLinkText}>Open class details</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Announcements */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle}>Announcements</Text>
            <Ionicons name="megaphone-outline" size={18} color={COLORS.primary} />
          </View>

          {announcements.map((a, idx) => (
            <View key={a.id}>
              <TouchableOpacity
                style={styles.announceItem}
                onPress={() => navigation.navigate("LecturerAnnouncementDetail", { announcement: a })}
              >
                <Text style={styles.announceTitle}>{a.title}</Text>
                <Text style={styles.announceDesc} numberOfLines={2}>
                  {a.desc}
                </Text>
              </TouchableOpacity>

              {idx !== announcements.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, paddingTop: 14 },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hi: { color: COLORS.textMuted, fontWeight: "600" },
  name: { marginTop: 2, fontSize: 22, fontWeight: "800", color: COLORS.textDark },

  rolePill: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  rolePillText: { color: "#fff", fontWeight: "900", fontSize: 12 },

  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.soft,
    justifyContent: "center",
    alignItems: "center",
  },

  summaryRow: { flexDirection: "row", gap: 12, marginTop: 14 },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryValue: { fontSize: 20, fontWeight: "900", color: COLORS.textDark },
  summaryLabel: { marginTop: 4, color: COLORS.textMuted, fontWeight: "600" },

  card: {
    marginTop: 14,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textDark },

  pill: { backgroundColor: COLORS.soft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { color: COLORS.primary, fontWeight: "800", fontSize: 12 },

  module: { marginTop: 10, fontWeight: "900", color: COLORS.primary },
  title: { marginTop: 2, fontSize: 16, fontWeight: "800", color: COLORS.textDark },

  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 },
  metaText: { color: COLORS.textMuted, fontWeight: "600" },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
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
  primaryBtnText: { color: "#fff", fontWeight: "800" },

  secondaryBtn: {
    flex: 1,
    backgroundColor: COLORS.soft,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  secondaryBtnText: { color: COLORS.primary, fontWeight: "800" },

  detailLink: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLinkText: { color: COLORS.primary, fontWeight: "900" },

  announceItem: { paddingVertical: 10 },
  announceTitle: { fontWeight: "900", color: COLORS.textDark },
  announceDesc: { marginTop: 4, color: COLORS.textMuted, fontWeight: "700", lineHeight: 18 },

  divider: { height: 1, backgroundColor: COLORS.border },
});
