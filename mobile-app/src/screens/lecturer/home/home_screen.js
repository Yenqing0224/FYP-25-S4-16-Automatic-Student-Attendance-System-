// lecturer/home/home_screen.js
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
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
  danger: "#EF4444", // red dot
};

const REMINDER_KEY = "lecturerReminderIds_v1";
const READ_LECTURER_ANNOUNCEMENTS_KEY = "lecturerReadAnnouncements_v1";

// ✅ auto-expire announcements after X days
const ANNOUNCEMENT_EXPIRE_DAYS = 14;

// ✅ sample fallback (lecturer-only)
const SAMPLE_LECTURER_ANNOUNCEMENTS = [
  {
    id: "101",
    title: "Week 6 Lecture Cancelled",
    desc: "The Week 6 lecture is cancelled due to a department meeting. Please review the uploaded slides on LumiNUS.",
    date: "Today",
    created_at: new Date().toISOString(),
  },
  {
    id: "102",
    title: "System Maintenance (Teaching Tools)",
    desc: "Attendance and grading tools may be unavailable on Friday, 8:00–10:00 PM.",
    date: "Fri",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "103",
    title: "Marking Window Opens Monday",
    desc: "Please begin grading from Monday. Target completion by Week 8 Friday.",
    date: "Mon",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "104",
    title: "Invigilation Briefing",
    desc: "Invigilation briefing on Wednesday, 3:00 PM at Seminar Room 5.",
    date: "Wed",
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const LecturerHomeScreen = ({ navigation , route}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({ today: 0, week: 0 });
  const [nextClass, setNextClass] = useState(null);

  // announcements (synced)
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [isAnnounceExpanded, setIsAnnounceExpanded] = useState(false);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState(new Set());

  // ✅ Option 1: toggle between UNREAD vs ALL
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);

  // lists to pass to ClassListScreen
  const [todayClasses, setTodayClasses] = useState([]);
  const [weekClasses, setWeekClasses] = useState([]);

  // calendar reminders
  const [savedReminderIds, setSavedReminderIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);

  // ---------------- helpers ----------------
  const formatTime = (t) => (t ? String(t).slice(0, 5) : "");

  const formatDateLabel = (dStr) => {
    if (!dStr) return "";
    const d = new Date(dStr);
    const today = new Date();
    return d.toDateString() === today.toDateString()
      ? "Today"
      : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const formatDateFull = (dStr) => {
    if (!dStr) return "";
    const d = new Date(dStr);
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isCreatedToday = (createdAt) => {
    if (!createdAt) return false;
    const d = new Date(createdAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  const isExpired = (createdAt) => {
    if (!createdAt) return false;
    const d = new Date(createdAt);
    const cutoff = Date.now() - ANNOUNCEMENT_EXPIRE_DAYS * 24 * 60 * 60 * 1000;
    return d.getTime() < cutoff;
  };

  const normalizeAnnouncement = (a) => {
    const createdAt = a.created_at || a.createdAt || a.created || null;
    return {
      id: String(a.id),
      title: a.title || "Untitled",
      desc: a.desc || a.body || a.description || a.message || "",
      created_at: createdAt,
      date: a.dateLabel || a.date || (createdAt ? formatDateLabel(createdAt) : "Recent"),
    };
  };

  const uniqById = (arr) => {
    const map = new Map();
    arr.forEach((x) => map.set(String(x.id), x));
    return Array.from(map.values());
  };

  // ---------------- init (load user + saved ids) ----------------
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

        const rawRead = await AsyncStorage.getItem(READ_LECTURER_ANNOUNCEMENTS_KEY);
        if (rawRead) {
          const arr = JSON.parse(rawRead);
          if (Array.isArray(arr)) setReadAnnouncementIds(new Set(arr.map(String)));
        }
      } catch (e) {
        console.error("Init error:", e);
      }
    };
    init();
  }, []);

  useFocusEffect(
  useCallback(() => {
    fetchDashboardData();

    // ✅ clear key after using
    if (navigation?.getState && navigation?.setParams && route?.params?.refreshKey) {
      navigation.setParams({ refreshKey: null });
    }
  }, [route?.params?.refreshKey])
);

  // ---------------- read/unread persistence ----------------
  const persistReadIds = async (nextSet) => {
    try {
      await AsyncStorage.setItem(
        READ_LECTURER_ANNOUNCEMENTS_KEY,
        JSON.stringify(Array.from(nextSet))
      );
    } catch (e) {
      console.log("Failed to save lecturer read announcements:", e);
    }
  };

  const markAnnouncementRead = async (id) => {
    const next = new Set(readAnnouncementIds);
    next.add(String(id));
    setReadAnnouncementIds(next);
    await persistReadIds(next);
  };

  const markAllRead = async () => {
    const next = new Set(readAnnouncementIds);
    announcements.forEach((a) => next.add(String(a.id)));
    setReadAnnouncementIds(next);
    await persistReadIds(next);
  };

  // ---------------- data fetching ----------------
  const fetchDashboardData = async () => {
    try {
      if (!refreshing) setLoading(true);

      // A) dashboard fetch
      const res = await api.get("/dashboard/");
      const data = res.data;

      setStats(data.stats || { today: 0, week: 0 });
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

      // announcements: dashboard + endpoint merge
      const dashAnnouncements = Array.isArray(data.announcements) ? data.announcements : [];
      const dashFormatted = dashAnnouncements.map(normalizeAnnouncement);

      setLoadingAnnouncements(true);
      let endpointFormatted = [];
      try {
        // ✅ lecturer-only audience
        const annRes = await api.get("/announcements/?audience=lecturers,all&active=1");
        const raw = Array.isArray(annRes.data) ? annRes.data : [];
        endpointFormatted = raw.map(normalizeAnnouncement);
      } catch (e) {
        endpointFormatted = [];
      }

      let merged = uniqById([...endpointFormatted, ...dashFormatted]);

      // auto-expire
      merged = merged.filter((a) => !isExpired(a.created_at));

      // ✅ safety filter (in case backend sends student-only items)
      const LECTURER_EXCLUDE_KEYWORDS = ["assignment", "deadline", "attendance below", "your attendance"];
      merged = merged.filter((a) => {
        const text = `${a.title} ${a.desc}`.toLowerCase();
        return !LECTURER_EXCLUDE_KEYWORDS.some((k) => text.includes(k));
      });

      // fallback sample if empty
      if (!merged.length) merged = SAMPLE_LECTURER_ANNOUNCEMENTS.map(normalizeAnnouncement);

      setAnnouncements(merged);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      const fallback = SAMPLE_LECTURER_ANNOUNCEMENTS.map(normalizeAnnouncement);
      setAnnouncements(fallback);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingAnnouncements(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // ---------------- navigation helpers ----------------
  const goToSessionsTab = () => {
    const parent = navigation.getParent?.();
    const params = { tab: "Upcoming" };
    if (parent) parent.navigate("LSessions", params);
    else navigation.navigate("LSessions", params);
  };

  const goToClassList = (mode) => {
    const classesToSend = mode === "today" ? todayClasses : weekClasses;
    navigation.navigate("LecturerClassList", { mode, classes: classesToSend });
  };

  // ---------------- calendar helpers (placeholder) ----------------
  const reminderIdFor = (cls) => `${cls.module}|${cls.startISO}|${cls.venue}`;
  const isAdded = (cls) => savedReminderIds.has(reminderIdFor(cls));
  const isSavingThis = (cls) => savingId === reminderIdFor(cls);

  const addReminderToCalendar = async (cls) => {
    Alert.alert("Feature", "Add to calendar logic goes here.");
  };

  // ✅ Announcement logic (Option 1: Unread/All)
  const unreadAnnouncements = useMemo(
    () => announcements.filter((a) => !readAnnouncementIds.has(String(a.id))),
    [announcements, readAnnouncementIds]
  );

  const listToShow = showAllAnnouncements ? announcements : unreadAnnouncements;
  const visibleAnnouncements = isAnnounceExpanded ? listToShow : listToShow.slice(0, 3);

  const hasAnyAnnouncements = listToShow.length > 0;

  // ---------------- UI ----------------
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* HEADER */}
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

        {/* SUMMARY */}
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

        {/* NEXT CLASS */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle}>Next class</Text>
            {nextClass && (
              <View style={styles.pill}>
                <Text style={styles.pillText}>{nextClass.dateLabel}</Text>
              </View>
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

                <TouchableOpacity
                  style={[styles.secondaryBtn, isAdded(nextClass) && { opacity: 0.65 }]}
                  disabled={isAdded(nextClass)}
                  onPress={() => addReminderToCalendar(nextClass)}
                >
                  <Ionicons
                    name={isAdded(nextClass) ? "checkmark-circle-outline" : "bookmark-outline"}
                    size={16}
                    color={COLORS.primary}
                  />
                  <Text style={styles.secondaryBtnText}>
                    {isAdded(nextClass) ? "Added" : "Add reminder"}
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
            </>
          ) : (
            <Text style={{ marginTop: 10, color: COLORS.textMuted }}>No upcoming classes.</Text>
          )}
        </View>

        {/* ANNOUNCEMENTS */}
        <View style={styles.card}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setIsAnnounceExpanded((v) => !v)}
            style={styles.announceHeaderRow}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <Ionicons name="megaphone-outline" size={18} color={COLORS.primary} />

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.textDark }}>
                  {showAllAnnouncements ? `All (${announcements.length})` : `Unread (${unreadAnnouncements.length})`}
                </Text>

                {!showAllAnnouncements && unreadAnnouncements.length > 0 && <View style={styles.unreadDot} />}

                {/* ✅ Toggle pill */}
                <TouchableOpacity
                  onPress={() => setShowAllAnnouncements((v) => !v)}
                  activeOpacity={0.85}
                  style={styles.filterPill}
                >
                  <Text style={styles.filterPillText}>
                    {showAllAnnouncements ? "Showing: All" : "Showing: Unread"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ color: COLORS.textMuted, fontWeight: "700", fontSize: 12 }}>
                {isAnnounceExpanded ? "Collapse" : "Expand"}
              </Text>
              <Ionicons
                name={isAnnounceExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color={COLORS.textMuted}
              />
            </View>
          </TouchableOpacity>

          {/* Mark all read (only in Unread mode) */}
          {!loadingAnnouncements && !showAllAnnouncements && unreadAnnouncements.length > 0 && (
            <TouchableOpacity onPress={markAllRead} style={{ marginTop: 10, alignSelf: "flex-start" }}>
              <Text style={{ color: COLORS.primary, fontWeight: "900", fontSize: 13 }}>
                Mark all as read
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 10 }} />

          {loadingAnnouncements ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : !hasAnyAnnouncements ? (
            <View style={{ paddingVertical: 10 }}>
              <Text style={{ color: COLORS.textMuted, fontWeight: "700" }}>
                {showAllAnnouncements ? "No announcements yet." : "You’re all caught up ✅"}
              </Text>
            </View>
          ) : (
            visibleAnnouncements.map((a, idx) => {
              const isRead = readAnnouncementIds.has(String(a.id));

              return (
                <View key={a.id}>
                  <TouchableOpacity
                    style={{ paddingVertical: 12 }}
                    onPress={async () => {
                      if (!isRead) await markAnnouncementRead(a.id);
                      navigation.navigate("LecturerAnnouncementDetail", { announcement: a });
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text
                        style={{
                          fontWeight: "900",
                          color: COLORS.textDark,
                          fontSize: 15,
                          flex: 1,
                          opacity: isRead ? 0.65 : 1,
                        }}
                        numberOfLines={1}
                      >
                        {a.title}
                      </Text>

                      {!isRead && isCreatedToday(a.created_at) && (
                        <View style={styles.newPill}>
                          <Text style={styles.newPillText}>NEW</Text>
                        </View>
                      )}

                      {showAllAnnouncements && isRead && (
                        <View style={styles.readPill}>
                          <Text style={styles.readPillText}>READ</Text>
                        </View>
                      )}
                    </View>

                    <Text
                      style={{
                        marginTop: 4,
                        color: COLORS.textMuted,
                        fontWeight: "700",
                        lineHeight: 18,
                        fontSize: 13,
                        opacity: isRead ? 0.7 : 1,
                      }}
                      numberOfLines={2}
                    >
                      {a.desc}
                    </Text>

                    {!!a.date && (
                      <Text style={{ marginTop: 6, color: COLORS.textMuted, fontWeight: "800", fontSize: 11 }}>
                        {a.date}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {idx !== visibleAnnouncements.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })
          )}

          {!loadingAnnouncements && !isAnnounceExpanded && listToShow.length > 3 && (
            <TouchableOpacity
              onPress={() => setIsAnnounceExpanded(true)}
              style={{
                marginTop: 8,
                paddingVertical: 8,
                alignItems: "center",
                borderTopWidth: 1,
                borderTopColor: COLORS.border,
              }}
            >
              <Text style={{ color: COLORS.primary, fontWeight: "900", fontSize: 13 }}>
                View {listToShow.length - 3} more
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  center: { justifyContent: "center", alignItems: "center" },

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

  // announcements
  announceHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  divider: { height: 1, backgroundColor: COLORS.border },

  unreadDot: { width: 8, height: 8, borderRadius: 99, backgroundColor: COLORS.danger },

  // ✅ Option 1 filter pill
  filterPill: {
    marginLeft: 8,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.primary,
  },

  newPill: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  newPillText: { fontSize: 10, fontWeight: "900", color: "#B91C1C", letterSpacing: 0.6 },

  // ✅ READ badge (only when showAllAnnouncements)
  readPill: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  readPillText: { fontSize: 10, fontWeight: "900", color: "#374151", letterSpacing: 0.6 },
});

export default LecturerHomeScreen;
