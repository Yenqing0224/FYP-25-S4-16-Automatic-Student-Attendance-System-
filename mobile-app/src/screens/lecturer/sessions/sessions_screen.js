import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Calendar from "expo-calendar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import UpcomingTab from "./tabs/upcoming_tab";
import PastTab from "./tabs/past_tab";
import CalendarTab from "./tabs/calendar_tab";
import api from "../../../api/api_client";

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

const LecturerSessionsScreen = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [selectedDate, setSelectedDate] = useState(null);

  const [fullTimetable, setFullTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  const [savedReminderIds, setSavedReminderIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);

  // Jump logic + refreshKey logic
  useFocusEffect(
    useCallback(() => {
      // handle tab switch
      if (route.params?.tab) {
        setActiveTab(route.params.tab);
        navigation.setParams({ tab: null });
      }

      // handle calendar jump
      if (route.params?.targetDate) {
        setActiveTab("Calendar");
        const iso = route.params.targetDate;
        const datePart = iso.includes("T") ? iso.split("T")[0] : iso;
        setSelectedDate(datePart);
        navigation.setParams({ targetDate: null });
      }

      // ✅ ALWAYS refetch on focus + when refreshKey changes
      fetchTimetable();

      // ✅ clear refreshKey after consuming
      if (route.params?.refreshKey) {
        navigation.setParams({ refreshKey: null });
      }
    }, [route.params?.tab, route.params?.targetDate, route.params?.refreshKey])
  );

  useEffect(() => {
    if (!selectedDate) {
      const sgTime = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" });
      setSelectedDate(sgTime);
    }
  }, [selectedDate]);

  // Load reminder tracking
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(REMINDER_KEY);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) setSavedReminderIds(new Set(arr));
        }
      } catch (e) {
        console.error("Failed to load reminder ids", e);
      }
    })();
  }, []);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const res = await api.get("/timetable/");
      const rawData = res.data;

      const formatted = rawData.map((c) => ({
        id: String(c.id),
        module: c.module?.code || "MOD",
        title: c.module?.name || "Class",
        venue: c.venue || "TBA",
        time: `${String(c.start_time).slice(0, 5)} – ${String(c.end_time).slice(0, 5)}`,
        startISO: `${c.date}T${c.start_time}`,
        endISO: `${c.date}T${c.end_time}`,
        date: c.date,
        status: c.status || "active",
      }));

      setFullTimetable(formatted);
    } catch (err) {
      console.error("Timetable Fetch Error:", err);
      Alert.alert("Error", "Could not load timetable.");
    } finally {
      setLoading(false);
    }
  };

  // --- Derived Lists ---
  const upcoming = useMemo(() => {
    const now = new Date();
    return fullTimetable
      .filter((c) => String(c.status).toLowerCase() !== "cancelled")
      .filter((c) => new Date(c.startISO) >= now)
      .sort((a, b) => new Date(a.startISO) - new Date(b.startISO));
  }, [fullTimetable]);

  const past = useMemo(() => {
    const now = new Date();
    return fullTimetable
      .filter((c) => new Date(c.startISO) < now || String(c.status).toLowerCase() === "cancelled")
      .sort((a, b) => new Date(b.startISO) - new Date(a.startISO));
  }, [fullTimetable]);

  // --- Reminder Logic ---
  const reminderIdFor = (cls) => `${cls.module}|${cls.startISO}|${cls.venue}`;
  const isAdded = (cls) => savedReminderIds.has(reminderIdFor(cls));
  const isSavingThis = (cls) => savingId === reminderIdFor(cls);

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

  const remindersAddedTodayCount = useMemo(() => {
    let count = 0;
    const now = new Date();
    upcoming.forEach((cls) => {
      if (isAdded(cls)) {
        const d = new Date(cls.startISO);
        if (
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        ) {
          count++;
        }
      }
    });
    return count;
  }, [upcoming, savedReminderIds]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Sessions</Text>
        <View style={styles.badgePill}>
          <Ionicons name="bookmark" size={14} color={COLORS.primary} />
          <Text style={styles.badgeText}>{remindersAddedTodayCount} added today</Text>
        </View>
      </View>

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

      {activeTab === "Upcoming" && (
        <UpcomingTab
          COLORS={COLORS}
          navigation={navigation}
          list={upcoming}
          isAdded={isAdded}
          isSavingThis={isSavingThis}
          addReminderToCalendar={addReminderToCalendar}
          removeReminderTracking={removeReminderTracking}
          refreshTimetable={fetchTimetable}
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
          upcoming={fullTimetable}
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
};

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

export default LecturerSessionsScreen;
