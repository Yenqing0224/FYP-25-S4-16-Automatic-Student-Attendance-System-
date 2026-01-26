// src/screens/student/timetable/timetable_screen.js


import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { Ionicons } from '@expo/vector-icons';

const REMINDER_KEY = "studentReminderIds_v1";
const COLORS = {
  primary: '#3A7AFE',
  background: '#F5F7FB',
  card: '#FFFFFF',
  textDark: '#111827',
  textMuted: '#6B7280',
  borderSoft: '#E5E7EB',
};


// ✅ render-safe helper (prevents {id,name} crash)
const toText = (v, fallback = "") => {
  if (v == null) return fallback;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map((x) => toText(x, "")).filter(Boolean).join(", ") || fallback;
  if (typeof v === "object") return String(v.name ?? v.title ?? v.code ?? v.id ?? fallback);
  return fallback;
};

// ✅ some API fields come back as {id,name}; normalize module safely
const normalizeModule = (m) => {
  if (!m) return { code: "", name: "" };
  // if module itself is string
  if (typeof m === "string") return { code: m, name: "" };
  // if module has code/name sometimes as object
  return {
    code: toText(m.code, ""),
    name: toText(m.name, ""),
  };
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

      // ✅ normalize schedule so UI never sees object fields in Text
      const normalized = raw.map((item) => {
        const mod = normalizeModule(item?.module);
        return {
          ...item,
          // ensure id is string-able
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

      // multi-dot format requires array of dots; merge if multiple on same day
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

  // --- RENDER SECTIONS ---
  const renderReminderBtn = (item) => {
    const added = isAdded(item);
    const saving = isSavingThis(item);

    return (
      <TouchableOpacity
        style={[
          styles.reminderBtn,
          added ? styles.reminderBtnAdded : styles.reminderBtnNormal,
          (added || saving) && { opacity: 0.7 },
        ]}
        disabled={saving}
        onPress={() => {
          if (added) removeReminderTracking(item);
          else addReminderToCalendar(item);
        }}
      >
        <Text style={[styles.reminderBtnText, added && { color: "#1A2B5F" }]}>
          {saving ? "Adding…" : added ? "Added ✓" : "Add reminder"}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSelectedContent = () => {
    const classesForDay = fullSchedule.filter((item) => toText(item.date, "") === selectedDate);

    return (
      <View>
        <Text style={styles.sectionDateTitle}>{formatDateHeader(selectedDate)}</Text>

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
                activeOpacity={0.9}
              >
                <View style={[styles.cardAccent, { backgroundColor: "#3F4E85" }]} />
                <View style={styles.cardContent}>
                  <Text style={styles.eventTitle}>
                    {moduleCode} · {moduleName}
                  </Text>
                  <Text style={styles.eventTime}>{formatTime(item.start_time)}</Text>
                  <Text style={styles.eventLoc}>{venue}</Text>

                  <View style={{ marginTop: 10 }}>{renderReminderBtn(item)}</View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
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

    return (
      <View>
        <Text style={styles.sectionDateTitle}>Upcoming Classes</Text>

        {upcoming.length === 0 ? (
          <View style={styles.emptyContainer}>
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
                style={[styles.eventCard, styles.cardUpcoming]}
                onPress={() => navigation.navigate("ClassDetail", { session_id: item.id })}
                activeOpacity={0.9}
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.upTitle}>
                    {moduleCode} • {moduleName}
                  </Text>

                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{sessionType}</Text>
                  </View>
                </View>

                <View style={styles.upRow}>
                  <Text style={styles.upIcon}>🗓</Text>
                  <Text style={styles.upLabel}>Date</Text>
                  <Text style={styles.upValue}>{formatDateShort(item.date)}</Text>
                </View>

                <View style={styles.upRow}>
                  <Text style={styles.upIcon}>⏰</Text>
                  <Text style={styles.upLabel}>Time</Text>
                  <Text style={styles.upValue}>{formatTime(item.start_time)}</Text>
                </View>

                <View style={styles.upRow}>
                  <Text style={styles.upIcon}>📍</Text>
                  <Text style={styles.upLabel}>Location</Text>
                  <Text style={styles.upValue}>{venue}</Text>
                </View>

                <View style={{ marginTop: 10 }}>{renderReminderBtn(item)}</View>
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
        <StatusBar barStyle="dark-content" backgroundColor="#F0F2FA" />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.headerIconBox}>
            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Timetable</Text>


          <View style={styles.headerIconBox} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3A7AFE" style={{ marginTop: 50 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
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
                  todayTextColor: "#3A7AFE",
                  arrowColor: "#111827",
                  monthTextColor: "#111827",
                  textMonthFontWeight: "700",
                  textDayHeaderFontWeight: "600",
                }}
              />
            </View>

            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, activeTab === "Selected" ? styles.activeBtn : styles.inactiveBtn]}
                onPress={() => setActiveTab("Selected")}
              >
                <Text style={activeTab === "Selected" ? styles.activeText : styles.inactiveText}>Selected</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleButton, activeTab === "Upcoming" ? styles.activeBtn : styles.inactiveBtn]}
                onPress={() => {
                  setActiveTab("Upcoming");
                  setSelectedDate(new Date().toISOString().split("T")[0]);
                }}
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
  mainContainer: { flex: 1, backgroundColor: "#F5F7FB" },
  topSafeArea: { flex: 0, backgroundColor: "#F0F2FA" },
  contentContainer: { flex: 1, backgroundColor: "#F5F7FB" },
  scrollContent: { paddingBottom: 24 },

  header: {
    backgroundColor: COLORS.background,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  headerIconBox: {
    width: 32,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  calendarCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 999,
    padding: 2,
    height: 44,
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
  activeText: { fontWeight: "700", color: "#111827", fontSize: 14 },
  inactiveText: { fontWeight: "600", color: "#9CA3AF", fontSize: 14 },

  sectionDateTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
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
    shadowRadius: 6,
    elevation: 2,
    flexDirection: "row",
  },
  cardContent: { flex: 1 },
  cardSelected: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0" },
  cardUpcoming: { backgroundColor: "#FFFFFF", borderLeftWidth: 4, borderLeftColor: "#3A7AFE", flexDirection: "column" },

  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  upTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: "#1A2B5F", marginRight: 8 },

  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(58, 122, 254, 0.12)",
    alignSelf: "flex-start",
  },
  chipText: { fontSize: 11, fontWeight: "700", color: "#3A7AFE", textTransform: "uppercase", letterSpacing: 0.4 },

  upRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  upIcon: { width: 20, fontSize: 14 },
  upLabel: { width: 70, fontSize: 13, fontWeight: "600", color: "#555" },
  upValue: { flex: 1, fontSize: 13, fontWeight: "500", color: "#222" },

  cardAccent: { width: 4, borderRadius: 999, backgroundColor: "#3A7AFE", marginRight: 14 },

  emptyContainer: { alignItems: "center", padding: 24 },
  emptyText: { color: "#9CA3AF", fontSize: 14 },

  eventTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 4 },
  eventTime: { fontSize: 14, fontWeight: "600", color: "#3A7AFE", marginBottom: 2 },
  eventLoc: { fontSize: 13, color: "#6B7280" },

  reminderBtn: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  reminderBtnNormal: { backgroundColor: "rgba(58, 122, 254, 0.12)" },
  reminderBtnAdded: { backgroundColor: "#EAF2FF" },
  reminderBtnText: { fontWeight: "800", color: "#3A7AFE", fontSize: 13 },
});

export default TimetableScreen;
