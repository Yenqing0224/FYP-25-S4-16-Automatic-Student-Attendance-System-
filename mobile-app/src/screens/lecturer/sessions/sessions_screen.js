// src/screens/lecturer/sessions/sessions_screen.js
import React, { useMemo, useState, useCallback, useEffect } from "react";
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
import RescheduledTab from "./tabs/rescheduled_tab";
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
const RESCHEDULE_HISTORY_KEY = "lecturerRescheduleHistory_v1";
const RESCHEDULE_OVERRIDES_KEY = "lecturerRescheduleOverrides_v1";

/** ✅ Always derive date + time from ISO so fields never mismatch */
const deriveFieldsFromISO = (c) => {
  const startISO = String(c?.startISO ?? "");
  const endISO = String(c?.endISO ?? "");

  const date = startISO.includes("T")
    ? startISO.split("T")[0]
    : String(c?.date ?? "");
  const startTime = startISO.length >= 16 ? startISO.slice(11, 16) : "";
  const endTime = endISO.length >= 16 ? endISO.slice(11, 16) : "";

  return {
    ...c,
    date,
    time:
      startTime && endTime ? `${startTime} – ${endTime}` : c?.time ?? "-",
  };
};

/** ✅ Dedup same id; keep rescheduled if exists; else best venue */
const dedupeByIdPreferRescheduled = (arr = []) => {
  const map = new Map();

  for (const item of arr) {
    const id = String(item?.id ?? item?._id ?? "");
    if (!id) continue;

    const existing = map.get(id);
    if (!existing) {
      map.set(id, item);
      continue;
    }

    const a = String(existing?.status ?? "").toLowerCase();
    const b = String(item?.status ?? "").toLowerCase();

    // Prefer rescheduled over active
    if (a !== "rescheduled" && b === "rescheduled") {
      map.set(id, item);
      continue;
    }
    if (a === "rescheduled" && b !== "rescheduled") {
      continue;
    }

    // If both same status, prefer better venue (not empty, not TBA)
    const exVenue = String(existing?.venue ?? "").trim();
    const itVenue = String(item?.venue ?? "").trim();
    const exScore = exVenue && exVenue !== "TBA" ? 1 : 0;
    const itScore = itVenue && itVenue !== "TBA" ? 1 : 0;

    if (itScore > exScore) map.set(id, item);
  }

  return Array.from(map.values());
};

/** ✅ Dedupe “Upcoming + Rescheduled duplicate” by signature; prefer rescheduled */
const dedupePreferRescheduledBySignature = (arr = []) => {
  const map = new Map();

  const sig = (x) => {
    const module = String(x?.module ?? "");
    const title = String(x?.title ?? "");
    const start = String(x?.startISO ?? "").slice(0, 16); // yyyy-mm-ddThh:mm
    return `${module}|${title}|${start}`;
  };

  for (const item of arr) {
    const key = sig(item);
    if (!key) continue;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, item);
      continue;
    }

    const a = String(existing?.status ?? "").toLowerCase();
    const b = String(item?.status ?? "").toLowerCase();

    if (a !== "rescheduled" && b === "rescheduled") map.set(key, item);
  }

  return Array.from(map.values());
};

