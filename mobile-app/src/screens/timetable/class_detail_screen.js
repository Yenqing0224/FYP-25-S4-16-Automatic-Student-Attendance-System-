import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api_client'; // 👈 1. Use Helper Client

const ClassDetailScreen = ({ route, navigation }) => {
  const { session_id } = route.params;
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 👈 2. Clean API Call (Token handles auth)
        // Note: We use the relative path since api_client knows the Base URL
        const response = await api.get(`/class-details/${session_id}/`);
        setClassData(response.data);
      } catch (error) {
        console.error("Fetch Details Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session_id]);

  const formatTime = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true
    }).toLowerCase();
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

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
                    {formatDate(classData.date_time)}
                  </Text>

                  <Text style={styles.timeText}>
                    {formatTime(classData.date_time)} - {formatTime(new Date(new Date(classData.date_time).getTime() + 3 * 60 * 60 * 1000))}
                  </Text>

                  <Text style={styles.venueText}>{classData.venue}</Text>
                </View>

                {/* Entry / Exit Split */}
                <View style={styles.attendanceRow}>
                  <View style={styles.attendanceCol}>
                    <Text style={styles.attendanceLabel}>Entry</Text>
                    <Text style={styles.attendanceValue}>
                      {formatTime(classData.entry_time)}
                    </Text>
                  </View>

                  <View style={styles.verticalDivider} />

                  <View style={styles.attendanceCol}>
                    <Text style={styles.attendanceLabel}>Exit</Text>
                    <Text style={styles.attendanceValue}>
                      {formatTime(classData.exit_time)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* APPEAL BUTTON Logic */}
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