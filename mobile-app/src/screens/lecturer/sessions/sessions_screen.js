// src/screens/lecturer/sessions/sessions_screen.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Calendar from "expo-calendar";
import AsyncStorage from "@react-native-async-storage/async-storage";

import UpcomingTab from "./tabs/upcoming_tab";
import PastTab from "./tabs/past_tab";
import CalendarTab from "./tabs/calendar_tab";

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

export default function LecturerSessionsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState("Upcoming"); // Upcoming | Past | Calendar
  const [selectedDate, setSelectedDate] = useState(null);
  const [savedReminderIds, setSavedReminderIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);
  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(new Date().toISOString().slice(0, 10));
    }
  }, [selectedDate]);
  // ✅ Dummy data now (replace with API later)
  const upcoming = useMemo(() => ([
    { id: "1", module: "CSIT321", title: "Lecture", time: "10:00 – 12:00", venue: "LT27", startISO: "2025-12-16T10:00:00+08:00", endISO: "2025-12-16T12:00:00+08:00" },
    { id: "2", module: "IS312", title: "Tutorial", time: "14:00 – 16:00", venue: "COM2-02-15", startISO: "2025-12-16T14:00:00+08:00", endISO: "2025-12-16T16:00:00+08:00" },
  ]), []);

  const past = useMemo(() => ([
    { id: "3", module: "CSIT321", title: "Lecture", time: "Mon 10:00 – 12:00", venue: "LT27", startISO: "2025-12-09T10:00:00+08:00", endISO: "2025-12-09T12:00:00+08:00" },
  ]), []);


  const reminderIdFor = (cls) => `${cls.module}|${cls.startISO}|${cls.venue}`;
  const isAdded = (cls) => savedReminderIds.has(reminderIdFor(cls));
  const isSavingThis = (cls) => savingId === reminderIdFor(cls);

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
    await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(Array.from(nextSet)));
  };

  const addReminderToCalendar = async (cls) => {
    const rid = reminderIdFor(cls);
    if (savedReminderIds.has(rid)) {
      Alert.alert("Already added", "This reminder is already tracked.");
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

  const removeReminderTracking = async (cls) => {
    const rid = reminderIdFor(cls);
    Alert.alert(
      "Remove reminder?",
      "This removes it from Attendify tracking. You can delete the calendar event in your Calendar app.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const next = new Set(savedReminderIds);
            next.delete(rid);
            setSavedReminderIds(next);
            await persistReminderIds(next);
          },
        },
      ]
    );
  };

  const isTodayISO = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  };

  const remindersAddedTodayCount = useMemo(() => {
    let count = 0;
    upcoming.forEach((cls) => {
      if (isAdded(cls) && isTodayISO(cls.startISO)) count += 1;
    });
    return count;
  }, [savedReminderIds]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Sessions</Text>
        <View style={styles.badgePill}>
          <Ionicons name="bookmark" size={14} color={COLORS.primary} />
          <Text style={styles.badgeText}>{remindersAddedTodayCount} added today</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {["Upcoming", "Past", "Calendar"].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === "Upcoming" && (
        <UpcomingTab
          COLORS={COLORS}
          navigation={navigation}
          list={upcoming}
          isAdded={isAdded}
          isSavingThis={isSavingThis}
          addReminderToCalendar={addReminderToCalendar}
          removeReminderTracking={removeReminderTracking}
        />
      )}

      {activeTab === "Past" && (
        <PastTab
          COLORS={COLORS}
          navigation={navigation}
          list={past}
          isAdded={isAdded}
          removeReminderTracking={removeReminderTracking}
        />
      )}

      {activeTab === "Calendar" && (
        <CalendarTab
          COLORS={COLORS}
          navigation={navigation}
          upcoming={upcoming}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          isAdded={isAdded}
          isSavingThis={isSavingThis}
          addReminderToCalendar={addReminderToCalendar}
          removeReminderTracking={removeReminderTracking}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "900", color: COLORS.textDark },

  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.soft,
  },
  badgeText: { fontWeight: "900", color: COLORS.primary, fontSize: 12 },

  tabRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: COLORS.soft, alignItems: "center" },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontWeight: "800", color: COLORS.primary },
  tabTextActive: { color: "#fff" },
});
