// src/screens/student/timetable/timetable_screen.js

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../../api/api_client";
import * as ExpoCalendar from "expo-calendar";
import { Ionicons } from "@expo/vector-icons";

const REMINDER_KEY = "studentReminderIds_v1";

const COLORS = {
  primary: "#3A7AFE",
  background: "#F5F7FB",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  borderSoft: "#E5E7EB",

  border: "#E5E7EB",
  chipBg: "rgba(58,122,254,0.12)",
  shadow: "rgba(0,0,0,0.08)",
};

const toText = (v, fallback = "") => {
  if (v == null) return fallback;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map((x) => toText(x, "")).filter(Boolean).join(", ") || fallback;
  if (typeof v === "object") return String(v.name ?? v.title ?? v.code ?? v.id ?? fallback);
  return fallback;
};

const normalizeModule = (m) => {
  if (!m) return { code: "", name: "" };
  if (typeof m === "string") return { code: m, name: "" };
  return { code: toText(m.code, ""), name: toText(m.name, "") };
};

const TimetableScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState("Selected");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const [fullSchedule, setFullSchedule] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(true);

  // Reminder tracking
  const [savedReminderIds, setSavedReminderIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);

  // Bulk add state
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });

  // Load reminder
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(REMINDER_KEY);
        if (!raw) return;
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setSavedReminderIds(new Set(arr.map(String)));
      } catch (e) {
        console.error("Failed to load student reminder ids", e);
      }
    })();
  }, []);

  const persistReminderIds = async (nextSet) => {
    try {
      await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(Array.from(nextSet)));
    } catch (e) {
      console.error("Failed to save student reminder ids", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const checkJumpDate = async () => {
        try {
          const jumpDate = await AsyncStorage.getItem("jumpToDate");
          if (jumpDate) {
            setSelectedDate(jumpDate);
            setActiveTab("Selected");
            await AsyncStorage.removeItem("jumpToDate");
          }
        } catch (e) {
          console.error("Jump error:", e);
        }
      };
      checkJumpDate();
    }, [])
  );

  // Fetch timetable
  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const response = await api.get("/timetable/");
      const raw = Array.isArray(response.data) ? response.data : [];

      const normalized = raw.map((item) => {
        const mod = normalizeModule(item?.module);
        return {
          ...item,
          id: item?.id,
          module: { ...item?.module, code: mod.code, name: mod.name },
          venue: toText(item?.venue, ""),
          session_type: toText(item?.type, ""),
          date: toText(item?.date, ""),
          start_time: toText(item?.start_time, ""),
          end_time: toText(item?.end_time, ""),
        };
      });

      setFullSchedule(normalized);
      processCalendarDots(normalized);
    } catch (error) {
      console.error("Timetable Error:", error);
      setFullSchedule([]);
      setMarkedDates({});
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const formatTime = (timeString) => {
    const s = toText(timeString, "");
    return s ? s.slice(0, 5) : "";
  };

  const formatDateHeader = (dateString) => {
    const ds = toText(dateString, "");
    if (!ds) return "";
    const date = new Date(ds);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatDateShort = (dateString) => {
    const ds = toText(dateString, "");
    if (!ds) return "";
    const date = new Date(ds);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  };

  const getJsDate = (item) => {
    const d = toText(item?.date, "");
    const t = formatTime(item?.start_time);
    return new Date(`${d}T${t || "00:00"}:00`);
  };

  const processCalendarDots = (data) => {
    const marks = {};
    data.forEach((session) => {
      const dateKey = toText(session?.date, "");
      if (!dateKey) return;

      const existing = marks[dateKey]?.dots || [];
      marks[dateKey] = {
        dots: [...existing, { key: `class-${existing.length}`, color: "#90CAF9" }],
      };
    });
    setMarkedDates(marks);
  };

  const getDisplayMarkedDates = () => {
    const newMarked = { ...markedDates };
    if (newMarked[selectedDate]) {
      newMarked[selectedDate] = {
        ...newMarked[selectedDate],
        selected: true,
        selectedColor: "#3F4E85",
        dots: [{ key: "class", color: "#ffffff" }],
      };
    } else {
      newMarked[selectedDate] = { selected: true, selectedColor: "#3F4E85" };
    }
    return newMarked;
  };

  const reminderIdFor = (item) => {
    const code = toText(item?.module?.code, "MOD");
    return `${code}|${toText(item?.date, "")}|${toText(item?.start_time, "")}|${toText(item?.venue, "")}`;
  };

  const buildStartEndDates = (item) => {
    const date = toText(item?.date, "");
    const startT = formatTime(item?.start_time);
    const endT = formatTime(item?.end_time);

    const start = new Date(`${date}T${startT || "00:00"}:00+08:00`);
    let end;

    if (endT) end = new Date(`${date}T${endT}:00+08:00`);
    else end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    return { start, end };
  };

  const getDefaultCalendarId = async () => {
    const { status } = await ExpoCalendar.requestCalendarPermissionsAsync();
    if (status !== "granted") return null;

    const calendars = await ExpoCalendar.getCalendarsAsync(ExpoCalendar.EntityTypes.EVENT);
    const defaultCal = calendars.find((c) => c.allowsModifications) || calendars[0];
    return defaultCal?.id || null;
  };

  const addAllToCalendar = async ({ onlyUpcoming = true } = {}) => {
    if (bulkSaving) return;

    const now = new Date();
    const targets = (onlyUpcoming ? fullSchedule.filter((x) => getJsDate(x) > now) : fullSchedule).sort(
      (a, b) => getJsDate(a) - getJsDate(b)
    );

    if (targets.length === 0) {
      Alert.alert("Nothing to add", onlyUpcoming ? "No upcoming classes." : "No classes found.");
      return;
    }

    setBulkSaving(true);
    setBulkProgress({ done: 0, total: targets.length });

    try {
      const calId = await getDefaultCalendarId();
      if (!calId) {
        Alert.alert("Permission needed", "Please allow Calendar access to add reminders.");
        return;
      }

      let added = 0;
      let skipped = 0;
      let failed = 0;

      const next = new Set(savedReminderIds);

      for (let i = 0; i < targets.length; i++) {
        const item = targets[i];
        const rid = reminderIdFor(item);

        if (next.has(rid)) {
          skipped++;
          setBulkProgress({ done: i + 1, total: targets.length });
          continue;
        }

        try {
          const { start, end } = buildStartEndDates(item);
          const moduleCode = toText(item?.module?.code, "Module");
          const moduleName = toText(item?.module?.name, "Class");

          await ExpoCalendar.createEventAsync(calId, {
            title: `${moduleCode} - ${moduleName}`,
            startDate: start,
            endDate: end,
            location: toText(item?.venue, ""),
            notes: "Created from Attendify (Student).",
            timeZone: "Asia/Singapore",
          });

          next.add(rid);
          added++;
        } catch (e) {
          failed++;
        }

        setBulkProgress({ done: i + 1, total: targets.length });
      }

      setSavedReminderIds(next);
      await persistReminderIds(next);

      Alert.alert("Done", `Added: ${added}\nSkipped: ${skipped}\nFailed: ${failed}`);
    } finally {
      setBulkSaving(false);
      setBulkProgress({ done: 0, total: 0 });
    }
  };

  // UI helpers
  const goToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
    setActiveTab("Selected");
  };

  const renderSelectedContent = () => {
    const classesForDay = fullSchedule.filter((item) => toText(item.date, "") === selectedDate);

    return (
      <View>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionDateTitle}>{formatDateHeader(selectedDate)}</Text>

          <TouchableOpacity style={styles.todayPill} onPress={goToday} activeOpacity={0.9}>
            <Ionicons name="today-outline" size={14} color="#fff" />
            <Text style={styles.todayPillText}>Today</Text>
          </TouchableOpacity>
        </View>

        {classesForDay.length > 0 ? (
          classesForDay.map((item) => {
            const moduleCode = toText(item?.module?.code, "MOD");
            const moduleName = toText(item?.module?.name, "Class");
            const venue = toText(item?.venue, "TBA");

            return (
              <TouchableOpacity
                key={String(item.id)}
                style={[styles.eventCard, styles.cardSelected]}
                onPress={() => navigation.navigate("ClassDetail", { session_id: item.id })}
                activeOpacity={0.92}
              >
                <View style={[styles.cardAccent, { backgroundColor: "#3F4E85" }]} />

                <View style={styles.cardContent}>
                  <Text style={styles.eventTitle} numberOfLines={2}>
                    {moduleCode} · {moduleName}
                  </Text>

                  <View style={styles.metaLine}>
                    <Ionicons name="time-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.eventTime}>{formatTime(item.start_time)}</Text>

                    <View style={{ width: 10 }} />

                    <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.eventLoc} numberOfLines={1}>
                      {venue}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={36} color="#CBD5E1" />
            <Text style={styles.emptyText}>No classes scheduled for this day.</Text>
          </View>
        )}
      </View>
    );
  };

  const renderUpcomingContent = () => {
    const now = new Date();
    const upcoming = fullSchedule
      .filter((item) => getJsDate(item) > now)
      .sort((a, b) => getJsDate(a) - getJsDate(b));

    const allUpcomingAdded =
      upcoming.length > 0 && upcoming.every((x) => savedReminderIds.has(reminderIdFor(x)));

    return (
      <View>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Upcoming classes</Text>
            <Text style={styles.sectionSub}>
              {upcoming.length} class{upcoming.length === 1 ? "" : "es"}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <TouchableOpacity onPress={goToday} activeOpacity={0.9} style={styles.sectionChip}>
              <Ionicons name="today-outline" size={14} color={COLORS.primary} />
              <Text style={styles.sectionChipText}>Go to today</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => addAllToCalendar({ onlyUpcoming: false })}
              activeOpacity={0.9}
              style={styles.sectionChip}
              disabled={bulkSaving || allUpcomingAdded}
            >
              <Ionicons
                name={bulkSaving ? "time-outline" : allUpcomingAdded ? "checkmark-circle-outline" : "calendar-outline"}
                size={14}
                color={COLORS.primary}
              />
              <Text style={styles.sectionChipText}>
                {bulkSaving
                  ? `Adding ${bulkProgress.done}/${bulkProgress.total}`
                  : allUpcomingAdded
                  ? "Added"
                  : "Add all"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {upcoming.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-clear-outline" size={36} color="#CBD5E1" />
            <Text style={styles.emptyText}>No upcoming classes.</Text>
          </View>
        ) : (
          upcoming.slice(0, 5).map((item) => {
            const moduleCode = toText(item?.module?.code, "MOD");
            const moduleName = toText(item?.module?.name, "Class");
            const venue = toText(item?.venue, "TBA");
            const sessionType = toText(item?.session_type, "Class");

            return (
              <TouchableOpacity
                key={String(item.id)}
                style={[styles.eventCard, styles.cardUpcomingModern]}
                onPress={() => navigation.navigate("ClassDetail", { session_id: item.id })}
                activeOpacity={0.92}
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.upTitle} numberOfLines={2}>
                    {moduleCode} • {moduleName}
                  </Text>

                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{sessionType}</Text>
                  </View>
                </View>

                <View style={styles.metaBlock}>
                  <View style={styles.metaRow2}>
                    <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} />
                    <Text style={styles.metaLabel}>Date</Text>
                    <Text style={styles.metaValue}>{formatDateShort(item.date)}</Text>
                  </View>

                  <View style={styles.metaRow2}>
                    <Ionicons name="time-outline" size={16} color={COLORS.textMuted} />
                    <Text style={styles.metaLabel}>Time</Text>
                    <Text style={styles.metaValue}>{formatTime(item.start_time)}</Text>
                  </View>

                  <View style={styles.metaRow2}>
                    <Ionicons name="location-outline" size={16} color={COLORS.textMuted} />
                    <Text style={styles.metaLabel}>Location</Text>
                    <Text style={styles.metaValue} numberOfLines={1}>
                      {venue}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView edges={["top"]} style={styles.topSafeArea} />
      <View style={styles.contentContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Timetable</Text>

          <TouchableOpacity onPress={goToday} style={styles.refreshBtn} activeOpacity={0.85}>
            <Ionicons name="today-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading timetable...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.calendarCard}>
              <Calendar
                current={selectedDate}
                key={selectedDate}
                onDayPress={(day) => {
                  setSelectedDate(day.dateString);
                  setActiveTab("Selected");
                }}
                markingType={"multi-dot"}
                markedDates={getDisplayMarkedDates()}
                theme={{
                  selectedDayBackgroundColor: "#3F4E85",
                  selectedDayTextColor: "#ffffff",
                  todayTextColor: COLORS.primary,
                  arrowColor: COLORS.textDark,
                  monthTextColor: COLORS.textDark,
                  textMonthFontWeight: "800",
                  textDayHeaderFontWeight: "700",
                }}
              />
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
              {["Selected", "Upcoming"].map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.tabButton, isActive && styles.activeTab]}
                    onPress={() => {
                      setActiveTab(tab);
                      if (tab === "Upcoming") setSelectedDate(new Date().toISOString().split("T")[0]);
                    }}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.tabText, isActive ? styles.activeTabText : styles.inactiveTabText]}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {activeTab === "Selected" ? renderSelectedContent() : renderUpcomingContent()}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.background },
  topSafeArea: { flex: 0, backgroundColor: COLORS.background },
  contentContainer: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 28 },

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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.chipBg,
    justifyContent: "center",
    alignItems: "center",
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.chipBg,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: COLORS.textDark },

  // Loading
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: COLORS.textMuted, fontWeight: "600" },

  calendarCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 22,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },

  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: COLORS.card,
    borderRadius: 999,
    padding: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabButton: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: "800" },
  activeTabText: { color: "#fff" },
  inactiveTabText: { color: COLORS.textMuted },

  // --- Existing timetable styles (kept) ---
  sectionRow: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionDateTitle: { fontSize: 17, fontWeight: "800", color: "#111827" },

  todayPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  todayPillText: { color: "#fff", fontWeight: "800", fontSize: 12 },

  sectionHeaderRow: {
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textDark,
  },
  sectionSub: {
    marginTop: 2,
    fontSize: 12.5,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  sectionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(58, 122, 254, 0.12)",
  },
  sectionChipText: {
    fontWeight: "800",
    color: COLORS.primary,
    fontSize: 12,
  },

  eventCard: {
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },

  cardSelected: {
    backgroundColor: "#F0F5FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    flexDirection: "row",
  },
  cardUpcomingModern: { backgroundColor: "#FFFFFF", borderRadius: 18 },

  cardContent: { flex: 1 },
  cardAccent: { width: 4, borderRadius: 999, backgroundColor: COLORS.primary, marginRight: 14 },

  eventTitle: { fontSize: 17, fontWeight: "900", color: "#111827" },

  metaLine: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  eventTime: { fontSize: 13, fontWeight: "800", color: COLORS.primary },
  eventLoc: { flex: 1, fontSize: 13, fontWeight: "700", color: COLORS.textMuted },

  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  upTitle: { flex: 1, fontSize: 16, fontWeight: "900", color: "#1A2B5F", marginRight: 8 },

  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(58, 122, 254, 0.12)",
    alignSelf: "flex-start",
  },
  chipText: { fontSize: 11, fontWeight: "900", color: COLORS.primary, textTransform: "uppercase", letterSpacing: 0.4 },

  metaBlock: { gap: 8 },
  metaRow2: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaLabel: { width: 70, fontSize: 13, fontWeight: "800", color: "#6B7280" },
  metaValue: { flex: 1, fontSize: 13, fontWeight: "700", color: "#111827" },

  emptyContainer: { alignItems: "center", padding: 26 },
  emptyText: { marginTop: 10, color: "#9CA3AF", fontSize: 14, fontWeight: "700" },
});

export default TimetableScreen;
