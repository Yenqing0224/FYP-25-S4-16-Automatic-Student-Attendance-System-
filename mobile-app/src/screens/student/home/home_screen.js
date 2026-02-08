// src/screens/student/home/home_screen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import api from "../../../api/api_client";
import { registerForPushAndSync } from "../../../utils/push";

const COLORS = {
  primary: "#3A7AFE",
  teal: "#2EC4B6",
  lilac: "#A6C2FF",
  background: "#F5F7FB",
  textDark: "#111827",
  textMuted: "#6B7280",
  card: "#FFFFFF",
  border: "#E5E7EB",
  danger: "#EF4444",
};

const READ_ANNOUNCEMENTS_KEY = "studentReadAnnouncements_v1";
const ANNOUNCEMENT_EXPIRE_DAYS = 14;

// ✅ Render-safe helper
const toText = (v, fallback = "") => {
  if (v == null) return fallback;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map((x) => toText(x, "")).filter(Boolean).join(", ") || fallback;
  if (typeof v === "object") return String(v.name ?? v.title ?? v.code ?? v.id ?? fallback);
  return fallback;
};

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);

  // Dashboard Data
  const [semesterRange, setSemesterRange] = useState("Loading...");
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [todayClasses, setTodayClasses] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);

  // Announcements Data
  const [announcements, setAnnouncements] = useState([]);

  // Loading States
  const [loading, setLoading] = useState(true);

  // UI States
  const [isAnnounceExpanded, setIsAnnounceExpanded] = useState(false);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState(new Set());
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);

  // ---------------- Helpers ----------------
  const formatTime = (timeString) => (timeString ? String(timeString).slice(0, 5) : "");

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const formatDateLabel = (dStr) => {
    if (!dStr) return "";
    const d = new Date(dStr);
    const today = new Date();
    return d.toDateString() === today.toDateString()
      ? "Today"
      : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
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
    const createdAt = a.created_at || a.createdAt || null;
    return {
      id: String(a.id),
      title: toText(a.title, "Untitled"),
      desc: toText(a.description ?? a.message ?? a.desc, ""),
      created_at: createdAt,
      date: createdAt ? formatDateLabel(createdAt) : "Recent",
    };
  };

  // ---------------- Persistence ----------------
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(READ_ANNOUNCEMENTS_KEY);
        if (!raw) return;
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setReadAnnouncementIds(new Set(arr.map(String)));
      } catch (e) {
        console.log("Failed to load read announcements:", e);
      }
    })();
  }, []);

  const persistReadIds = async (nextSet) => {
    try {
      await AsyncStorage.setItem(READ_ANNOUNCEMENTS_KEY, JSON.stringify(Array.from(nextSet)));
    } catch (e) {
      console.log("Failed to save read announcements:", e);
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

  useEffect(() => {
    registerForPushAndSync();
  }, []);
  
  // ---------------- Data Fetching ----------------
  useEffect(() => {
    const initDashboard = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("userInfo");
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Init Error:", error);
      } finally {
        fetchDashboardData();
      }
    };
    initDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    let isSessionExpired = false;

    try {
      setLoading(true);

      const dashRes = await api.get("/dashboard/");
      const data = dashRes.data || {};

      // 1. Basic Info
      setSemesterRange(data.semester_range ?? "—");
      setAttendanceRate(Number(data.attendance_rate ?? 0));
      setTodayClasses(Array.isArray(data.today_classes) ? data.today_classes : []);
      setUpcomingClasses(Array.isArray(data.upcoming_classes) ? data.upcoming_classes : []);

      // 2. Announcements
      const rawAnnouncements = Array.isArray(data.announcements) ? data.announcements : [];
      let merged = rawAnnouncements.map(normalizeAnnouncement);

      merged = merged.filter((a) => !isExpired(a.created_at));

      const STUDENT_EXCLUDE_KEYWORDS = ["invigilation", "marking window", "grading", "lecturer briefing"];
      merged = merged.filter((a) => {
        const text = `${toText(a.title, "")} ${toText(a.desc, "")}`.toLowerCase();
        return !STUDENT_EXCLUDE_KEYWORDS.some((k) => text.includes(k));
      });

      merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setAnnouncements(merged);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        isSessionExpired = true;
        return;
      }
      console.error("Dashboard Fetch Error:", error?.response?.status, error?.config?.url);
    } finally {
      if (!isSessionExpired) setLoading(false);
    }
  };

  // ---------------- Current Date UI ----------------
  const [currentDate, setCurrentDate] = useState({ dayName: "", dateString: "" });
  useEffect(() => {
    const now = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    setCurrentDate({
      dayName: days[now.getDay()],
      dateString: `${now.getDate()}-${months[now.getMonth()]}-${now.getFullYear()}`,
    });
  }, []);

  // ---------------- Derived Lists ----------------
  const unreadAnnouncements = useMemo(
    () => announcements.filter((a) => !readAnnouncementIds.has(String(a.id))),
    [announcements, readAnnouncementIds]
  );

  const listToShow = showAllAnnouncements ? announcements : unreadAnnouncements;
  const visibleAnnouncements = isAnnounceExpanded ? listToShow : listToShow.slice(0, 3);
  const hasAnyAnnouncements = listToShow.length > 0;

  // ---------------- Render ----------------
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.greetingLabel}>Hello,</Text>
            <Text style={styles.greetingName}>
              {user ? `${toText(user.first_name, "Student")}` : "Student"} 👋
            </Text>

            <View style={styles.chip}>
              <Text style={styles.chipText}>Dashboard overview</Text>
            </View>
          </View>

          <View style={styles.dateContainer}>
            <Text style={styles.dateDay}>{toText(currentDate.dayName, "")}</Text>
            <Text style={styles.dateText}>{toText(currentDate.dateString, "")}</Text>
          </View>
        </View>

        {/* ATTENDANCE */}
        {attendanceRate !== null && attendanceRate !== undefined && (
          <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate("AttendanceHistory")}>
            <View style={styles.attendanceCard}>
              <Text style={styles.attendanceLabel}>Attendance rate</Text>
              <Text style={styles.attendanceSubtitle}>{toText(semesterRange, "—")}</Text>

              <View style={styles.attendanceCircle2}>
                <Ionicons name="trending-up-outline" size={18} color={COLORS.primary} />
                <Text style={styles.attendancePercentage}>
                  {loading ? "..." : `${Number(attendanceRate || 0).toFixed(0)}%`}
                </Text>
                <Text style={styles.attendanceMiniText}>Overall</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* ANNOUNCEMENTS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderText}>Announcements</Text>
        </View>

        <View style={[styles.attendanceCard, { paddingVertical: 16, alignItems: "stretch" }]}>
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
              <Text style={{ color: COLORS.primary, fontWeight: "900", fontSize: 13 }}>Mark all as read</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 10 }} />

          {loading ? (
            <View style={{ paddingVertical: 12 }}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
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
                <View key={String(a.id)}>
                  <TouchableOpacity
                    style={{ paddingVertical: 12 }}
                    onPress={async () => {
                      if (!isRead) await markAnnouncementRead(a.id);
                      navigation.navigate("StudentAnnouncementDetail", { announcement: a });
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
                        fontSize: 13,
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

        {/* TODAY */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderText}>Today&apos;s Classes</Text>
        </View>

        <View style={styles.paddingContainer}>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : todayClasses.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="moon-outline" size={40} color={COLORS.primary} />
              <Text style={styles.emptyStateText}>No classes today.</Text>
              <Text style={styles.emptyStateSubtext}>Have a good rest!</Text>
            </View>
          ) : (
            todayClasses.map((item) => (
              <View key={String(item.id)} style={styles.todayCard}>
                <View style={styles.todayCardInner}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {toText(item.module?.code, "Module")}
                  </Text>

                  <View style={styles.row}>
                    <Ionicons name="time-outline" size={16} color="#1E1B4B" />
                    <Text style={styles.cardDetail}>{toText(formatTime(item.start_time), "-")}</Text>
                  </View>

                  <View style={styles.row}>
                    <Ionicons name="location-outline" size={16} color="#1E1B4B" />
                    <Text style={styles.cardDetail} numberOfLines={1}>
                      {toText(item.venue, "TBA")}
                    </Text>
                  </View>

                  <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {toText(item.module?.name, "Class")}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* UPCOMING */}
        <View style={styles.sectionHeaderRow2}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionHeaderText}>Upcoming Classes</Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate("Timetable", { screen: "TimeTableMain" })}
              style={styles.seeAllBtn}
            >
              <Text style={styles.seeAllText}>See all</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionSubText}>Tap a card to jump to that date</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContainer}
        >
          {upcomingClasses.length === 0 && !loading ? (
            <Text style={styles.noUpcomingText}>No upcoming classes found.</Text>
          ) : (
            upcomingClasses.map((item) => (
              <TouchableOpacity
                key={String(item.id)}
                style={styles.upcomingCard2}
                activeOpacity={0.9}
                onPress={async () => {
                  const dateToJump = item.date;
                  await AsyncStorage.setItem("jumpToDate", String(dateToJump || ""));
                  navigation.navigate("Timetable", { screen: "TimeTableMain" });
                }}
              >
                <View style={styles.upTopRow}>
                  <View style={styles.modulePill}>
                    <Text style={styles.modulePillText}>{toText(item.module?.code, "MOD")}</Text>
                  </View>

                  <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.9)" />
                </View>

                <Text style={styles.upModuleName} numberOfLines={2}>
                  {toText(item.module?.name, "Class")}
                </Text>

                <View style={styles.upMetaRow}>
                  <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.upMetaText}>{toText(formatDate(item.date), "-")}</Text>
                </View>

                <View style={styles.upMetaRow}>
                  <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.upMetaText}>{toText(formatTime(item.start_time), "-")}</Text>
                </View>

                <View style={styles.upMetaRow}>
                  <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.upMetaText} numberOfLines={1}>
                    {toText(item.venue, "TBA")}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 0 },
  paddingContainer: { paddingHorizontal: 20 },

  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  greetingLabel: { fontSize: 14, fontWeight: "500", color: COLORS.textMuted },
  greetingName: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textDark,
    marginTop: 2,
    textTransform: "capitalize",
  },
  chip: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#E7F0FF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipText: { fontSize: 11, fontWeight: "600", color: COLORS.primary },
  dateContainer: { alignItems: "flex-end", justifyContent: "center" },
  dateDay: { fontSize: 14, fontWeight: "600", color: COLORS.primary },
  dateText: { fontSize: 13, fontWeight: "500", color: COLORS.textMuted, marginTop: 2 },

  attendanceCard: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 14,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },

  attendanceLabel: { fontSize: 16, fontWeight: "700", color: COLORS.textDark, marginBottom: 4 },
  attendanceSubtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 20 },

  attendanceCircle2: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#CFE0FF",
  },
  attendancePercentage: { fontSize: 30, fontWeight: "800", color: COLORS.primary },
  attendanceMiniText: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
  },

  sectionHeaderRow: { paddingHorizontal: 20, marginBottom: 8, marginTop: 6 },
  sectionHeaderText: { fontSize: 16, fontWeight: "700", color: COLORS.textDark },

  sectionHeaderRow2: { paddingHorizontal: 20, marginBottom: 10, marginTop: 6 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionSubText: { marginTop: 4, color: COLORS.textMuted, fontSize: 12, fontWeight: "600" },

  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E7F0FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  seeAllText: { color: COLORS.primary, fontWeight: "800", fontSize: 12 },

  todayCard: {
    backgroundColor: "#8C99FF",
    borderRadius: 18,
    padding: 2,
    marginBottom: 14,
    elevation: 3,
    shadowColor: "#8C99FF",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  todayCardInner: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#1E1B4B", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 4, gap: 6 },
  cardDetail: { fontSize: 14, fontWeight: "600", color: "#1E1B4B" },
  cardSubtitle: { marginTop: 10, fontSize: 13, fontWeight: "600", color: COLORS.primary },

  horizontalScrollContainer: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 2 },

  // old upcoming styles kept (safe)
  upcomingCard: {
    backgroundColor: "#3A7AFE",
    borderRadius: 18,
    padding: 14,
    width: 160,
    marginRight: 12,
    shadowColor: "#3A7AFE",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  upcomingLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "600",
    marginBottom: 2,
  },
  upcomingValue: { fontSize: 14, fontWeight: "700", color: "#FFFFFF", marginBottom: 6 },
  upcomingModule: { marginTop: 6, fontSize: 14, fontWeight: "800", color: "#FFFFFF" },

  // ✅ new modern upcoming card
  upcomingCard2: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 14,
    width: 190,
    marginRight: 12,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 5,
  },
  upTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modulePill: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  modulePillText: { color: "#fff", fontWeight: "900", fontSize: 12 },
  upModuleName: { marginTop: 10, fontSize: 16, fontWeight: "900", color: "#fff", lineHeight: 20 },
  upMetaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  upMetaText: { flex: 1, color: "rgba(255,255,255,0.92)", fontWeight: "700", fontSize: 13 },

  noUpcomingText: { marginLeft: 20, color: COLORS.textMuted, fontSize: 13 },

  emptyStateContainer: {
    alignItems: "center",
    paddingVertical: 22,
    backgroundColor: "#F0F4FF",
    borderRadius: 18,
    gap: 8,
  },
  emptyStateText: { fontSize: 15, fontWeight: "700", color: COLORS.textDark },
  emptyStateSubtext: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },

  announceHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  divider: { height: 1, backgroundColor: COLORS.border },
  unreadDot: { width: 8, height: 8, borderRadius: 99, backgroundColor: COLORS.danger },

  filterPill: {
    marginLeft: 8,
    backgroundColor: "#E7F0FF",
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
  readPillText: { fontSize: 10, fontWeight: "900", color: "#374151", letterSpacing: 0.6 },
});
