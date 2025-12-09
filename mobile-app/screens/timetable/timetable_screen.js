import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';

const TimetableScreen = ({ navigation }) => {

  const [activeTab, setActiveTab] = useState('Selected');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [fullSchedule, setFullSchedule] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(true);

  const API_URL = 'https://attendify-ekg6.onrender.com/api/timetable/';

  // --- 1. NAVIGATION LISTENER ---
  useFocusEffect(
    useCallback(() => {
      const checkJumpDate = async () => {
        try {
          const jumpDate = await AsyncStorage.getItem('jumpToDate');

          if (jumpDate) {
            console.log("📍 FOUND DATE (From Home):", jumpDate);

            // Case A: Coming from Home Screen -> Jump to specific date
            setSelectedDate(jumpDate);
            setActiveTab('Selected');

            // Clear it so it doesn't get stuck
            await AsyncStorage.removeItem('jumpToDate');
          } else {
            const today = new Date().toISOString().split('T')[0];
            setSelectedDate(today);
          }
        } catch (e) {
          console.error("Jump error:", e);
        }
      };

      checkJumpDate();
    }, [])
  );

  // --- 2. DATA FETCHING ---
  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userInfo');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const response = await axios.get(`${API_URL}?user_id=${user.id}`);
        setFullSchedule(response.data);
        processCalendarDots(response.data);
      }
    } catch (error) {
      console.error("Timetable Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 3. FORMATTING HELPERS (New) ---

  // Format: "12:00"
  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // Set to true if you want 12:00 pm
    });
  };

  // Format: "08 Dec 2025"
  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Format: "11 Dec"
  const formatDateShort = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const processCalendarDots = (data) => {
    const marks = {};
    data.forEach(session => {
      const dateKey = session.date_time.split('T')[0];
      marks[dateKey] = {
        dots: [{ key: 'class', color: '#90CAF9' }]
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
        selectedColor: '#3F4E85',
        dots: [{ key: 'class', color: '#ffffff' }]
      };
    } else {
      newMarked[selectedDate] = {
        selected: true,
        selectedColor: '#3F4E85',
      };
    }
    return newMarked;
  };

  // --- 4. RENDER SECTIONS ---

  const renderSelectedContent = () => {
    const classesForDay = fullSchedule.filter(item =>
      item.date_time.startsWith(selectedDate)
    );

    return (
      <View>
        {/* ✅ POLISHED: "08 Dec 2025" */}
        <Text style={styles.sectionDateTitle}>
          {formatDateHeader(selectedDate)}
        </Text>

        {classesForDay.length > 0 ? (
          classesForDay.map((item) => (
            <View key={item.id} style={[styles.eventCard, styles.cardBlue]}>
              <View style={styles.cardContent}>
                <Text style={styles.eventTitle}>{item.module.code} - {item.module.name}</Text>
                <Text style={styles.eventTime}>{formatTime(item.date_time)}</Text>
                <Text style={styles.eventLoc}>{item.venue}</Text>
              </View>
            </View>
          ))
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
    const upcoming = fullSchedule.filter(item => new Date(item.date_time) > now);

    return (
      <View>
        <Text style={styles.sectionDateTitle}>Upcoming Events</Text>
        {upcoming.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#999' }}>No upcoming classes.</Text>
        ) : (
          upcoming.slice(0, 5).map((item) => (
            <View key={item.id} style={[styles.eventCard, styles.cardUpcoming]}>
              <View style={styles.cardContent}>
                <Text style={styles.eventTitle}>{item.module.code} - {item.module.name}</Text>

                {/* ✅ POLISHED: "11 Dec • 12:00" */}
                <Text style={styles.eventTime}>
                  {formatDateShort(item.date_time)} • {formatTime(item.date_time)}
                </Text>

                <Text style={styles.eventLoc}>{item.venue}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView edges={['top']} style={styles.topSafeArea} />
      <View style={styles.contentContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#EAEAEA" />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Text style={styles.backArrow}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Timetable</Text>
          <View style={{ width: 20 }} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>

            <View style={styles.calendarCard}>
              <Calendar
                current={selectedDate}
                key={selectedDate} // Force re-render on date change
                onDayPress={day => {
                  setSelectedDate(day.dateString);
                  setActiveTab('Selected');
                }}
                markingType={'multi-dot'}
                markedDates={getDisplayMarkedDates()}
                theme={{
                  selectedDayBackgroundColor: '#3F4E85',
                  todayTextColor: '#3A7AFE',
                  arrowColor: 'black',
                  textMonthFontWeight: 'bold',
                }}
              />
            </View>

            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, activeTab === 'Selected' ? styles.activeBtn : styles.inactiveBtn]}
                onPress={() => setActiveTab('Selected')}
              >
                <Text style={activeTab === 'Selected' ? styles.activeText : styles.inactiveText}>Selected</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleButton, activeTab === 'Upcoming' ? styles.activeBtn : styles.inactiveBtn]}
                onPress={() => {
                  setActiveTab('Upcoming');
                  setSelectedDate(new Date().toISOString().split('T')[0]);
                }}
              >
                <Text style={activeTab === 'Upcoming' ? styles.activeText : styles.inactiveText}>Upcoming</Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'Selected' ? renderSelectedContent() : renderUpcomingContent()}

          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#fff' },
  topSafeArea: { flex: 0, backgroundColor: '#EAEAEA' },
  contentContainer: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 20 },
  header: {
    backgroundColor: '#EAEAEA', paddingVertical: 15, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backArrow: { fontSize: 24, color: '#333', fontWeight: '300' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  calendarCard: {
    backgroundColor: '#fff', marginHorizontal: 10, borderRadius: 20, padding: 10, marginTop: 10,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5,
  },
  toggleContainer: {
    flexDirection: 'row', backgroundColor: '#EAEAEA', marginHorizontal: 20, marginTop: 20,
    borderRadius: 30, padding: 2, height: 50,
  },
  toggleButton: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 28 },
  activeBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', elevation: 2 },
  inactiveBtn: { backgroundColor: 'transparent' },
  activeText: { fontWeight: 'bold', color: '#000' },
  inactiveText: { fontWeight: 'bold', color: '#999' },

  sectionDateTitle: { fontSize: 18, fontWeight: 'bold', margin: 20, marginBottom: 10 },

  eventCard: { marginHorizontal: 20, borderRadius: 12, padding: 20, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between' },

  cardBlue: { backgroundColor: '#B3E5FC' },
  cardUpcoming: { backgroundColor: '#FFF9C4' },

  cardContent: { flex: 1 },
  eventTitle: { fontWeight: 'bold', fontSize: 16 },
  eventTime: { fontSize: 14, marginTop: 4 },
  eventLoc: { fontSize: 14, color: '#555', marginTop: 2 },
  emptyContainer: { alignItems: 'center', padding: 20 },
  emptyText: { color: '#999', fontSize: 16 }
});

export default TimetableScreen;