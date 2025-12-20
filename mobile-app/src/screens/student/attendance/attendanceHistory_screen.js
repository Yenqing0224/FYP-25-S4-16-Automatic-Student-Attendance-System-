//src/screens/attendance/attendanceHistory_screen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../../api/api_client";

const COLORS = {
  primary: "#3A7AFE",
  background: "#F5F7FB",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
};

const AttendanceHistoryScreen = () => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/attendance-history/");
        setRecords(res.data); 
      } catch (err) {
        console.log(
          "Attendance history error:",
          err?.response?.status,
          err?.response?.data
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const renderItem = ({ item }) => {
    // 1. Get raw values from the session object
    const rawDate = item.session?.date;       // e.g. "2025-12-20"
    const rawTime = item.session?.start_time; // e.g. "14:30:00"

    // 2. Simple formatting
    // If rawDate exists, formatting it to Locale string, else "-"
    const date = rawDate ? new Date(rawDate).toLocaleDateString() : "-";
    
    // If rawTime exists, take first 5 chars (HH:MM), else "-"
    const time = rawTime ? rawTime.slice(0, 5) : "-";

    return (
      <View style={styles.recordCard}>
        <Text style={styles.moduleCode}>
          {item.session?.module?.code}
        </Text>

        <Text style={styles.moduleName}>
          {item.session?.module?.name}
        </Text>

        <Text style={styles.metaText}>Date: {date}</Text>
        <Text style={styles.metaText}>Time: {time}</Text>

        <Text style={styles.status(item.status)}>
          {item.status.toUpperCase()}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.header}>Attendance History</Text>

      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", color: COLORS.textMuted }}>
              No attendance records found
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textDark,
    padding: 16,
  },
  recordCard: {
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  moduleCode: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  moduleName: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  status: (status) => ({
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color:
      status === "present"
        ? "#16A34A"
        : status === "late"
        ? "#D97706"
        : "#DC2626",
  }),
});

export default AttendanceHistoryScreen;