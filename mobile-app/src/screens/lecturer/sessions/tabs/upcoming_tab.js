// src/screens/lecturer/sessions/tabs/upcoming_tab.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

const UpcomingTab = ({
  COLORS,
  navigation,
  list,
  isAdded,
  isSavingThis,
  addReminderToCalendar,
  removeReminderTracking,
}) => {
  const renderRightActions = (cls) => (
    <TouchableOpacity style={styles.swipeDelete} onPress={() => removeReminderTracking(cls)}>
      <Ionicons name="trash-outline" size={18} color="#fff" />
      <Text style={styles.swipeDeleteText}>Remove</Text>
    </TouchableOpacity>
  );

  // ✅ safer date formatting (handles "YYYY-MM-DD" properly)
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    // if backend sends YYYY-MM-DD
    if (dateStr.includes("-") && dateStr.length >= 10) {
      const [y, m, d] = dateStr.slice(0, 10).split("-");
      const dt = new Date(Number(y), Number(m) - 1, Number(d));
      return dt.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    const dt = new Date(dateStr);
    return dt.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const goReschedule = (cls) => {
    // extra safety: only allow if upcoming
    if (cls?.startISO) {
      const startMs = new Date(cls.startISO).getTime();
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
        list.map((s) => {
          const card = (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate("LecturerClassDetail", { cls: s })}
              style={styles.sessionCard}
            >
              <View style={styles.sessionTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.module, { color: COLORS.primary }]}>{s.module}</Text>
                  <Text style={styles.sessionTitle}>{s.title}</Text>
                </View>
                <View style={styles.statusPill}>
                  <Text style={[styles.statusText, { color: COLORS.primary }]}>Upcoming</Text>
                </View>
              </View>

              {/* Date Row */}
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{formatDate(s.date)}</Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{s.time}</Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{s.venue}</Text>
              </View>

              {/* ✅ Actions */}
              {/* ✅ Actions (same row) */}
              <View style={styles.actionsRow}>
                {/* Details */}
                <TouchableOpacity
                  style={[styles.primaryBtnCompact, { backgroundColor: COLORS.primary }]}
                  onPress={() => navigation.navigate("LecturerClassDetail", { cls: s })}
                >
                  <Ionicons name="information-circle-outline" size={16} color="#fff" />
                  <Text style={styles.primaryBtnText}>Details</Text>
                </TouchableOpacity>

                {/* Add reminder */}
                <TouchableOpacity
                  style={[styles.secondaryBtnSmall, isAdded(s) && styles.secondaryBtnDisabled]}
                  disabled={isAdded(s) || isSavingThis(s)}
                  onPress={() => addReminderToCalendar(s)}
                >
                  <Ionicons
                    name={isAdded(s) ? "checkmark-circle-outline" : "bookmark-outline"}
                    size={16}
                    color={COLORS.primary}
                  />
                  <Text style={[styles.secondaryBtnTextSmall, { color: COLORS.primary }]}>
                    {isSavingThis(s) ? "..." : isAdded(s) ? "Added" : "Reminder"}
                  </Text>
                </TouchableOpacity>

                {/* Reschedule */}
                <TouchableOpacity
                  style={styles.secondaryBtnSmall}
                  onPress={() => navigation.navigate("LecturerReschedule", { cls: s })}
                >
                  <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                  <Text style={[styles.secondaryBtnTextSmall, { color: COLORS.primary }]}>Move</Text>
                </TouchableOpacity>
              </View>


              {isAdded(s) && (
                <View style={styles.swipeHintRow}>
                  <Ionicons name="arrow-back-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.swipeHintText}>Swipe left to remove</Text>
                </View>
              )}

              {/* Tap Hint */}
              <View style={styles.tapHintRow}>
                <Ionicons name="hand-left-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.tapHintText}>Tap card for details</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          );

          return (
            <Swipeable
              key={s.id}
              enabled={isAdded(s)}
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

  secondaryBtnTextSmall: {
    fontWeight: "900",
    fontSize: 12,
  },

  swipeDeleteText: { color: "#fff", fontWeight: "900" },

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
