import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Calendar from "expo-calendar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

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

const LecturerHomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [stats, setStats] = useState({ today: 0, week: 0 });
  const [nextClass, setNextClass] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  
  // Lists to pass to ClassListScreen
  const [todayClasses, setTodayClasses] = useState([]);
  const [weekClasses, setWeekClasses] = useState([]);

  const [savedReminderIds, setSavedReminderIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("userInfo");
        if (storedUser) setUser(JSON.parse(storedUser));
        const raw = await AsyncStorage.getItem(REMINDER_KEY);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) setSavedReminderIds(new Set(arr));
        }
      } catch (e) { console.error(e); }
    };
    init();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const fetchDashboardData = async () => {
    try {
      if (!refreshing) setLoading(true);
      const res = await api.get("/dashboard/");
      const data = res.data;

      setStats(data.stats || { today: 0, week: 0 });

      // ✅ FIX: Use the correct keys from your API JSON
      setTodayClasses(data.today_sessions || []); 
      setWeekClasses(data.week_sessions || []);

      if (data.next_class) {
        const nc = data.next_class;
        setNextClass({
          id: nc.id,
          module: nc.module?.code || "Module",
          title: nc.module?.name || "Class",
          date: nc.date,
          dateLabel: formatDateLabel(nc.date),
          dateFull: formatDateFull(nc.date),
          startISO: `${nc.date}T${nc.start_time}`,
          endISO: `${nc.date}T${nc.end_time}`,
          time: `${formatTime(nc.start_time)} – ${formatTime(nc.end_time)}`,
          venue: nc.venue || "TBA",
        });
      } else {
        setNextClass(null);
      }

      const rawAnnouncements = data.announcements || [];
      setAnnouncements(
        rawAnnouncements.map((a) => ({
          id: a.id,
          title: a.title,
          desc: a.description || a.message || "",
          date: a.created_at ? formatDateLabel(a.created_at) : "Recent",
        }))
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const goToSessionsTab = () => {
    const parent = navigation.getParent?.();
    const params = { tab: "Upcoming" }; 
    if (parent) parent.navigate("LSessions", params);
    else navigation.navigate("LSessions", params);
  };

  const goToClassList = (mode) => {
    const classesToSend = mode === "today" ? todayClasses : weekClasses;
    navigation.navigate("LecturerClassList", { 
        mode: mode, 
        classes: classesToSend 
    });
  };

  const formatTime = (t) => (t ? t.slice(0, 5) : "");
  const formatDateLabel = (dStr) => {
    if (!dStr) return "";
    const d = new Date(dStr);
    return d.toDateString() === new Date().toDateString() ? "Today" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };
  const formatDateFull = (dStr) => {
    if (!dStr) return "";
    const d = new Date(dStr);
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  };

  const reminderIdFor = (cls) => `${cls.module}|${cls.startISO}|${cls.venue}`;
  const isAdded = (cls) => savedReminderIds.has(reminderIdFor(cls));
  const isSavingThis = (cls) => savingId === reminderIdFor(cls);

  const addReminderToCalendar = async (cls) => {
    // ... (Keep existing calendar logic) ...
    Alert.alert("Feature", "Add to calendar logic goes here.");
  };

  if (loading && !refreshing) {
    return (
        <SafeAreaView style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.hi}>Welcome back</Text>
            <Text style={styles.name}>{user ? `${user.first_name}` : "Lecturer"} 👩‍🏫</Text>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>Lecturer Mode</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={goToSessionsTab}>
            <Ionicons name="calendar-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryRow}>
          <TouchableOpacity style={styles.summaryCard} onPress={() => goToClassList("today")}>
            <Text style={styles.summaryValue}>{stats.today}</Text>
            <Text style={styles.summaryLabel}>Classes today</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.summaryCard} onPress={() => goToClassList("week")}>
            <Text style={styles.summaryValue}>{stats.week}</Text>
            <Text style={styles.summaryLabel}>Classes this week</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle}>Next class</Text>
            {nextClass && (
              <View style={styles.pill}><Text style={styles.pillText}>{nextClass.dateLabel}</Text></View>
            )}
          </View>

          {nextClass ? (
            <>
                <Text style={styles.module}>{nextClass.module}</Text>
                <Text style={styles.title}>{nextClass.title}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{nextClass.dateFull}</Text>
                </View>
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
                    <TouchableOpacity style={[styles.secondaryBtn, isAdded(nextClass) && { opacity: 0.65 }]} disabled={isAdded(nextClass)} onPress={() => addReminderToCalendar(nextClass)}>
                        <Ionicons name={isAdded(nextClass) ? "checkmark-circle-outline" : "bookmark-outline"} size={16} color={COLORS.primary} />
                        <Text style={styles.secondaryBtnText}>{isAdded(nextClass) ? "Added" : "Add reminder"}</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.detailLink} onPress={() => navigation.navigate("LecturerClassDetail", { cls: nextClass })}>
                    <Text style={styles.detailLinkText}>Open class details</Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                </TouchableOpacity>
            </>
          ) : (
            <Text style={{ marginTop: 10, color: COLORS.textMuted }}>No upcoming classes.</Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle}>Announcements</Text>
            <Ionicons name="megaphone-outline" size={18} color={COLORS.primary} />
          </View>
          {announcements.length === 0 ? (
             <Text style={{ marginTop: 10, color: COLORS.textMuted }}>No new announcements.</Text>
          ) : (
            announcements.map((a, idx) => (
                <View key={a.id}>
                <TouchableOpacity
                    style={styles.announceItem}
                    onPress={() => navigation.navigate("LecturerAnnouncementDetail", { announcement: a })}
                >
                    <Text style={styles.announceTitle}>{a.title}</Text>
                    <Text style={styles.announceDesc} numberOfLines={2}>{a.desc}</Text>
                    <Text style={{fontSize: 11, color: COLORS.textMuted, marginTop: 4}}>{a.date}</Text>
                </TouchableOpacity>
                {idx !== announcements.length - 1 && <View style={styles.divider} />}
                </View>
            ))
          )}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, paddingTop: 14 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hi: { color: COLORS.textMuted, fontWeight: "600" },
  name: { marginTop: 2, fontSize: 22, fontWeight: "800", color: COLORS.textDark },
  rolePill: { marginTop: 10, alignSelf: "flex-start", backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  rolePillText: { color: "#fff", fontWeight: "900", fontSize: 12 },
  iconBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.soft, justifyContent: "center", alignItems: "center" },
  summaryRow: { flexDirection: "row", gap: 12, marginTop: 14 },
  summaryCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  summaryValue: { fontSize: 20, fontWeight: "900", color: COLORS.textDark },
  summaryLabel: { marginTop: 4, color: COLORS.textMuted, fontWeight: "600" },
  card: { marginTop: 14, backgroundColor: COLORS.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textDark },
  pill: { backgroundColor: COLORS.soft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { color: COLORS.primary, fontWeight: "800", fontSize: 12 },
  module: { marginTop: 10, fontWeight: "900", color: COLORS.primary },
  title: { marginTop: 2, fontSize: 16, fontWeight: "800", color: COLORS.textDark },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 },
  metaText: { color: COLORS.textMuted, fontWeight: "600" },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  primaryBtn: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  primaryBtnText: { color: "#fff", fontWeight: "800" },
  secondaryBtn: { flex: 1, backgroundColor: COLORS.soft, paddingVertical: 12, borderRadius: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  secondaryBtnText: { color: COLORS.primary, fontWeight: "800" },
  detailLink: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  detailLinkText: { color: COLORS.primary, fontWeight: "900" },
  announceItem: { paddingVertical: 10 },
  announceTitle: { fontWeight: "900", color: COLORS.textDark },
  announceDesc: { marginTop: 4, color: COLORS.textMuted, fontWeight: "700", lineHeight: 18 },
  divider: { height: 1, backgroundColor: COLORS.border },
});

export default LecturerHomeScreen;