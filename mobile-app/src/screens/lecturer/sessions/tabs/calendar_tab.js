// src/screens/lecturer/sessions/tabs/calendar_tab.js
import React, { useMemo, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CalendarList } from "react-native-calendars";

/* ✅ NEW: module color palette + mapper */
const MODULE_COLORS = [
  "#6D5EF5",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#3B82F6",
  "#EC4899",
  "#14B8A6",
  "#8B5CF6",
];

const getModuleColor = (moduleName = "") => {
  const str = String(moduleName || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MODULE_COLORS[Math.abs(hash) % MODULE_COLORS.length];
};

const CalendarTab = ({
  COLORS,
  navigation,
  sessions = [],
  selectedDate,
  setSelectedDate,
  isAdded,
  isSavingThis,
  addReminderToCalendar,
}) => {
  const dayListRef = useRef(null);

  const toText = (v, fallback = "-") => {
    if (v == null) return fallback;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
    if (Array.isArray(v)) return v.map((x) => toText(x, "")).filter(Boolean).join(", ") || fallback;
    if (typeof v === "object") {
      if (v.name != null) return String(v.name);
      if (v.code != null) return String(v.code);
      if (v.title != null) return String(v.title);
      if (v.label != null) return String(v.label);
      if (v.id != null) return String(v.id);
      if (v._id != null) return String(v._id);
      try {
        return JSON.stringify(v);
      } catch {
        return fallback;
      }
    }
    return fallback;
  };

  const SafeText = ({ value, style, numberOfLines }) => (
    <Text style={style} numberOfLines={numberOfLines}>
      {toText(value, "")}
    </Text>
  );

  const safeKey = (s, idx) => {
    const raw = s?.id ?? s?._id;
    if (typeof raw === "string" || typeof raw === "number") return String(raw);
    if (raw && typeof raw === "object") return String(raw.id ?? raw._id ?? raw.name ?? idx);
    return `cal-${toText(s?.module, "m")}-${toText(s?.startISO, idx)}-${idx}`;
  };

  const getISODate = (isoVal) => {
    const isoStr = toText(isoVal, "");
    return isoStr ? isoStr.slice(0, 10) : "";
  };

  const formatDate = (dateVal) => {
    const dateStr = toText(dateVal, "");
    if (!dateStr) return "-";
    if (dateStr.includes("-") && dateStr.length >= 10) {
      const [y, m, d] = dateStr.slice(0, 10).split("-");
      const dt = new Date(Number(y), Number(m) - 1, Number(d));
      if (!isNaN(dt.getTime())) {
        return dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
      }
    }
    const dt = new Date(dateStr);
    if (!isNaN(dt.getTime())) {
      return dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    }
    return "-";
  };

  const selectedDateText = typeof selectedDate === "string" ? selectedDate : toText(selectedDate, "");

  const markedDates = useMemo(() => {
    const marks = {};
    (sessions || []).forEach((c) => {
      const d = getISODate(c?.startISO);
      if (!d) return;
      marks[d] = { ...(marks[d] || {}), marked: true };
    });
    if (selectedDateText) marks[selectedDateText] = { ...(marks[selectedDateText] || {}), selected: true };
    return marks;
  }, [sessions, selectedDateText]);

  const daySessions = useMemo(() => {
    if (!selectedDateText) return [];
    return (sessions || []).filter((c) => getISODate(c?.startISO) === selectedDateText);
  }, [sessions, selectedDateText]);

  const scrollToDetails = () => dayListRef.current?.scrollTo({ y: 260, animated: true });

  return (
    <ScrollView ref={dayListRef} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
      <CalendarList
        horizontal
        pagingEnabled
        pastScrollRange={2}
        futureScrollRange={6}
        markedDates={markedDates}
        onDayPress={(day) => {
          const ds = day?.dateString;
          if (!ds || ds === selectedDateText) return;
          setSelectedDate(ds);
          setTimeout(scrollToDetails, 80);
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

      <View style={styles.content}>
        <View style={styles.detailsHeader}>
          <SafeText style={styles.detailsTitle} value={selectedDateText ? `Classes on ${selectedDateText}` : "Pick a date"} />
        </View>

        {selectedDateText && daySessions.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-clear-outline" size={28} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>No classes</Text>
            <Text style={styles.emptySub}>No scheduled classes on this date.</Text>
          </View>
        )}

        {daySessions.map((s, idx) => {
          const moduleText = toText(s?.module, "-");
          const titleText = toText(s?.title, "Session");
          const timeText = toText(s?.time, "-");
          const venueText = toText(s?.venue, "-");
          const dateText = formatDate(s?.date);

          const moduleColor = getModuleColor(moduleText);
          const status = String(toText(s?.status, "active")).toLowerCase();
          const isRescheduled = status === "rescheduled";


          return (
            <TouchableOpacity
              key={safeKey(s, idx)}
              activeOpacity={0.9}
              style={[styles.sessionCard, { borderColor: moduleColor + "55", backgroundColor: moduleColor + "10" }]}
              onPress={() => navigation.navigate("LecturerClassDetail", { cls: s })}
            >
              <View style={{ flexDirection: "row" }}>
                <View style={[styles.moduleBar, { backgroundColor: moduleColor }]} />

                <View style={{ flex: 1 }}>
                  <SafeText style={[styles.module, { color: moduleColor }]} value={moduleText} />

                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <SafeText style={styles.sessionTitle} value={titleText} numberOfLines={1} />
                    </View>

                    {isRescheduled && (
                      <View style={[styles.statusPill, { backgroundColor: moduleColor + "22", borderColor: moduleColor + "55" }]}>
                        <Ionicons name="swap-horizontal-outline" size={14} color={moduleColor} />
                        <Text style={[styles.statusText, { color: moduleColor }]}>Rescheduled</Text>
                      </View>
                    )}
                  </View>


                  <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} />
                    <SafeText style={styles.metaText} value={dateText} />
                  </View>

                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={16} color={COLORS.textMuted} />
                    <SafeText style={styles.metaText} value={timeText} />
                  </View>

                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={16} color={COLORS.textMuted} />
                    <SafeText style={styles.metaText} value={venueText} />
                  </View>

                  <View style={styles.actionsRow}>
                    <View style={[styles.primaryBtn, { backgroundColor:  COLORS.primary}]}>
                      <Ionicons name="information-circle-outline" size={16} color="#fff" />
                      <Text style={styles.primaryBtnText}>Details</Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.secondaryBtn, isAdded?.(s) && styles.secondaryBtnDisabled, { backgroundColor: COLORS.soft }]}

                      disabled={!!isAdded?.(s) || !!isSavingThis?.(s)}
                      onPress={() => addReminderToCalendar?.(s)}
                    >
                      <Ionicons
                        name={isAdded?.(s) ? "checkmark-circle-outline" : "bookmark-outline"}
                        size={16}
                        color={COLORS.primary}
                      />
                      <Text style={[styles.secondaryBtnText, { color: COLORS.primary }]}>
                        {isSavingThis?.(s) ? "Adding..." : isAdded?.(s) ? "Added" : "Add reminder"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.tapHintRow}>
                    <Ionicons name="hand-left-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.tapHintText}>Tap card for details</Text>
                    <Ionicons name="chevron-forward" size={16} color={moduleColor} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 6 },
  detailsHeader: { marginTop: 14, marginBottom: 6 },
  detailsTitle: { fontSize: 16, fontWeight: "900", color: "#111827" },

  sessionCard: { backgroundColor: "#fff", borderRadius: 18, padding: 16, borderWidth: 1, marginTop: 12 },
  moduleBar: { width: 6, borderRadius: 6, marginRight: 12 },

  module: { fontWeight: "900" },
  sessionTitle: { marginTop: 2, fontSize: 16, fontWeight: "900", color: "#111827" },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  metaText: { color: "#6B7280", fontWeight: "600" },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  primaryBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  secondaryBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  secondaryBtnDisabled: { opacity: 0.65 },
  secondaryBtnText: { fontWeight: "900" },

  emptyBox: { marginTop: 12, backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: "#E5E7EB", padding: 18, alignItems: "center", gap: 6 },
  emptyTitle: { fontWeight: "900", color: "#111827", marginTop: 4 },
  emptySub: { color: "#6B7280", fontWeight: "700", textAlign: "center" },

  tapHintRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E5E7EB", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tapHintText: { flex: 1, marginLeft: 8, color: "#6B7280", fontWeight: "700" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: {
    fontWeight: "900",
    fontSize: 12,
  },

});

export default CalendarTab;
