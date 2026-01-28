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
};

// ✅ render-safe helper (prevents {id,name} crash)
const toText = (v, fallback = "") => {
  if (v == null) return fallback;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map((x) => toText(x, "")).filter(Boolean).join(", ") || fallback;
  if (typeof v === "object") return String(v.name ?? v.title ?? v.code ?? v.id ?? fallback);
  return fallback;
};

// ✅ normalize module safely
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

  // --- Load reminder ids once ---
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

  // --- NAV LISTENER (jump from Home upcoming card) ---
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

  // --- FETCH TIMETABLE ---
  useEffect(() => {
    fetchTimetable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          session_type: toText(item?.session_type, ""),
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

  // --- HELPERS ---
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

  // --- REMINDER LOGIC ---
  const reminderIdFor = (item) => {
    const code = toText(item?.module?.code, "MOD");
    return `${code}|${toText(item?.date, "")}|${toText(item?.start_time, "")}|${toText(item?.venue, "")}`;
  };

  const isAdded = (item) => savedReminderIds.has(reminderIdFor(item));
  const isSavingThis = (item) => savingId === reminderIdFor(item);

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

  const addReminderToCalendar = async (item) => {
    const rid = reminderIdFor(item);

    if (savedReminderIds.has(rid)) {
      Alert.alert("Already added", "This class reminder is already tracked.");
      return;
    }

    setSavingId(rid);

    try {
      const { status } = await ExpoCalendar.requestCalendarPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow Calendar access to add reminders.");
        return;
      }

      const calendars = await ExpoCalendar.getCalendarsAsync(ExpoCalendar.EntityTypes.EVENT);
      const defaultCal = calendars.find((c) => c.allowsModifications) || calendars[0];

      if (!defaultCal) {
        Alert.alert("No calendar found", "Please enable a calendar on your device.");
        return;
      }

      const { start, end } = buildStartEndDates(item);

      const moduleCode = toText(item?.module?.code, "Module");
      const moduleName = toText(item?.module?.name, "Class");

      await ExpoCalendar.createEventAsync(defaultCal.id, {
        title: `${moduleCode} - ${moduleName}`,
        startDate: start,
        endDate: end,
        location: toText(item?.venue, ""),
        notes: "Created from Attendify (Student).",
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

  const removeReminderTracking = async (item) => {
    const rid = reminderIdFor(item);
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

  // --- UI HELPERS ---
  const goToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
    setActiveTab("Selected");
  };

  const renderReminderBtn = (item) => {
    const added = isAdded(item);
    const saving = isSavingThis(item);

    return (
      <TouchableOpacity
        style={[
          styles.reminderBtn,
          added ? styles.reminderBtnAdded : styles.reminderBtnNormal,
          (added || saving) && { opacity: 0.85 },
        ]}
        disabled={saving}
        onPress={() => {
          if (added) removeReminderTracking(item);
          else addReminderToCalendar(item);
        }}
        activeOpacity={0.9}
      >
        <Ionicons
          name={saving ? "time-outline" : added ? "checkmark-circle" : "add-circle"}
          size={16}
          color={added ? "#1A2B5F" : "#fff"}
        />
        <Text style={[styles.reminderBtnText, added && { color: "#1A2B5F" }]}>
          {saving ? "Adding…" : added ? "Added" : "Add reminder"}
        </Text>
      </TouchableOpacity>
    );
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

                  <View style={{ marginTop: 12 }}>{renderReminderBtn(item)}</View>
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

  // ✅ OPTION A: better "Upcoming" header row (count + Go to today chip)
  const renderUpcomingContent = () => {
    const now = new Date();
    const upcoming = fullSchedule
      .filter((item) => getJsDate(item) > now)
      .sort((a, b) => getJsDate(a) - getJsDate(b));

    return (
      <View>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Upcoming classes</Text>
            <Text style={styles.sectionSub}>
              {upcoming.length} class{upcoming.length === 1 ? "" : "es"}
            </Text>
          </View>

          <TouchableOpacity onPress={goToday} activeOpacity={0.9} style={styles.sectionChip}>
            <Ionicons name="today-outline" size={14} color={COLORS.primary} />
            <Text style={styles.sectionChipText}>Go to today</Text>
          </TouchableOpacity>
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

                <View style={{ marginTop: 12 }}>{renderReminderBtn(item)}</View>
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
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBox} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Timetable</Text>

          <TouchableOpacity onPress={goToday} style={[styles.headerIconBox, { alignItems: "flex-end" }]} activeOpacity={0.85}>
            <Ionicons name="today-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
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

            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, activeTab === "Selected" ? styles.activeBtn : styles.inactiveBtn]}
                onPress={() => setActiveTab("Selected")}
                activeOpacity={0.9}
              >
                <Text style={activeTab === "Selected" ? styles.activeText : styles.inactiveText}>Selected</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleButton, activeTab === "Upcoming" ? styles.activeBtn : styles.inactiveBtn]}
                onPress={() => {
                  setActiveTab("Upcoming");
                  setSelectedDate(new Date().toISOString().split("T")[0]);
                }}
                activeOpacity={0.9}
              >
                <Text style={activeTab === "Upcoming" ? styles.activeText : styles.inactiveText}>Upcoming</Text>
              </TouchableOpacity>
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
  topSafeArea: { flex: 0, backgroundColor: "#FFFFFF" },
  contentContainer: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 28 },

  header: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  headerIconBox: { width: 32, alignItems: "flex-start" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: COLORS.textDark },

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

  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 999,
    padding: 3,
    height: 46,
  },
  toggleButton: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 999 },
  activeBtn: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  inactiveBtn: { backgroundColor: "transparent" },
  activeText: { fontWeight: "800", color: "#111827", fontSize: 14 },
  inactiveText: { fontWeight: "700", color: "#9CA3AF", fontSize: 14 },

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

  // ✅ OPTION A styles
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

  cardSelected: { backgroundColor: "#F0F5FF", borderWidth: 1, borderColor: "#C7D2FE", flexDirection: "row" },
  cardUpcomingModern: { backgroundColor: "#FFFFFF", borderRadius: 18 },

  cardContent: { flex: 1 },
  cardAccent: { width: 4, borderRadius: 999, backgroundColor: COLORS.primary, marginRight: 14 },

  eventTitle: { fontSize: 17, fontWeight: "900", color: "#111827" },

  metaLine: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  eventTime: { fontSize: 13, fontWeight: "800", color: COLORS.primary },
  eventLoc: { flex: 1, fontSize: 13, fontWeight: "700", color: COLORS.textMuted },

  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
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

  reminderBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reminderBtnNormal: { backgroundColor: COLORS.primary },
  reminderBtnAdded: { backgroundColor: "#E0E7FF" },
  reminderBtnText: { fontWeight: "900", color: "#FFFFFF", fontSize: 13 },
});

export default TimetableScreen;
