// src/screens/student/home/home_screen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../api/api_client';

const COLORS = {
  primary: '#3A7AFE',
  teal: '#2EC4B6',
  lilac: '#A6C2FF',
  background: '#F5F7FB',
  textDark: '#111827',
  textMuted: '#6B7280',
  card: '#FFFFFF',
};

const READ_ANNOUNCEMENTS_KEY = "studentReadAnnouncements_v1";

const HomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dashboard Data
  const [semesterRange, setSemesterRange] = useState('Loading...');
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [todayClasses, setTodayClasses] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  
  // ✅ Announcements State
  const [announcements, setAnnouncements] = useState([]);
  const [isAnnounceExpanded, setIsAnnounceExpanded] = useState(false);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState(new Set());

  // 1. Load User & Read Announcements IDs
  useEffect(() => {
    const init = async () => {
      try {
        // Load User
        const storedUser = await AsyncStorage.getItem('userInfo');
        if (storedUser) setUser(JSON.parse(storedUser));

        // Load Read Announcements
        const rawRead = await AsyncStorage.getItem(READ_ANNOUNCEMENTS_KEY);
        if (rawRead) {
          const arr = JSON.parse(rawRead);
          if (Array.isArray(arr)) setReadAnnouncementIds(new Set(arr.map(String)));
        }

        fetchDashboardData();
      } catch (error) {
        console.error('Init Error:', error);
      }
    };
    init();
  }, []);

  // 2. Fetch Dashboard Data
  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/');
      const data = response.data;

      setSemesterRange(data.semester_range);
      setAttendanceRate(data.attendance_rate);
      setTodayClasses(data.today_classes || []);
      setUpcomingClasses(data.upcoming_classes || []);

      // ✅ Process Announcements from Dashboard API
      if (data.announcements && Array.isArray(data.announcements)) {
        const formattedAnnouncements = data.announcements.map(a => ({
          id: a.id,
          title: a.title,
          desc: a.message || a.description || "", // Handle different key names if necessary
          date: formatDate(a.created_at) || "Recent"
        }));
        setAnnouncements(formattedAnnouncements);
      }

    } catch (error) {
      console.error('Dashboard Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Announcement Helpers
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

  // --- UI Helpers ---
  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.slice(0, 5);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  // Current Date logic
  const [currentDate, setCurrentDate] = useState({ dayName: '', dateString: '' });
  useEffect(() => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    setCurrentDate({
      dayName: days[now.getDay()],
      dateString: `${now.getDate()}-${months[now.getMonth()]}-${now.getFullYear()}`,
    });
  }, []);

  // Filter Announcements
  const unreadAnnouncements = announcements.filter(
    (a) => !readAnnouncementIds.has(String(a.id))
  );
  
  // Decide what to show (Expand logic)
  // If expanded, show ALL unread. If collapsed, show max 3 unread.
  const visibleAnnouncements = isAnnounceExpanded
    ? unreadAnnouncements
    : unreadAnnouncements.slice(0, 3);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.greetingLabel}>Hello,</Text>
            <Text style={styles.greetingName}>
              {user ? `${user.first_name}` : "Student"} 👋
            </Text>

            <View style={styles.chip}>
              <Text style={styles.chipText}>Dashboard overview</Text>
            </View>
          </View>

          <View style={styles.dateContainer}>
            <Text style={styles.dateDay}>{currentDate.dayName}</Text>
            <Text style={styles.dateText}>{currentDate.dateString}</Text>
          </View>
        </View>

        {/* ATTENDANCE CARD */}
        {attendanceRate !== null && attendanceRate !== undefined && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('AttendanceHistory')}
          >
            <View style={styles.attendanceCard}>
              <Text style={styles.attendanceLabel}>Attendance rate</Text>
              <Text style={styles.attendanceSubtitle}>{semesterRange}</Text>

              <View style={styles.attendanceCircle}>
                <Text style={styles.attendancePercentage}>
                  {loading ? "..." : `${attendanceRate.toFixed(0)}%`}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* ✅ ANNOUNCEMENTS SECTION */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderText}>Announcements</Text>
        </View>

        <View style={[styles.announcementCard]}>
          {/* Header Row (Collapsible) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setIsAnnounceExpanded((v) => !v)}
            style={styles.announceHeaderRow}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="megaphone-outline" size={18} color={COLORS.primary} />
              <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.textDark }}>
                Unread ({unreadAnnouncements.length})
              </Text>
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

          {/* Mark All Read Button */}
          {!loading && unreadAnnouncements.length > 0 && (
            <TouchableOpacity onPress={markAllRead} style={{ marginTop: 10, alignSelf: "flex-start" }}>
              <Text style={{ color: COLORS.primary, fontWeight: "900", fontSize: 13 }}>
                Mark all as read
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 10 }} />

          {/* List */}
          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : unreadAnnouncements.length === 0 ? (
            <View style={{ paddingVertical: 10 }}>
              <Text style={{ color: COLORS.textMuted, fontWeight: "700" }}>
                You’re all caught up ✅
              </Text>
            </View>
          ) : (
            visibleAnnouncements.map((a, idx) => (
              <View key={a.id}>
                <TouchableOpacity
                  style={{ paddingVertical: 12 }}
                  onPress={async () => {
                    await markAnnouncementRead(a.id);
                    // Ensure you have this screen registered in App.js or remove navigation if just marking read
                    navigation.navigate("StudentAnnouncementDetail", { announcement: a }); 
                  }}
                >
                  <Text style={{ fontWeight: "900", color: COLORS.textDark, fontSize: 15 }} numberOfLines={1}>
                    {a.title}
                  </Text>

                  <Text
                    style={{ marginTop: 4, color: COLORS.textMuted, fontWeight: "500", lineHeight: 20, fontSize: 13 }}
                    numberOfLines={2}
                  >
                    {a.desc}
                  </Text>

                  <Text style={{ marginTop: 6, color: COLORS.textMuted, fontWeight: "800", fontSize: 11 }}>
                    {a.date}
                  </Text>
                </TouchableOpacity>

                {/* Divider */}
                {idx !== visibleAnnouncements.length - 1 && (
                  <View style={{ height: 1, backgroundColor: "#F3F4F6" }} />
                )}
              </View>
            ))
          )}

          {/* View More Button */}
          {!loading && !isAnnounceExpanded && unreadAnnouncements.length > 3 && (
            <TouchableOpacity
              onPress={() => setIsAnnounceExpanded(true)}
              style={{ marginTop: 8, paddingVertical: 8, alignItems: "center", borderTopWidth: 1, borderTopColor: '#F3F4F6' }}
            >
              <Text style={{ color: COLORS.primary, fontWeight: "900", fontSize: 13 }}>
                View {unreadAnnouncements.length - 3} more
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
              <View key={item.id} style={styles.todayCard}>
                <View style={styles.todayCardInner}>
                  <Text style={styles.cardTitle}>{item.module.code}</Text>

                  <View style={styles.row}>
                    <Ionicons name="time-outline" size={16} color="#1E1B4B" />
                    <Text style={styles.cardDetail}>{formatTime(item.start_time)}</Text>
                  </View>

                  <View style={styles.row}>
                    <Ionicons name="location-outline" size={16} color="#1E1B4B" />
                    <Text style={styles.cardDetail}>{item.venue}</Text>
                  </View>

                  <Text style={styles.cardSubtitle}>{item.module.name}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* UPCOMING */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderText}>Upcoming Classes</Text>
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
                key={item.id}
                style={styles.upcomingCard}
                onPress={async () => {
                  const dateToJump = item.date;
                  await AsyncStorage.setItem('jumpToDate', dateToJump);
                  navigation.navigate('Timetable', {
                    screen: 'TimeTableMain',
                  });
                }}
              >
                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.upcomingLabel}>Date</Text>
                  <Text style={styles.upcomingValue}>{formatDate(item.date)}</Text>
                </View>

                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.upcomingLabel}>Time</Text>
                  <Text style={styles.upcomingValue}>{formatTime(item.start_time)}</Text>
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.upcomingLabel}>Venue</Text>
                  <Text style={styles.upcomingValue}>{item.venue || 'TBA'}</Text>
                </View>

                <Text style={styles.upcomingModule}>
                  {item.module.code} — {item.module.name}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  paddingContainer: {
    paddingHorizontal: 20,
  },

  // HEADER
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  greetingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  greetingName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textDark,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  chip: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#E7F0FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  dateContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  dateDay: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // ATTENDANCE CARD
  attendanceCard: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 22,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  attendanceLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  attendanceSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 20,
  },
  attendanceCircle: {
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor: '#E3EDFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendancePercentage: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.primary,
  },

  // SECTION HEADER
  sectionHeaderRow: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  // ✅ ANNOUNCEMENT STYLES
  announcementCard: {
    marginHorizontal: 20,
    marginBottom: 22,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  announceHeaderRow: {
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center" 
  },

  // TODAY CARDS
  todayCard: {
    backgroundColor: '#8C99FF',
    borderRadius: 18,
    padding: 2,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#8C99FF',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  todayCardInner: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B4B',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  cardDetail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1B4B',
  },
  cardSubtitle: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // UPCOMING
  horizontalScrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  upcomingCard: {
    backgroundColor: '#3A7AFE',
    borderRadius: 18,
    padding: 14,
    width: 160,
    marginRight: 12,
    shadowColor: '#3A7AFE',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  upcomingLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    marginBottom: 2,
  },
  upcomingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  upcomingModule: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  noUpcomingText: {
    marginLeft: 20,
    color: COLORS.textMuted,
    fontSize: 13,
  },

  // EMPTY STATE
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 22,
    backgroundColor: '#F0F4FF',
    borderRadius: 18,
    gap: 8,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});

export default HomeScreen;