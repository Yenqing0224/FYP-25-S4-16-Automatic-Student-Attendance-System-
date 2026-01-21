import React, { useMemo, useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Calendar from "expo-calendar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import UpcomingTab from "./tabs/upcoming_tab";
import PastTab from "./tabs/past_tab";
import CancelledTab from "./tabs/cancelled_tab";
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

  useEffect(() => {
    if (!selectedDate) {
      const sgTime = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" });
      setSelectedDate(sgTime);
    }
  }, [selectedDate]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(REMINDER_KEY);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) setSavedReminderIds(new Set(arr));
        }
      } catch {}
    })();
  }, []);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const res = await api.get("/timetable/");
      const rawData = Array.isArray(res.data) ? res.data : [];

      const formatted = rawData.map((c) => ({
        id: String(c.id),
        module: c.module?.code ?? c.module?.name ?? c.module ?? "MOD",
        title: c.module?.name ?? c.title ?? "Class",
        venue: c.venue ?? "TBA",
        time: `${String(c.start_time ?? "").slice(0, 5)} – ${String(c.end_time ?? "").slice(0, 5)}`,
        startISO: `${c.date}T${c.start_time}`,
        endISO: `${c.date}T${c.end_time}`,
        date: c.date,
        status: (c.status ?? "active").toLowerCase(), // active/cancelled/...
      }));

      setFullTimetable(formatted);
    } catch (err) {
      console.error("Timetable Fetch Error:", err);
      Alert.alert("Error", "Could not load timetable.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (route.params?.tab) {
        setActiveTab(route.params.tab);
        navigation.setParams({ tab: null });
      }

      if (route.params?.targetDate) {
        setActiveTab("Calendar");
        const iso = route.params.targetDate;
        const datePart = iso.includes("T") ? iso.split("T")[0] : iso;
        setSelectedDate(datePart);
        navigation.setParams({ targetDate: null });
      }

      fetchTimetable();

      if (route.params?.refreshKey) navigation.setParams({ refreshKey: null });
    }, [route.params?.tab, route.params?.targetDate, route.params?.refreshKey])
  );

  const upcoming = useMemo(() => {
    const now = Date.now();
    return fullTimetable
      .filter((c) => c.status !== "cancelled")
      .filter((c) => new Date(c.startISO).getTime() >= now)
      .sort((a, b) => new Date(a.startISO) - new Date(b.startISO));
  }, [fullTimetable]);

  const past = useMemo(() => {
    const now = Date.now();
    return fullTimetable
      .filter((c) => c.status !== "cancelled") // ✅ exclude cancelled
      .filter((c) => new Date(c.endISO).getTime() < now)
      .sort((a, b) => new Date(b.startISO) - new Date(a.startISO));
  }, [fullTimetable]);

  const cancelled = useMemo(() => {
    return fullTimetable
      .filter((c) => c.status === "cancelled")
      .sort((a, b) => new Date(b.startISO) - new Date(a.startISO));
  }, [fullTimetable]);

  // Reminder tracking
  const reminderIdFor = (cls) => `${cls.module}|${cls.startISO}|${cls.venue}`;
  const isAdded = (cls) => savedReminderIds.has(reminderIdFor(cls));
  const isSavingThis = (cls) => savingId === reminderIdFor(cls);

  const persistReminderIds = async (nextSet) => {
    await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(Array.from(nextSet)));
  };

  const addReminderToCalendar = async (cls) => {
    const rid = reminderIdFor(cls);
    if (savedReminderIds.has(rid)) return;

    setSavingId(rid);
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== "granted") return;

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCal = calendars.find((c) => c.allowsModifications) || calendars[0];
      if (!defaultCal) return;

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
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not add reminder.");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const tabs = ["Upcoming", "Past", "Cancelled", "Calendar"];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Sessions</Text>
        <View style={styles.badgePill}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
          <Text style={styles.badgeText}>{upcoming.length} upcoming</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        {tabs.map((t) => (
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
        />
      )}

      {activeTab === "Past" && (
        <PastTab
          COLORS={COLORS}
          navigation={navigation}
          list={past}
          isAdded={isAdded}
        />
      )}

      {activeTab === "Cancelled" && (
        <CancelledTab
          COLORS={COLORS}
          navigation={navigation}
          list={cancelled}
        />
      )}

      {activeTab === "Calendar" && (
        <CalendarTab
          COLORS={COLORS}
          navigation={navigation}
          sessions={fullTimetable}      // ✅ all sessions
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          isAdded={isAdded}
          isSavingThis={isSavingThis}
          addReminderToCalendar={addReminderToCalendar}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerRow: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: "900", color: COLORS.textDark },
  badgePill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: COLORS.soft },
  badgeText: { fontWeight: "900", color: COLORS.primary, fontSize: 12 },
  tabRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 8, flexWrap: "wrap" },
  tab: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: COLORS.soft, alignItems: "center" },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontWeight: "800", color: COLORS.primary },
  tabTextActive: { color: "#fff" },
});

export default LecturerSessionsScreen;
