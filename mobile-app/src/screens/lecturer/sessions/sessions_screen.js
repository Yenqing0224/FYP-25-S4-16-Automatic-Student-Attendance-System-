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

/* Helper to standardise API data */
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

const LecturerSessionsScreen = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [selectedDate, setSelectedDate] = useState(null);

  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize Date default
  useEffect(() => {
    if (!selectedDate) {
      const sgTime = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Singapore",
      });
      setSelectedDate(sgTime);
    }
  }, [selectedDate]);

  // Fetch Real Data
  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const res = await api.get("/timetable/");
      const rawData = Array.isArray(res.data) ? res.data : [];

      const formatted = rawData.map((c) => {
        const base = {
          id: String(c.id),
          
          module: c.module?.code ?? "MOD",
          title: c.module?.name ?? c.module?.code ?? "Class",
          name: c.name ?? "Session", 
          venue: c.venue ?? "TBA",
          startISO: `${c.date}T${c.start_time}`,
          endISO: `${c.date}T${c.end_time}`,
          status: (c.status ?? "active").toLowerCase(),
        };
        return deriveFieldsFromISO(base);
      });

      setTimetable(formatted);
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
    return timetable
      .filter((c) => c.status !== "cancelled")
      .filter((c) => new Date(c.startISO).getTime() >= now)
      .sort((a, b) => new Date(a.startISO) - new Date(b.startISO));
  }, [timetable]);

  const past = useMemo(() => {
    const now = Date.now();
    return timetable
      .filter((c) => c.status !== "cancelled")
      .filter((c) => new Date(c.endISO).getTime() < now)
      .sort((a, b) => new Date(b.startISO) - new Date(a.startISO));
  }, [timetable]);

  const addReminderToCalendar = async (cls) => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Error", "Calendar permission is required.");
        return;
      }
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCal = calendars.find((c) => c.allowsModifications) || calendars[0];
      
      if (!defaultCal) {
        Alert.alert("Error", "No writable calendar found on device.");
        return;
      }

      await Calendar.createEventAsync(defaultCal.id, {
        title: `${cls.module} - ${cls.name}`,
        startDate: new Date(cls.startISO),
        endDate: new Date(cls.endISO),
        location: cls.venue,
        notes: "Created from Attendify.",
        timeZone: "Asia/Singapore",
      });
      
      Alert.alert("Success", "Added to your calendar!");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not add to calendar.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={["top"]}>

        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const tabs = ["Upcoming", "Past", "Rescheduled", "Calendar"];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>

      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Sessions</Text>
          <Text style={styles.headerSubText}>
            Real-time schedule
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
          addReminderToCalendar={addReminderToCalendar}
        />
      )}

      {activeTab === "Past" && (
        <PastTab
          COLORS={COLORS}
          navigation={navigation}
          list={past}
        />
      )}

      {activeTab === "Rescheduled" && (
        <RescheduledTab
          COLORS={COLORS}
          navigation={navigation}
          sessions={timetable} 
        />
      )}

      {activeTab === "Calendar" && (
        <CalendarTab
          COLORS={COLORS}
          navigation={navigation}
          sessions={timetable}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
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
  centered: { justifyContent: "center", alignItems: "center" },

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

  // TABS
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