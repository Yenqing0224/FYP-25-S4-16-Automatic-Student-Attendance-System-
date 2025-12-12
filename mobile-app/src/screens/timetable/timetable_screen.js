import React, { useState, useEffect, useCallback } from 'react';
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
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/api_client'; // 👈 1. Use your API Helper

const TimetableScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Selected');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [fullSchedule, setFullSchedule] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(true);

  // --- 1. NAVIGATION LISTENER ---
  useFocusEffect(
    useCallback(() => {
      const checkJumpDate = async () => {
        try {
          const jumpDate = await AsyncStorage.getItem('jumpToDate');

          if (jumpDate) {
            console.log('📍 FOUND DATE (From Home):', jumpDate);
            setSelectedDate(jumpDate);
            setActiveTab('Selected');
            await AsyncStorage.removeItem('jumpToDate');
          }
        } catch (e) {
          console.error('Jump error:', e);
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
      // 👈 2. Clean & Secure API Call
      // Token is attached automatically by api_client.js
      const response = await api.get('/timetable/');
      
      setFullSchedule(response.data);
      processCalendarDots(response.data);

    } catch (error) {
      console.error('Timetable Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- 3. FORMATTING HELPERS ---

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateShort = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    });
  };

  const processCalendarDots = (data) => {
    const marks = {};
    data.forEach((session) => {
      const dateKey = session.date_time.split('T')[0];
      marks[dateKey] = {
        dots: [{ key: 'class', color: '#90CAF9' }],
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
        dots: [{ key: 'class', color: '#ffffff' }],
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
    const classesForDay = fullSchedule.filter((item) =>
      item.date_time.startsWith(selectedDate)
    );

    return (
      <View>
        <Text style={styles.sectionDateTitle}>
          {formatDateHeader(selectedDate)}
        </Text>

        {classesForDay.length > 0 ? (
          classesForDay.map((item) => (
            <TouchableOpacity 
                key={item.id} 
                style={[styles.eventCard, styles.cardSelected]}
                onPress={() => navigation.navigate('ClassDetail', { session_id: item.id })}
            >
              <View style={styles.cardAccent} />
              <View style={styles.cardContent}>
                <Text style={styles.eventTitle}>
                  {item.module.code} · {item.module.name}
                </Text>
                <Text style={styles.eventTime}>{formatTime(item.date_time)}</Text>
                <Text style={styles.eventLoc}>{item.venue}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No classes scheduled for this day.
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderUpcomingContent = () => {
    const now = new Date();
    const upcoming = fullSchedule
      .filter(item => new Date(item.date_time) > now)
      .sort((a, b) => new Date(a.date_time) - new Date(b.date_time));

    return (
      <View>
        <Text style={styles.sectionDateTitle}>Upcoming Classes</Text>

        {upcoming.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No upcoming classes.</Text>
          </View>
        ) : (
          upcoming.slice(0, 5).map((item) => {
            const sessionType = item.session_type || item.type || "Class";

            return (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.eventCard, styles.cardUpcoming]}
                onPress={() => navigation.navigate('ClassDetail', { session_id: item.id })}
              >
                {/* Top row: module + chip */}
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.upTitle}>
                    {item.module.code} • {item.module.name}
                  </Text>

                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{sessionType}</Text>
                  </View>
                </View>

                {/* Date row */}
                <View style={styles.upRow}>
                  <Text style={styles.upIcon}>🗓</Text>
                  <Text style={styles.upLabel}>Date</Text>
                  <Text style={styles.upValue}>
                    {formatDateShort(item.date_time)}
                  </Text>
                </View>

                {/* Time row */}
                <View style={styles.upRow}>
                  <Text style={styles.upIcon}>⏰</Text>
                  <Text style={styles.upLabel}>Time</Text>
                  <Text style={styles.upValue}>
                    {formatTime(item.date_time)}
                  </Text>
                </View>

                {/* Location row */}
                <View style={styles.upRow}>
                  <Text style={styles.upIcon}>📍</Text>
                  <Text style={styles.upLabel}>Location</Text>
                  <Text style={styles.upValue}>
                    {item.venue}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    );
  };


  return (
    <View style={styles.mainContainer}>
      <SafeAreaView edges={['top']} style={styles.topSafeArea} />
      <View style={styles.contentContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F0F2FA" />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Text style={styles.backArrow}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Timetable</Text>
          <View style={{ width: 20 }} />
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#3A7AFE"
            style={{ marginTop: 50 }}
          />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.calendarCard}>
              <Calendar
                current={selectedDate}
                key={selectedDate}
                onDayPress={(day) => {
                  setSelectedDate(day.dateString);
                  setActiveTab('Selected');
                }}
                markingType={'multi-dot'}
                markedDates={getDisplayMarkedDates()}
                theme={{
                  selectedDayBackgroundColor: '#3F4E85',
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: '#3A7AFE',
                  arrowColor: '#111827',
                  monthTextColor: '#111827',
                  textMonthFontWeight: '700',
                  textDayHeaderFontWeight: '600',
                }}
              />
            </View>

            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  activeTab === 'Selected'
                    ? styles.activeBtn
                    : styles.inactiveBtn,
                ]}
                onPress={() => setActiveTab('Selected')}
              >
                <Text
                  style={
                    activeTab === 'Selected'
                      ? styles.activeText
                      : styles.inactiveText
                  }
                >
                  Selected
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  activeTab === 'Upcoming'
                    ? styles.activeBtn
                    : styles.inactiveBtn,
                ]}
                onPress={() => {
                  setActiveTab('Upcoming');
                  setSelectedDate(new Date().toISOString().split('T')[0]);
                }}
              >
                <Text
                  style={
                    activeTab === 'Upcoming'
                      ? styles.activeText
                      : styles.inactiveText
                  }
                >
                  Upcoming
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'Selected'
              ? renderSelectedContent()
              : renderUpcomingContent()}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F5F7FB' },
  topSafeArea: { flex: 0, backgroundColor: '#F0F2FA' },
  contentContainer: { flex: 1, backgroundColor: '#F5F7FB' },
  scrollContent: { paddingBottom: 24 },

  header: {
    backgroundColor: '#F0F2FA',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backArrow: { fontSize: 24, color: '#4B5563', fontWeight: '300' },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.3,
  },

  calendarCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 999,
    padding: 2,
    height: 44,
  },
  toggleButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  activeBtn: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  inactiveBtn: {
    backgroundColor: 'transparent',
  },
  activeText: { fontWeight: '700', color: '#111827', fontSize: 14 },
  inactiveText: { fontWeight: '600', color: '#9CA3AF', fontSize: 14 },

  sectionDateTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },

  eventCard: {
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardBlue: {
    backgroundColor: '#E3F2FD',
  },
  cardSelected: {
    backgroundColor: '#EAF1FF',
  },
  cardUpcoming: {
    backgroundColor: '#EAF1FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3A7AFE',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  upTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2B5F',
    marginRight: 8,
  },

  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(58, 122, 254, 0.12)',
    alignSelf: 'flex-start',
  },

  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3A7AFE',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  upRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  upIcon: {
    width: 20,
    fontSize: 14,
  },

  upLabel: {
    width: 70,
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },

  upValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#222',
  },
  
  cardAccent: {
    width: 4,
    borderRadius: 999,
    backgroundColor: '#3A7AFE',
    marginRight: 10,
  },
  
  // Reuse existing styles
  emptyContainer: { alignItems: 'center', padding: 24 },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
  
  // Missing text styles that were used in renderSelectedContent
  cardContent: { flex: 1 },
  eventTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  eventTime: { fontSize: 14, fontWeight: '600', color: '#3A7AFE', marginBottom: 2 },
  eventLoc: { fontSize: 13, color: '#6B7280' },
});

export default TimetableScreen;