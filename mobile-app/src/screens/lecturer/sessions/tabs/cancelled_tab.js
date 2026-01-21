// screen/lecturer/sessions/tabs/cancelled_tab.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const CancelledTab = ({ COLORS, navigation, list = [] }) => {
  const toText = (v, fallback = "-") => {
    if (v == null) return fallback;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
    if (Array.isArray(v)) return v.map((x) => toText(x, "")).filter(Boolean).join(", ") || fallback;
    if (typeof v === "object") return String(v.name ?? v.code ?? v.title ?? v.id ?? v._id ?? fallback);
    return fallback;
  };

  const SafeText = ({ value, style, numberOfLines }) => (
    <Text style={style} numberOfLines={numberOfLines}>
      {toText(value, "")}
    </Text>
  );

  const safeKey = (s, idx) => String(s?.id ?? s?._id ?? `${idx}`);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {list.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="close-circle-outline" size={28} color={COLORS.primary} />
          <Text style={styles.emptyTitle}>No cancelled sessions</Text>
          <Text style={styles.emptySub}>Cancelled sessions will appear here.</Text>
        </View>
      ) : (
        list.map((s, idx) => (
          <TouchableOpacity
            key={safeKey(s, idx)}
            activeOpacity={0.9}
            onPress={() => navigation.navigate("LecturerClassDetail", { cls: s })}
            style={styles.sessionCard}
          >
            <SafeText style={[styles.module, { color: COLORS.primary }]} value={s?.module} />
            <SafeText style={styles.sessionTitle} value={s?.title} numberOfLines={1} />

            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} />
              <SafeText style={styles.metaText} value={s?.date} />
            </View>

            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={16} color={COLORS.textMuted} />
              <SafeText style={styles.metaText} value={s?.time} />
            </View>

            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.textMuted} />
              <SafeText style={styles.metaText} value={s?.venue} />
            </View>

            <View style={styles.tapHintRow}>
              <Ionicons name="hand-left-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.tapHintText}>Tap card for details</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
        ))
      )}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 6 },
  sessionCard: { borderRadius: 18, padding: 16, borderWidth: 1, marginBottom: 12, backgroundColor: "#fff", borderColor: "#E5E7EB" },
  module: { fontWeight: "900" },
  sessionTitle: { marginTop: 2, fontSize: 16, fontWeight: "900", color: "#111827" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  metaText: { color: "#6B7280", fontWeight: "600" },
  emptyBox: { marginTop: 30, backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: "#E5E7EB", padding: 18, alignItems: "center", gap: 6 },
  emptyTitle: { fontWeight: "900", color: "#111827", marginTop: 4 },
  emptySub: { color: "#6B7280", fontWeight: "700", textAlign: "center" },
  tapHintRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E5E7EB", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tapHintText: { flex: 1, marginLeft: 8, color: "#6B7280", fontWeight: "700" },
});

export default CancelledTab;
