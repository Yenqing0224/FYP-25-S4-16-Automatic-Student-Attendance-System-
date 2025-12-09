import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios'; // Import Axios

const HomeScreen = ({ navigation }) => {

  // 1. STATE VARIABLES
  const [user, setUser] = useState(null);
  const [semesterRange, setSemesterRange] = useState("Loading...");
  const [todayClasses, setTodayClasses] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // API URL
  const API_URL = 'https://attendify-ekg6.onrender.com/api/dashboard/';

  // 2. LOAD USER & FETCH DATA
  useEffect(() => {
    const initDashboard = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('userInfo');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          // Call Backend with User ID
          fetchDashboardData(parsedUser.id);
        }
      } catch (error) {
        console.error("Init Error:", error);
      }
    };
    initDashboard();
  }, []);

  const fetchDashboardData = async (userId) => {
    try {
      const response = await axios.get(`${API_URL}?user_id=${userId}`);
      const data = response.data;

      setSemesterRange(data.semester_range);
      setTodayClasses(data.today_classes);
      setUpcomingClasses(data.upcoming_classes);
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. HELPER: Format Time (e.g., 2025-10-05T14:00:00 -> 2:00pm)
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  // 4. HELPER: Format Date (e.g., 5 Nov)
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  // 5. HELPER: Get Random Pastel Color
  const getCardColor = (index) => {
    const colors = ['#FFB6C1', '#FFE4B5', '#ADD8E6', '#98FB98', '#E6E6FA'];
    return colors[index % colors.length];
  };

  // DATE LOGIC (For Header)
  const [currentDate, setCurrentDate] = useState({ dayName: '', dateString: '' });
  useEffect(() => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    setCurrentDate({
      dayName: days[now.getDay()],
      dateString: `${now.getDate()}-${months[now.getMonth()]}-${now.getFullYear()}`
    });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* --- HEADER --- */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.greetingLabel}>Hello,</Text>
            <Text style={styles.greetingName}>
                {user
                ? `${user.first_name}`
                : "Loading..."}!</Text>
          </View>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{currentDate.dayName}</Text>
            <Text style={styles.dateText}>{currentDate.dateString}</Text>
          </View>
        </View>

        {/* --- ATTENDANCE (Placeholder for now) --- */}
        <View style={styles.attendanceContainer}>
          <Text style={styles.attendanceTitle}>Attendance rate</Text>
          <Text style={styles.attendancePercentage}>83%</Text>
          <Text style={styles.attendanceSubtitle}>{semesterRange}</Text>
        </View>

        {/* --- TODAY'S CLASSES --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Today's Classes</Text>
        </View>

        <View style={styles.paddingContainer}>
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : todayClasses.length === 0 ? (
            // ✅ EMPTY STATE UI
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateEmoji}>💤</Text>
              <Text style={styles.emptyStateText}>No classes today.</Text>
              <Text style={styles.emptyStateSubtext}>Have a good rest!</Text>
            </View>
          ) : (
            todayClasses.map((item, index) => (
              <View
                key={item.id}
                style={[styles.todayCard, { backgroundColor: getCardColor(index) }]}
              >
                <Text style={styles.cardTitle}>{item.module.code}</Text>
                <Text style={styles.cardDetail}>
                  {formatTime(item.date_time)} - {item.venue}
                </Text>
                <Text style={styles.cardDetail}>{item.module.name}</Text>
              </View>
            ))
          )}
        </View>

        {/* --- UPCOMING CLASSES --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Upcoming Classes</Text>
        </View>

        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContainer}
        >
          {upcomingClasses.length === 0 && !loading ? (
            <Text style={{ marginLeft: 20, color: '#777' }}>No upcoming classes found.</Text>
          ) : (
            upcomingClasses.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.upcomingCard}
                onPress={async () => {
                  const dateToJump = item.date_time.split('T')[0];
                  await AsyncStorage.setItem('jumpToDate', dateToJump);

                  // 2. Go to Timetable
                  navigation.navigate('Timetable');
                }}
              >
                <Text style={styles.upcomingDate}>{formatDate(item.date_time)}</Text>
                <Text style={styles.upcomingDetail}>{formatTime(item.date_time)}</Text>
                <Text style={styles.upcomingDetail}>{item.module.code}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <View style={{ height: 40 }} />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 20 },
  paddingContainer: { paddingHorizontal: 20 },

  headerContainer: {
    flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 20,
  },
  greetingLabel: { fontSize: 16, fontWeight: '600', color: '#000' },
  greetingName: { fontSize: 18, fontWeight: 'bold', color: '#000', textTransform: 'capitalize' },
  dateContainer: { alignItems: 'flex-end' },
  dateText: { fontSize: 14, fontWeight: '600', color: '#000' },

  attendanceContainer: { alignItems: 'center', marginBottom: 25 },
  attendanceTitle: { fontSize: 18, fontWeight: '700', marginBottom: 5 },
  attendancePercentage: { fontSize: 48, fontWeight: 'bold', color: '#000' },
  attendanceSubtitle: { fontSize: 14, color: '#555', marginTop: 5 },

  sectionHeader: {
    backgroundColor: '#E0E0E0', paddingVertical: 10, paddingHorizontal: 20, marginBottom: 15,
  },
  sectionHeaderText: { fontSize: 16, fontWeight: '700', color: '#000' },

  todayCard: { borderRadius: 12, padding: 20, marginBottom: 15 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  cardDetail: { fontSize: 14, fontWeight: '600', marginBottom: 2 },

  horizontalScrollContainer: { paddingHorizontal: 20 },
  upcomingCard: {
    backgroundColor: '#EAEAEA', borderRadius: 10, padding: 15, width: 130, marginRight: 15,
  },
  upcomingDate: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  upcomingDetail: { fontSize: 12, color: '#555', marginBottom: 2 },

  // ✅ New Empty State Styles
  emptyStateContainer: { alignItems: 'center', paddingVertical: 20, backgroundColor: '#f9f9f9', borderRadius: 10 },
  emptyStateEmoji: { fontSize: 40, marginBottom: 10 },
  emptyStateText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  emptyStateSubtext: { fontSize: 14, color: '#777' },
});

export default HomeScreen;