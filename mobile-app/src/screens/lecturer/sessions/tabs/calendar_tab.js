// src/screens/lecturer/sessions/tabs/calendar_tab.js
import React, { useMemo, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CalendarList } from "react-native-calendars";

export default function CalendarTab({
  COLORS,
  navigation,
  upcoming,
  selectedDate,
  setSelectedDate,
  isAdded,
  isSavingThis,
  addReminderToCalendar,
}) {
  const dayListRef = useRef(null);

  const getISODate = (iso) => (iso ? iso.slice(0, 10) : "");

  const markedDates = useMemo(() => {
    const marks = {};
    upcoming.forEach((c) => {
      const d = getISODate(c.startISO);
      if (!d) return;
      marks[d] = { ...(marks[d] || {}), marked: true };
    });
    if (selectedDate) {
      marks[selectedDate] = { ...(marks[selectedDate] || {}), selected: true };
    }
    return marks;
  }, [upcoming, selectedDate]);

  const dayClasses = useMemo(() => {
    if (!selectedDate) return [];
    return upcoming.filter((c) => getISODate(c.startISO) === selectedDate);
  }, [upcoming, selectedDate]);

  const scrollToDetails = () => {
    dayListRef.current?.scrollTo({ y: 260, animated: true });
  };

  return (
    <ScrollView
      ref={dayListRef}
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {/* ✅ Calendar: FULL WIDTH (no padding wrapper) */}
      <CalendarList
        horizontal
        pagingEnabled
        pastScrollRange={2}
        futureScrollRange={6}
        markedDates={markedDates}
        onDayPress={(day) => {
          if (day.dateString === selectedDate) return; // ✅ guard
          setSelectedDate(day.dateString);
          setTimeout(scrollToDetails, 80); // ✅ manual scroll to details
        }}
        theme={{
          calendarBackground: "#fff",
          textSectionTitleColor: COLORS.textMuted,
          selectedDayBackgroundColor: COLORS.primary,
          selectedDayTextColor: "#fff",
          todayTextColor: COLORS.primary,
          dayTextColor: COLORS.textDark,
          monthTextColor: COLORS.textDark,
          arrowColor: COLORS.primary,
        }}
      />

      {/* ✅ Cards: PADDED */}
      <View style={styles.content}>
        <View style={styles.detailsHeader}>
          <Text style={styles.detailsTitle}>
            {selectedDate ? `Classes on ${selectedDate}` : "Pick a date"}
          </Text>
        </View>

        {selectedDate && dayClasses.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-clear-outline" size={28} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>No classes</Text>
            <Text style={styles.emptySub}>No scheduled classes on this date.</Text>
          </View>
        )}

        {dayClasses.map((s) => (
          <View key={s.id} style={[styles.sessionCard, { borderColor: COLORS.border }]}>
            <Text style={[styles.module, { color: COLORS.primary }]}>{s.module}</Text>
            <Text style={styles.sessionTitle}>{s.title}</Text>

            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{s.time}</Text>
            </View>

            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{s.venue}</Text>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: COLORS.primary }]}
                onPress={() => navigation.navigate("LecturerClassDetail", { cls: s })}
              >
                <Ionicons name="information-circle-outline" size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>Details</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryBtn, isAdded(s) && styles.secondaryBtnDisabled]}
                disabled={isAdded(s) || isSavingThis(s)}
                onPress={() => addReminderToCalendar(s)}
              >
                <Ionicons
                  name={isAdded(s) ? "checkmark-circle-outline" : "bookmark-outline"}
                  size={16}
                  color={COLORS.primary}
                />
                <Text style={[styles.secondaryBtnText, { color: COLORS.primary }]}>
                  {isSavingThis(s) ? "Adding..." : isAdded(s) ? "Added" : "Add reminder"}
                </Text>
              </TouchableOpacity>
            </View>

            {isAdded(s) && (
              <View style={styles.swipeHintRow}>
                <Ionicons name="arrow-back-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.swipeHintText}>Swipe left to remove (Upcoming tab)</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // ✅ padding ONLY for content/cards (NOT the calendar)
  content: { paddingHorizontal: 20, paddingTop: 6 },

  detailsHeader: { marginTop: 14, marginBottom: 6 },
  detailsTitle: { fontSize: 16, fontWeight: "900", color: "#111827" },

  sessionCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginTop: 12,
  },

  module: { fontWeight: "900" },
  sessionTitle: { marginTop: 2, fontSize: 16, fontWeight: "900", color: "#111827" },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  metaText: { color: "#6B7280", fontWeight: "600" },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 14 },

  primaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  secondaryBtn: {
    flex: 1,
    backgroundColor: "#ECE9FF",
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  secondaryBtnDisabled: { opacity: 0.65 },
  secondaryBtnText: { fontWeight: "900" },

  swipeHintRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  swipeHintText: { color: "#6B7280", fontWeight: "700", fontSize: 12 },

  emptyBox: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 18,
    alignItems: "center",
    gap: 6,
  },
  emptyTitle: { fontWeight: "900", color: "#111827", marginTop: 4 },
  emptySub: { color: "#6B7280", fontWeight: "700", textAlign: "center" },
});
