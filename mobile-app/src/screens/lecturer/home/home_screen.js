// src/screens/lecturer/home/home_screen.js
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
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
  danger: "#EF4444",
};

const REMINDER_KEY = "lecturerReminderIds_v1";
const READ_LECTURER_ANNOUNCEMENTS_KEY = "lecturerReadAnnouncements_v1";
const ANNOUNCEMENT_EXPIRE_DAYS = 30; // Increased window since API controls visibility

export default function LecturerHomeScreen({ navigation, route }) {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({ today: 0, week: 0 });
  const [nextClass, setNextClass] = useState(null);

  // sessions lists to pass to list screen
  const [todayClasses, setTodayClasses] = useState([]);
  const [weekClasses, setWeekClasses] = useState([]);

  // announcements
  const [announcements, setAnnouncements] = useState([]);
  const [isAnnounceExpanded, setIsAnnounceExpanded] = useState(false);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState(new Set());
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);

  // ---------- safe helpers ----------
  const toText = (v, fallback = "-") => {
    if (v == null) return fallback;
    if (typeof v === "string" || typeof v === "number") return String(v);
    if (typeof v === "object") return String(v.name ?? v.code ?? v.title ?? fallback);
    return fallback;
  };

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

  const normalizeAnnouncement = (a) => {
    const createdAt = a.created_at || a.createdAt || null;
    return {
      id: String(a.id),
      title: toText(a.title, "Untitled"),
      // ✅ JSON uses 'description', your UI uses 'desc'
      desc: toText(a.description || a.desc || a.body, ""),
      created_at: createdAt,
      date: toText(a.dateLabel, createdAt ? formatDateLabel(createdAt) : "Recent"),
    };
  };

  // ---------- init ----------
  useEffect(() => {
    const init = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("userInfo");
        if (storedUser) setUser(JSON.parse(storedUser));

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
      if (navigation?.setParams && route?.params?.refreshKey) {
        navigation.setParams({ refreshKey: null });
      }
    }, [route?.params?.refreshKey])
  );

  const persistReadIds = async (nextSet) => {
    try {
      await AsyncStorage.setItem(
        READ_LECTURER_ANNOUNCEMENTS_KEY,
        JSON.stringify(Array.from(nextSet))
      );
    } catch (e) {
      console.log("Failed to save read ids:", e);
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

  const fetchDashboardData = async () => {
    let isSessionExpired = false;
    try {
      if (!refreshing) setLoading(true);

      const res = await api.get("/dashboard/");
      const data = res.data || {};

      // 1. Stats
      setStats(data.stats || { today: 0, week: 0 });
      setTodayClasses(Array.isArray(data.today_sessions) ? data.today_sessions : []);
      setWeekClasses(Array.isArray(data.week_sessions) ? data.week_sessions : []);

      // 2. Next Class
      if (data.next_class) {
        const nc = data.next_class;
        // Handle nested objects safely based on your JSON
        const moduleCode = toText(nc.module?.code || nc.module, "Module");
        const moduleName = toText(nc.module?.name || nc.title, "Class");

        setNextClass({
          id: String(nc.id),
          module: moduleCode,
          title: moduleName,
          date: toText(nc.date, ""),
          dateLabel: formatDateLabel(nc.date),
          dateFull: formatDateFull(nc.date),
          startISO: `${nc.date}T${nc.start_time}`,
          endISO: `${nc.date}T${nc.end_time}`,
          time: `${formatTime(nc.start_time)} – ${formatTime(nc.end_time)}`,
          // Your JSON shows venue is an object {id, name}
          venue: toText(nc.venue?.name || nc.venue, "TBA"),
          status: nc.status // capture status for logic if needed
        });
      } else {
        setNextClass(null);
      }

      // 3. Announcements (Directly from Dashboard API)
      const rawAnnouncements = Array.isArray(data.announcements) ? data.announcements : [];
      const formatted = rawAnnouncements.map(normalizeAnnouncement);

      // Sort: Newest first
      formatted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setAnnouncements(formatted);

    } catch (error) {
      if (error.response && error.response.status === 401) {
        isSessionExpired = true;
        return;
      }
    } finally {
      if (!isSessionExpired) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // ---------- navigation ----------
  const goToSessionsTab = () => {
    // Navigate using the stack structure we defined
    navigation.navigate("LecturerSessionsMain", { tab: "Upcoming" });
  };

  const goToClassList = (mode) => {
    const classesToSend = mode === "today" ? todayClasses : weekClasses;
    navigation.navigate("LecturerClassList", { mode, classes: classesToSend });
  };

  // ---------- announcements derived ----------
  const unreadAnnouncements = useMemo(
    () => announcements.filter((a) => !readAnnouncementIds.has(String(a.id))),
    [announcements, readAnnouncementIds]
  );

  const listToShow = showAllAnnouncements ? announcements : unreadAnnouncements;
  const visibleAnnouncements = isAnnounceExpanded ? listToShow : listToShow.slice(0, 3);
  const hasAnyAnnouncements = listToShow.length > 0;

  // ---------- loading ----------
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={["top"]}>

        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>

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
            <Text style={styles.name}>
              {toText(user?.first_name, "Lecturer")} 👩‍🏫
            </Text>

            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>Lecturer Mode</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TouchableOpacity style={styles.iconBtn} onPress={goToSessionsTab}>
              <Ionicons name="calendar-outline" size={22} color={COLORS.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatar}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("LecturerProfile")}
            >
              <Ionicons name="person" size={18} color="#fff" />
            </TouchableOpacity>

          </View>

        </View>

        {/* SUMMARY */}
        <View style={styles.summaryRow}>
          <TouchableOpacity style={styles.summaryCard} onPress={() => goToClassList("today")}>
            <Text style={styles.summaryValue}>{toText(stats?.today, "0")}</Text>
            <Text style={styles.summaryLabel}>Classes today</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.summaryCard} onPress={() => goToClassList("week")}>
            <Text style={styles.summaryValue}>{toText(stats?.week, "0")}</Text>
            <Text style={styles.summaryLabel}>Classes this week</Text>
          </TouchableOpacity>
        </View>

        {/* NEXT CLASS */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle}>Next class</Text>
            {nextClass && (
              <View style={styles.pill}>
                <Text style={styles.pillText}>{toText(nextClass.dateLabel, "")}</Text>
              </View>
            )}
          </View>

          {nextClass ? (
            <>
              <Text style={styles.module}>{toText(nextClass.module, "Module")}</Text>
              <Text style={styles.title}>{toText(nextClass.title, "Class")}</Text>

              {/* Optional: Show status if rescheduled */}
              {nextClass.status === 'rescheduled' && (
                <View style={[styles.pill, { backgroundColor: '#FEE2E2', marginTop: 4, alignSelf: 'flex-start' }]}>
                  <Text style={[styles.pillText, { color: '#DC2626' }]}>Rescheduled</Text>
                </View>
              )}

              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{toText(nextClass.dateFull, "")}</Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{toText(nextClass.time, "")}</Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{toText(nextClass.venue, "TBA")}</Text>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.primaryBtn} onPress={goToSessionsTab}>
                  <Ionicons name="open-outline" size={16} color="#fff" />
                  <Text style={styles.primaryBtnText}>View sessions</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() =>
                    // Pass nextClass (which is normalized) as 'cls'
                    navigation.navigate("LecturerClassDetail", { cls: nextClass })
                  }
                >
                  <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.secondaryBtnText}>Details</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={{ marginTop: 10, color: COLORS.textMuted }}>No upcoming classes.</Text>
          )}
        </View>
        <View style={{ height: 6 }} />

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
                  {showAllAnnouncements
                    ? `All (${announcements.length})`
                    : `Unread (${unreadAnnouncements.length})`}
                </Text>

                {!showAllAnnouncements && unreadAnnouncements.length > 0 && (
                  <View style={styles.unreadDot} />
                )}

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

          {!loading && !showAllAnnouncements && unreadAnnouncements.length > 0 && (
            <TouchableOpacity onPress={markAllRead} style={{ marginTop: 10, alignSelf: "flex-start" }}>
              <Text style={{ color: COLORS.primary, fontWeight: "900", fontSize: 13 }}>
                Mark all as read
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 10 }} />

          {!hasAnyAnnouncements ? (
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

                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text
                        style={{
                          fontWeight: "900",
                          color: COLORS.textDark,
                          fontSize: 16,
                          flex: 1,
                          opacity: isRead ? 0.65 : 1,
                        }}
                        numberOfLines={1}
                      >
                        {toText(a.title, "Untitled")}
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
                        fontSize: 14,
                        opacity: isRead ? 0.7 : 1,
                      }}
                      numberOfLines={2}
                    >
                      {toText(a.desc, "")}
                    </Text>

                    {!!a.date && (
                      <Text style={{ marginTop: 6, color: COLORS.textMuted, fontWeight: "800", fontSize: 11 }}>
                        {toText(a.date, "")}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {idx !== visibleAnnouncements.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })
          )}

          {!loading && !isAnnounceExpanded && listToShow.length > 3 && (
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
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 0 },

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
    borderRadius: 18,
    padding: 16,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  summaryValue: { fontSize: 22, fontWeight: "900", color: COLORS.primary },
  summaryLabel: { marginTop: 6, color: COLORS.textMuted, fontWeight: "700" },


  card: {
    marginTop: 14,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textDark },

  pill: { backgroundColor: COLORS.soft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { color: COLORS.primary, fontWeight: "800", fontSize: 12 },

  module: { marginTop: 10, fontWeight: "900", color: COLORS.primary, fontSize: 13 },
  title: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textDark
  },

  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 },
  metaText: { color: COLORS.textMuted, fontWeight: "600" },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  primaryBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,

    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
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
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: { color: COLORS.primary, fontWeight: "900" },

  // announcements
  announceHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  divider: { height: 1, backgroundColor: COLORS.border },

  unreadDot: { width: 8, height: 8, borderRadius: 99, backgroundColor: COLORS.danger },

  filterPill: {
    marginLeft: 8,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillText: { fontSize: 11, fontWeight: "900", color: COLORS.primary },

  newPill: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  newPillText: { fontSize: 10, fontWeight: "900", color: "#B91C1C", letterSpacing: 0.6 },

  readPill: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  readPillText: { fontSize: 10, fontWeight: "900", color: "#374151", letterSpacing: 0.6 },
});