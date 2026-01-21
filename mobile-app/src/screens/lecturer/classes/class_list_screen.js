import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "../../../api/api_client";

const COLORS = {
  primary: "#6D5EF5",
  background: "#F6F5FF",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  soft: "#ECE9FF",
};

const LecturerClassListScreen = ({ route, navigation }) => {
  const mode = route.params?.mode || "today";
  const passedClasses = route.params?.classes;

  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    // ✅ show passed data instantly (optional)
    if (passedClasses && Array.isArray(passedClasses)) {
      processData(passedClasses);
      return;
    }

    // ✅ always fetch latest to avoid stale data
    setLoading(true);
    fetchClasses();
  }, []);

  const processData = (rawData) => {
    const formatted = rawData.map((c) => ({
      id: String(c.id),
      module: c.module?.code || "MOD",
      title: c.module?.name || "Class",
      venue: c.venue?.name || "TBA",
      date: c.date,
      status: c.status || "active", // ✅ include status
      isToday: isDateToday(c.date),
      fullDate: formatDate(c.date),
      time: `${formatTime(c.start_time)} – ${formatTime(c.end_time)}`,
      startISO: `${c.date}T${c.start_time}`,
      endISO: `${c.date}T${c.end_time}`,
    }));

    // ✅ filter if mode is today/week if you want:
    // (keep your current behavior; leaving it as-is)

    formatted.sort((a, b) => new Date(a.startISO) - new Date(b.startISO));
    setClasses(formatted);
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get("/timetable/");
      processData(res.data);
    } catch (err) {
      console.error("List Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (t) => (t ? String(t).slice(0, 5) : "");

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    return dt.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isDateToday = (dateStr) => {
    if (!dateStr) return false;
    const [y, m, d] = dateStr.split("-");
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    const today = new Date();
    return dt.toDateString() === today.toDateString();
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === "today" ? "Classes Today" : "Classes This Week"}
        </Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {classes.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 50 }}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.soft} />
            <Text style={styles.empty}>No classes found.</Text>
          </View>
        ) : (
          classes.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.card}
              onPress={() => navigation.navigate("LecturerClassDetail", { cls: c })}
            >
              <View style={styles.topRow}>
                <Text style={styles.module}>{c.module}</Text>

                {c.isToday && (
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>Today</Text>
                  </View>
                )}
              </View>

              <Text style={styles.title}>{c.title}</Text>

              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{c.fullDate}</Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{c.time}</Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{c.venue}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { width: 30 },
  headerTitle: { fontSize: 18, fontWeight: "900", color: COLORS.textDark },
  content: { padding: 20 },
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pill: { backgroundColor: COLORS.soft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { color: COLORS.primary, fontWeight: "900", fontSize: 12 },
  module: { fontWeight: "900", color: COLORS.primary, fontSize: 14 },
  title: { marginTop: 4, marginBottom: 8, fontSize: 16, fontWeight: "900", color: COLORS.textDark },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  metaText: { color: COLORS.textMuted, fontWeight: "600", fontSize: 14 },
  empty: { color: COLORS.textMuted, fontWeight: "800", textAlign: "center", marginTop: 10 },
});

export default LecturerClassListScreen;
