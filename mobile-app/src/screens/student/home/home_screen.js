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

const HomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [semesterRange, setSemesterRange] = useState('Loading...');
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [todayClasses, setTodayClasses] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // load user + dashboard
  useEffect(() => {
    const initDashboard = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('userInfo');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        fetchDashboardData();
      } catch (error) {
        console.error('Init Error:', error);
      }
    };
    initDashboard();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/');
      const data = response.data;

      setSemesterRange(data.semester_range);
      setAttendanceRate(data.attendance_rate);
      setTodayClasses(data.today_classes);
      setUpcomingClasses(data.upcoming_classes);
    } catch (error) {
      console.error('Dashboard Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- UPDATED HELPERS ---

  // Format "14:00:00" -> "14:00"
  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.slice(0, 5);
  };

  // Format "2025-12-17" -> "17 Dec"
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
        {/* Only show if rate exists (Students) */}
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
                    {/* ✅ UPDATED: Use start_time */}
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
                  // ✅ UPDATED: Use item.date directly
                  const dateToJump = item.date;
                  await AsyncStorage.setItem('jumpToDate', dateToJump);
                  navigation.navigate('Timetable', {
                    screen: 'TimeTableMain',
                  });
                }}
              >
                {/* LABEL + VALUE */}
                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.upcomingLabel}>Date</Text>
                  {/* ✅ UPDATED: Use item.date */}
                  <Text style={styles.upcomingValue}>{formatDate(item.date)}</Text>
                </View>

                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.upcomingLabel}>Time</Text>
                  {/* ✅ UPDATED: Use item.start_time */}
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

// ... STYLES (Keep exactly the same as you had) ...
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

  // ATTENDANCE
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