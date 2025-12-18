import React, { useState, useCallback } from 'react'; // Import useCallback
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native'; // 👈 Import this!
import api from '../../../api/api_client'; 

const ClassDetailScreen = ({ route, navigation }) => {
  const { session_id } = route.params;
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- REFRESH LOGIC ---
  useFocusEffect(
    useCallback(() => {
      let isActive = true; // Prevents updating state if screen is closed

      const fetchData = async () => {
        try {
          // Silent fetch (only show loading spinner on first load)
          const response = await api.get(`/class-details/${session_id}/`);
          
          if (isActive) {
            setClassData(response.data);
            setLoading(false);
          }
        } catch (error) {
          console.error("Fetch Details Error:", error);
        }
      };

      // 1. Fetch immediately when screen opens
      fetchData();

      // 2. Set up "Polling" (Check every 5 seconds)
      // This makes the entry time appear "magically" when CCTV detects you!
      const intervalId = setInterval(fetchData, 5000); 

      // 3. Cleanup when leaving screen
      return () => {
        isActive = false;
        clearInterval(intervalId); // Stop the timer
      };
    }, [session_id])
  );

  // --- HELPERS (Keep existing ones) ---
  const formatTimeStr = (timeString) => {
    if (!timeString) return "-";
    const date = new Date(timeString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true
      }).toLowerCase();
    }
    const [hours, minutes] = timeString.split(':');
    if (hours !== undefined && minutes !== undefined) {
        const d = new Date();
        d.setHours(parseInt(hours, 10));
        d.setMinutes(parseInt(minutes, 10));
        return d.toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', hour12: true
        }).toLowerCase();
    }
    return "-";
  };

  const formatDateStr = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  // --- RENDER ---
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3A7AFE" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F0F2FA" />

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Class Details</Text>
          <View style={{ width: 20 }} />
        </View>

        <View style={styles.content}>
          {classData && (
            <>
              <View style={styles.blueCard}>
                {/* Module Code & Name */}
                <Text style={styles.moduleCode}>
                  {classData.module?.code || "CODE"}
                </Text>
                <Text style={styles.moduleName}>
                  {classData.module?.name || "Module Name"}
                </Text>

                {/* Date, Time, Venue */}
                <View style={styles.infoBlock}>
                  <Text style={styles.dateText}>
                    {formatDateStr(classData.date)}
                  </Text>
                  <Text style={styles.timeText}>
                    {formatTimeStr(classData.start_time)} - {formatTimeStr(classData.end_time)}
                  </Text>
                  <Text style={styles.venueText}>{classData.venue}</Text>
                </View>

                {/* Entry / Exit Split */}
                <View style={styles.attendanceRow}>
                  <View style={styles.attendanceCol}>
                    <Text style={styles.attendanceLabel}>Entry</Text>
                    {/* 👇 THIS WILL UPDATE AUTOMATICALLY NOW */}
                    <Text style={styles.attendanceValue}>
                      {formatTimeStr(classData.entry_time)}
                    </Text>
                  </View>

                  <View style={styles.verticalDivider} />

                  <View style={styles.attendanceCol}>
                    <Text style={styles.attendanceLabel}>Exit</Text>
                    <Text style={styles.attendanceValue}>
                      {formatTimeStr(classData.exit_time)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* APPEAL BUTTON */}
              {classData.attendance_status === 'absent' && classData.status === 'completed' && (
                <TouchableOpacity
                  style={styles.appealButton}
                  onPress={() => {
                    navigation.navigate('ApplyAppeal', {
                      classSession: classData
                    });
                  }}
                >
                  <Text style={styles.appealButtonText}>Appeal</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

      </SafeAreaView>
    </View>
  );
};

// ... Styles (Keep exactly the same)
const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F5F7FB' },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#F0F2FA',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backArrow: { fontSize: 24, color: '#4B5563', fontWeight: '300' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  content: { padding: 20, alignItems: 'center', paddingTop: 40 },
  blueCard: {
    backgroundColor: '#B3E5FC',
    width: '100%',
    borderRadius: 16,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 20,
  },
  moduleCode: { fontSize: 18, fontWeight: '800', color: '#000', marginBottom: 5 },
  moduleName: { fontSize: 16, fontWeight: '600', color: '#000', textAlign: 'center', marginBottom: 20 },
  infoBlock: { alignItems: 'center', marginBottom: 25 },
  dateText: { fontSize: 14, color: '#333', marginBottom: 2 },
  timeText: { fontSize: 14, color: '#333', marginBottom: 2 },
  venueText: { fontSize: 14, color: '#333', fontWeight: '500' },
  attendanceRow: { flexDirection: 'row', width: '80%', justifyContent: 'space-around', alignItems: 'center' },
  attendanceCol: { alignItems: 'center' },
  attendanceLabel: { fontSize: 14, fontWeight: '700', color: '#000', marginBottom: 5 },
  attendanceValue: { fontSize: 14, color: '#333' },
  verticalDivider: { width: 1, height: 30, backgroundColor: '#666' },
  appealButton: {
    width: '100%',
    backgroundColor: '#8E8E93',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  appealButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ClassDetailScreen;