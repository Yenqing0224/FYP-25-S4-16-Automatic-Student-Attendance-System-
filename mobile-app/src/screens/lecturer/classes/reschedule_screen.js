import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars"; 
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../../api/api_client";

const COLORS = {
  primary: "#6D5EF5",
  background: "#F6F5FF",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  soft: "#ECE9FF",
  success: "#10B981", 
  disabled: "#D1D5DB",
};

const RESCHEDULE_OVERRIDES_KEY = "lecturerRescheduleOverrides_v1";

const toText = (v, fallback = "") => {
  if (v == null) return fallback;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "object") return String(v.name ?? v.code ?? v.title ?? v.id ?? fallback);
  return fallback;
};

export default function LecturerRescheduleScreen({ route, navigation }) {
  const cls = route?.params?.cls;

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [options, setOptions] = useState([]); 
  const [markedDates, setMarkedDates] = useState({}); 
  const [selectedDate, setSelectedDate] = useState(""); 
  const [daySlots, setDaySlots] = useState([]); 

  // Form State
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState(""); 
  const [venue, setVenue] = useState(toText(cls?.venue, "TBA")); // Read-only now

  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Options
  useEffect(() => {
    const loadOptions = async () => {
      if (!cls?.id) return;

      setLoadingOptions(true);
      try {
        const res = await api.post("/get-reschedule-options/", { session_id: cls.id });
        const rawOptions = Array.isArray(res?.data?.options) ? res.data.options : [];
        setOptions(rawOptions);
        processCalendarMarkers(rawOptions);
      } catch (e) {
        console.error("Fetch options error:", e);
        Alert.alert("Error", "Could not fetch reschedule options.");
      } finally {
        setLoadingOptions(false);
      }
    };
    loadOptions();
  }, [cls?.id]);

  // 2. Process Calendar Markers (FIXED: Added disabled: false)
  const processCalendarMarkers = (list) => {
    const markers = {};
    list.forEach((opt) => {
      if (opt.date) {
        markers[opt.date] = {
          marked: true,
          dotColor: COLORS.success,
          activeOpacity: 0.8,
          status: "available",
          disabled: false, // ✅ KEY FIX: Unlocks the date so it can be pressed
        };
      }
    });
    setMarkedDates(markers);
  };

  // 3. Handle Day Press
  const onDayPress = (day) => {
    const dStr = day.dateString;
    const availableOptions = options.filter((o) => o.date === dStr);

    if (availableOptions.length === 0) {
      Alert.alert("Unavailable", "No suggested slots available for this date.");
      return;
    }

    setSelectedDate(dStr);
    setDaySlots(availableOptions);

    // Auto-select first slot
    if (availableOptions.length > 0) {
      pickSlot(availableOptions[0]);
    }
  };

  // 4. Pick Slot
  const pickSlot = (s) => {
    setDate(s.date);
    setStartTime(s.start_time ? s.start_time.slice(0, 5) : "");
    setEndTime(s.end_time ? s.end_time.slice(0, 5) : "");
    if (s.venue) setVenue(s.venue); // Auto-update venue display
  };

  // 5. Submit Payload
  const saveOverride = async (sessionId, afterSnapshot) => {
    try {
      const raw = await AsyncStorage.getItem(RESCHEDULE_OVERRIDES_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      const next = { ...obj, [String(sessionId)]: afterSnapshot };
      await AsyncStorage.setItem(RESCHEDULE_OVERRIDES_KEY, JSON.stringify(next));
    } catch (e) { console.log(e); }
  };

  const submit = async () => {
    if (!date || !startTime || !endTime) {
      return Alert.alert("Missing", "Please select a valid time slot.");
    }

    setSubmitting(true);
    try {
      // ✅ Strict Payload: session_id, date, start_time, end_time
      const payload = {
        session_id: String(cls.id),
        date: date,
        start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
        end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
      };

      await api.post("/reschedule-class/", payload);

      // Save Local Override for UI update
      const afterSnapshot = {
        ...cls,
        date: payload.date,
        startISO: `${payload.date}T${payload.start_time}`,
        endISO: `${payload.date}T${payload.end_time}`,
        time: `${startTime} – ${endTime}`,
        venue: venue,
        status: "rescheduled",
        statusLabel: "Rescheduled",
      };

      await saveOverride(cls.id, afterSnapshot);
      
      Alert.alert("Success", "Class rescheduled successfully.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);

    } catch (e) {
      Alert.alert("Error", e?.response?.data?.message || "Failed to reschedule.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reschedule</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.module}>{toText(cls?.module, "MOD")}</Text>
          <Text style={styles.title}>{toText(cls?.title, "Class")}</Text>
          <Text style={styles.sub}>
            Original: {toText(cls?.date, "-")} • {toText(cls?.time, "-")}
          </Text>
        </View>

        {/* 1. Calendar */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Select Date</Text>

          {loadingOptions ? (
            <ActivityIndicator style={{ marginTop: 20 }} color={COLORS.primary} />
          ) : (
            <Calendar
              current={new Date().toISOString().split("T")[0]}
              minDate={new Date().toISOString().split("T")[0]}
              onDayPress={onDayPress}
              markedDates={{
                ...markedDates,
                [selectedDate]: {
                  ...(markedDates[selectedDate] || {}), // Preserve disabled: false
                  selected: true,
                  selectedColor: COLORS.primary,
                },
              }}
              theme={{
                arrowColor: COLORS.primary,
                todayTextColor: COLORS.primary,
                selectedDayBackgroundColor: COLORS.primary,
                dotColor: COLORS.success,
              }}
              disabledByDefault={true} 
              disableAllTouchEventsForDisabledDays={true}
            />
          )}
          
          <View style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.legend}>Available</Text>
            <View style={[styles.dot, { backgroundColor: COLORS.primary, marginLeft: 10 }]} />
            <Text style={styles.legend}>Selected</Text>
          </View>
        </View>

        {/* 2. Slot Selection */}
        {selectedDate && daySlots.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>2. Select Time Slot</Text>
            <View style={styles.slotContainer}>
              {daySlots.map((s, idx) => {
                const isSelected = s.start_time.startsWith(startTime);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.slotChip, isSelected && styles.slotChipSelected]}
                    onPress={() => pickSlot(s)}
                  >
                    <Text style={[styles.slotChipText, isSelected && { color: '#fff' }]}>
                      {s.start_time.slice(0, 5)}
                    </Text>
                    {s.attendance_percentage > 80 && (
                      <Text style={[styles.highAttend, isSelected && { color: '#fff' }]}>High Attendance</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* 3. Confirm Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>3. Confirm Details</Text>

          {/* Date */}
          <Text style={styles.label}>Date</Text>
          <View style={styles.readOnlyInput}>
            <Text style={styles.readOnlyText}>{date || "Select date above"}</Text>
          </View>

          {/* Times */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Start Time</Text>
              <TextInput
                style={styles.input}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="00:00"
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>End Time (Auto)</Text>
              <View style={styles.readOnlyInput}>
                <Text style={{ fontWeight: '800', color: COLORS.textMuted }}>{endTime || "--:--"}</Text>
              </View>
            </View>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            style={[styles.primaryBtn, submitting && { opacity: 0.7 }]}
            onPress={submit}
            disabled={submitting || !date}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Ionicons name="checkmark-circle" size={18} color="#fff" />}
            <Text style={styles.primaryBtnText}>Confirm Reschedule</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingVertical: 14, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: '#fff' },
  backBtn: { width: 30 },
  headerTitle: { fontSize: 18, fontWeight: "900", color: COLORS.textDark },

  content: { padding: 20 },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },

  module: { fontWeight: "900", color: COLORS.primary },
  title: { marginTop: 4, fontSize: 18, fontWeight: "900", color: COLORS.textDark },
  sub: { marginTop: 4, color: COLORS.textMuted, fontWeight: "600" },

  cardTitle: { fontSize: 16, fontWeight: "900", color: COLORS.textDark },
  
  legendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legend: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginLeft: 6 },

  slotContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  slotChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: COLORS.soft, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  slotChipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  slotChipText: { fontWeight: "800", color: COLORS.primary },
  highAttend: { fontSize: 10, color: COLORS.success, fontWeight: '700' },

  label: { marginTop: 12, color: COLORS.textMuted, fontWeight: "700", fontSize: 13 },
  input: { marginTop: 6, backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontWeight: "800", color: COLORS.textDark },
  
  readOnlyInput: { marginTop: 6, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  readOnlyText: { fontWeight: '800', color: COLORS.textDark },

  primaryBtn: { marginTop: 20, backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 16, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  primaryBtnText: { color: "#fff", fontWeight: "900", fontSize: 15 },
});