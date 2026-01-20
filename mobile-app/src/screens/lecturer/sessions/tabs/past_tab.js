// src/screens/lecturer/sessions/tabs/upcoming_tab.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

const PastTab = ({
  COLORS,
  navigation,
  list,
  isAdded,
  removeReminderTracking,
}) => {
  const renderRightActions = (cls) => (
    <TouchableOpacity style={styles.swipeDelete} onPress={() => removeReminderTracking(cls)}>
      <Ionicons name="trash-outline" size={18} color="#fff" />
      <Text style={styles.swipeDeleteText}>Remove</Text>
    </TouchableOpacity>
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {list.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="time-outline" size={28} color={COLORS.primary} />
          <Text style={styles.emptyTitle}>No past sessions</Text>
          <Text style={styles.emptySub}>Your completed sessions will appear here.</Text>
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
                  <Text style={[styles.statusText, { color: COLORS.primary }]}>Completed</Text>
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

              <View style={styles.actionsRow}>
                <View style={[styles.primaryBtnCompact, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="information-circle-outline" size={16} color="#fff" />
                  <Text style={styles.primaryBtnText}>Details</Text>
                </View>
                <View style={styles.secondaryBtn}>
                  <Ionicons name="checkmark-done-outline" size={16} color={COLORS.primary} />
                  <Text style={[styles.secondaryBtnText, { color: COLORS.primary }]}>Completed</Text>
                </View>
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
  sessionCard: { borderRadius: 18, padding: 16, borderWidth: 1, marginBottom: 12, backgroundColor: "#fff", borderColor: "#E5E7EB" },
  sessionTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  module: { fontWeight: "900" },
  sessionTitle: { marginTop: 2, fontSize: 16, fontWeight: "900", color: "#111827" },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: "#ECE9FF" },
  statusText: { fontWeight: "900", fontSize: 12 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  metaText: { color: "#6B7280", fontWeight: "600" },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  primaryBtnCompact: { flex: 1, paddingVertical: 12, borderRadius: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  primaryBtnText: { color: "#fff", fontWeight: "900" },
  secondaryBtn: { flex: 1, backgroundColor: "#ECE9FF", paddingVertical: 12, borderRadius: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  secondaryBtnText: { fontWeight: "900" },
  swipeDelete: { width: 110, marginBottom: 12, borderRadius: 18, backgroundColor: "#DC2626", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  swipeDeleteText: { color: "#fff", fontWeight: "900" },
  emptyBox: { marginTop: 30, backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: "#E5E7EB", padding: 18, alignItems: "center", gap: 6 },
  emptyTitle: { fontWeight: "900", color: "#111827", marginTop: 4 },
  emptySub: { color: "#6B7280", fontWeight: "700", textAlign: "center" },
  tapHintRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E5E7EB", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tapHintText: { flex: 1, marginLeft: 8, color: "#6B7280", fontWeight: "700" },
  swipeHintRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  swipeHintText: { color: "#6B7280", fontWeight: "700", fontSize: 12 },
});

export default PastTab;