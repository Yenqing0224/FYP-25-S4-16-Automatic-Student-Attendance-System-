// src/screens/lecturer/sessions/tabs/upcoming_tab.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

const UpcomingTab = ({
  COLORS,
  navigation,
  list = [],
  isAdded,
  isSavingThis,
  addReminderToCalendar,
  removeReminderTracking,
}) => {
  const toText = (v, fallback = "-") => {
    if (v == null) return fallback;
    if (typeof v === "string" || typeof v === "number") return String(v);
    if (typeof v === "object") {
      if (v.name != null) return String(v.name);
      if (v.title != null) return String(v.title);
      if (v.label != null) return String(v.label);
      if (v.code !=null) return String(v.code);
      if (v.id != null) return String(v.id);
      if (v._id != null) return String(v._id);
      return fallback;
    }
    return fallback;
  };

  const safeKey = (s, idx) => {
    const raw = s?.id ?? s?._id;
    if (typeof raw === "string" || typeof raw === "number") return String(raw);
    if (raw && typeof raw === "object") {
      if (raw.id != null) return String(raw.id);
      if (raw._id != null) return String(raw._id);
      if (raw.name != null) return String(raw.name);
    }
    return `up-${toText(s?.module, "m")}-${toText(s?.startISO, idx)}-${idx}`;
  };

  const renderRightActions = (cls) => (
    <TouchableOpacity style={styles.swipeDelete} onPress={() => removeReminderTracking?.(cls)}>
      <Ionicons name="trash-outline" size={18} color="#fff" />
      <Text style={styles.swipeDeleteText}>Remove</Text>
    </TouchableOpacity>
  );

  const formatDate = (dateVal) => {
    const dateStr = toText(dateVal, "");
    if (!dateStr) return "-";
    if (dateStr.includes("-") && dateStr.length >= 10) {
      const [y, m, d] = dateStr.slice(0, 10).split("-");
      const dt = new Date(Number(y), Number(m) - 1, Number(d));
      if (!isNaN(dt.getTime())) {
        return dt.toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
    }
    const dt = new Date(dateStr);
    if (!isNaN(dt.getTime())) {
      return dt.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    return "-";
  };

  const goReschedule = (cls) => {
    const startISO = toText(cls?.startISO, "");
    if (startISO) {
      const startMs = new Date(startISO).getTime();
      if (!isNaN(startMs) && startMs <= Date.now()) {
        Alert.alert("Not allowed", "You can only reschedule upcoming classes.");
        return;
      }
    }
    navigation.navigate("LecturerReschedule", { cls });
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {list.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No upcoming sessions</Text>
        </View>
      ) : (
        list.map((s, idx) => {
          const moduleText = toText(s?.module, "-");
          const titleText = toText(s?.title, "Session");
          const timeText = toText(s?.time, "-");
          const venueText = toText(s?.venue, "-");
          const dateText = formatDate(s?.date);

          const status = String(toText(s?.status, "active")).toLowerCase();
          const statusLabel = status === "rescheduled" ? "Rescheduled" : "Upcoming";

          const card = (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate("LecturerClassDetail", { cls: s })}
              style={styles.sessionCard}
            >
              <View style={styles.sessionTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.module, { color: COLORS.primary }]}>{moduleText}</Text>
                  <Text style={styles.sessionTitle}>{titleText}</Text>
                </View>

                <View style={styles.statusPill}>
                  <Text style={[styles.statusText, { color: COLORS.primary }]}>{statusLabel}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{dateText}</Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{timeText}</Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{venueText}</Text>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.primaryBtnCompact, { backgroundColor: COLORS.primary }]}
                  onPress={() => navigation.navigate("LecturerClassDetail", { cls: s })}
                >
                  <Ionicons name="information-circle-outline" size={16} color="#fff" />
                  <Text style={styles.primaryBtnText}>Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryBtnSmall, isAdded?.(s) && styles.secondaryBtnDisabled]}
                  disabled={!!isAdded?.(s) || !!isSavingThis?.(s)}
                  onPress={() => addReminderToCalendar?.(s)}
                >
                  <Ionicons
                    name={isAdded?.(s) ? "checkmark-circle-outline" : "bookmark-outline"}
                    size={16}
                    color={COLORS.primary}
                  />
                  <Text style={[styles.secondaryBtnTextSmall, { color: COLORS.primary }]}>
                    {isSavingThis?.(s) ? "..." : isAdded?.(s) ? "Added" : "Reminder"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryBtnSmall} onPress={() => goReschedule(s)}>
                  <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                  <Text style={[styles.secondaryBtnTextSmall, { color: COLORS.primary }]}>Move</Text>
                </TouchableOpacity>
              </View>

              {isAdded?.(s) && (
                <View style={styles.swipeHintRow}>
                  <Ionicons name="arrow-back-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.swipeHintText}>Swipe left to remove</Text>
                </View>
              )}

              <View style={styles.tapHintRow}>
                <Ionicons name="hand-left-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.tapHintText}>Tap card for details</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          );

          return (
            <Swipeable
              key={safeKey(s, idx)}
              enabled={!!isAdded?.(s)}
              renderRightActions={() => renderRightActions(s)}
              overshootRight={false}
            >
              {card}
            </Swipeable>
          );
        })
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 6 },
  sessionCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderColor: "#E5E7EB",
  },
  sessionTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  module: { fontWeight: "900" },
  sessionTitle: { marginTop: 2, fontSize: 16, fontWeight: "900", color: "#111827" },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: "#ECE9FF" },
  statusText: { fontWeight: "900", fontSize: 12 },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  metaText: { color: "#6B7280", fontWeight: "600" },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 14 },

  primaryBtnCompact: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  secondaryBtnDisabled: { opacity: 0.65 },

  swipeHintRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  swipeHintText: { color: "#6B7280", fontWeight: "700", fontSize: 12 },

  swipeDelete: {
    width: 110,
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  swipeDeleteText: { color: "#fff", fontWeight: "900" },

  secondaryBtnSmall: {
    flex: 1,
    backgroundColor: "#ECE9FF",
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  secondaryBtnTextSmall: { fontWeight: "900", fontSize: 12 },

  emptyBox: { marginTop: 30, alignItems: "center" },
  emptyTitle: { color: "#6B7280", fontWeight: "700" },

  tapHintRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tapHintText: { flex: 1, marginLeft: 8, color: "#6B7280", fontWeight: "700" },
});

export default UpcomingTab;