const LecturerSessionsScreen = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [selectedDate, setSelectedDate] = useState(null);

  const [fullTimetable, setFullTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  const [savedReminderIds, setSavedReminderIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);

  const [rescheduleHistory, setRescheduleHistory] = useState([]);
  const [overrides, setOverrides] = useState({});

  useEffect(() => {
    if (!selectedDate) {
      const sgTime = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Singapore",
      });
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

      const formatted = rawData.map((c) => {
        const base = {
          id: String(c.id),
          module: c.module?.code ?? c.module?.name ?? c.module ?? "MOD",
          title: c.module?.name ?? c.title ?? "Class",
          venue: c.venue ?? "TBA",
          startISO: `${c.date}T${c.start_time}`,
          endISO: `${c.date}T${c.end_time}`,
          status: (c.status ?? "active").toLowerCase(),
        };
        return deriveFieldsFromISO(base);
      });

      setFullTimetable(formatted);
    } catch (err) {
      console.error("Timetable Fetch Error:", err);
      Alert.alert("Error", "Could not load timetable.");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem(RESCHEDULE_HISTORY_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      setRescheduleHistory(Array.isArray(arr) ? arr : []);
    } catch {
      setRescheduleHistory([]);
    }
  };

  const loadOverrides = async () => {
    try {
      const raw = await AsyncStorage.getItem(RESCHEDULE_OVERRIDES_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      setOverrides(obj && typeof obj === "object" ? obj : {});
    } catch {
      setOverrides({});
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
      loadHistory();
      loadOverrides();

      if (route.params?.refreshKey) navigation.setParams({ refreshKey: null });
    }, [route.params?.tab, route.params?.targetDate, route.params?.refreshKey])
  );

  const mergedTimetable = useMemo(() => {
    const merged = (fullTimetable || []).map((c) => {
      const o = overrides?.[String(c.id)];
      if (!o) return c;

      const mergedOne = {
        ...c,
        ...o,
        id: String(c.id),
        status: "rescheduled",
      };

      return deriveFieldsFromISO(mergedOne);
    });

    const byId = dedupeByIdPreferRescheduled(merged);
    return dedupePreferRescheduledBySignature(byId);
  }, [fullTimetable, overrides]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return mergedTimetable
      .filter((c) => c.status !== "cancelled")
      .filter((c) => new Date(c.startISO).getTime() >= now)
      .sort((a, b) => new Date(a.startISO) - new Date(b.startISO));
  }, [mergedTimetable]);

  const past = useMemo(() => {
    const now = Date.now();
    return mergedTimetable
      .filter((c) => c.status !== "cancelled")
      .filter((c) => new Date(c.endISO).getTime() < now)
      .sort((a, b) => new Date(b.startISO) - new Date(a.startISO));
  }, [mergedTimetable]);

  // Reminder tracking
  const reminderIdFor = (cls) => `${cls.module}|${cls.startISO}|${cls.venue}`;
  const isAdded = (cls) => savedReminderIds.has(reminderIdFor(cls));
  const isSavingThis = (cls) => savingId === reminderIdFor(cls);

  const persistReminderIds = async (nextSet) => {
    await AsyncStorage.setItem(
      REMINDER_KEY,
      JSON.stringify(Array.from(nextSet))
    );
  };

  const addReminderToCalendar = async (cls) => {
    const rid = reminderIdFor(cls);
    if (savedReminderIds.has(rid)) return;

    setSavingId(rid);
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== "granted") return;

      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT
      );
      const defaultCal =
        calendars.find((c) => c.allowsModifications) || calendars[0];
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

  const removeReminderTracking = async (cls) => {
    const rid = reminderIdFor(cls);
    Alert.alert("Remove reminder?", "This removes it from Attendify tracking.", [
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
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const tabs = ["Upcoming", "Past", "Rescheduled", "Calendar"];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Sessions</Text>
          <Text style={styles.headerSubText}>
            Manage upcoming, past & rescheduled classes
          </Text>
        </View>

        <View style={styles.badgePill}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
          <Text style={styles.badgeText}>{upcoming.length} upcoming</Text>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabBar}>
        {tabs.map((t) => {
          const active = activeTab === t;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              onPress={() => setActiveTab(t)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {t}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* CONTENT */}
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

      {activeTab === "Rescheduled" && (
        <RescheduledTab
          COLORS={COLORS}
          navigation={navigation}
          list={rescheduleHistory}
        />
      )}

      {activeTab === "Calendar" && (
        <CalendarTab
          COLORS={COLORS}
          navigation={navigation}
          sessions={mergedTimetable}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          isAdded={isAdded}
          isSavingThis={isSavingThis}
          addReminderToCalendar={addReminderToCalendar}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setActiveTab("Calendar")}
        activeOpacity={0.9}
      >
        <Ionicons name="calendar" size={18} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // HEADER
  header: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  headerLeft: { flex: 1, paddingRight: 12 },
  headerTitle: { fontSize: 22, fontWeight: "900", color: COLORS.textDark },
  headerSubText: { marginTop: 2, fontSize: 12.5, color: COLORS.textMuted },

  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.soft,
  },
  badgeText: { fontWeight: "900", color: COLORS.primary, fontSize: 12 },

  // TABS (SEGMENTED)
  tabBar: {
    marginTop: 12,
    marginHorizontal: 16,
    padding: 6,
    borderRadius: 16,
    backgroundColor: COLORS.soft,
    flexDirection: "row",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtnActive: {
    backgroundColor: COLORS.card,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  tabLabel: {
    fontWeight: "800",
    color: COLORS.primary,
    fontSize: 12.5,
  },
  tabLabelActive: { color: COLORS.textDark },

  // FAB
  fab: {
    position: "absolute",
    right: 18,
    bottom: 18,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
});

export default LecturerSessionsScreen;
