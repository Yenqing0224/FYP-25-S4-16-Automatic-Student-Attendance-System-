// src/screens/lecturer/sessions/tabs/rescheduled_tab.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const RescheduledTab = ({ COLORS, navigation, list = [] }) => {
  const toText = (v, fallback = "-") => {
    if (v == null) return fallback;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
    if (Array.isArray(v)) return v.map((x) => toText(x, "")).filter(Boolean).join(", ") || fallback;
    if (typeof v === "object") return String(v.name ?? v.code ?? v.title ?? v.id ?? v._id ?? fallback);
    return fallback;
  };

  const formatNice = (iso) => {
    const s = toText(iso, "");
    if (!s) return "-";
    const dt = new Date(s);
    if (isNaN(dt.getTime())) return s;
    return dt.toLocaleString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const safeKey = (r, idx) => String(r?.key ?? r?.session_id ?? `${idx}`);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {list.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="swap-horizontal-outline" size={28} color={COLORS.primary} />
          <Text style={styles.emptyTitle}>No rescheduled history</Text>
          <Text style={styles.emptySub}>Only classes you rescheduled will appear here.</Text>
        </View>
      ) : (
        list.map((r, idx) => {
          const statusLabel = toText(r?.statusLabel, "Rescheduled");

          return (
            <TouchableOpacity
              key={safeKey(r, idx)}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate("LecturerClassDetail", {
                  // pass the updated class
                  cls: r?.afterSnapshot ?? null,
                })
              }
              style={styles.sessionCard}
            >
              <View style={styles.topRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.module, { color: COLORS.primary }]}>{toText(r?.module, "MOD")}</Text>
                  <Text style={styles.sessionTitle}>{toText(r?.title, "Class")}</Text>
                </View>

                {/* ✅ STATUS PILL */}
                <View style={[styles.statusPill, { backgroundColor: COLORS.soft }]}>
                  <Text style={[styles.statusText, { color: COLORS.primary }]}>{statusLabel}</Text>
                </View>
              </View>

              <View style={styles.block}>
                <View style={styles.row}>
                  <Ionicons name="arrow-back-outline" size={16} color={COLORS.textMuted} />
                  <Text style={styles.blockTitle}>Before</Text>
                </View>
                <Text style={styles.blockText}>
                  {formatNice(r?.beforeStartISO)} → {formatNice(r?.beforeEndISO)}
                </Text>
                <Text style={styles.blockSub}>Venue: {toText(r?.beforeVenue, "-")}</Text>
              </View>

              <View style={styles.block}>
                <View style={styles.row}>
                  <Ionicons name="arrow-forward-outline" size={16} color={COLORS.textMuted} />
                  <Text style={styles.blockTitle}>After</Text>
                </View>
                <Text style={styles.blockText}>
                  {formatNice(r?.afterStartISO)} → {formatNice(r?.afterEndISO)}
                </Text>
                <Text style={styles.blockSub}>Venue: {toText(r?.afterVenue, "-")}</Text>
              </View>

              <View style={styles.tapHintRow}>
                <Ionicons name="hand-left-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.tapHintText}>Tap to open updated class</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
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

  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  module: { fontWeight: "900" },
  sessionTitle: { marginTop: 2, fontSize: 16, fontWeight: "900", color: "#111827" },

  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusText: { fontWeight: "900", fontSize: 12 },

  block: { marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E5E7EB" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  blockTitle: { fontWeight: "900", color: "#111827" },
  blockText: { marginTop: 6, fontWeight: "800", color: "#111827" },
  blockSub: { marginTop: 4, fontWeight: "700", color: "#6B7280" },

  emptyBox: { marginTop: 30, backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: "#E5E7EB", padding: 18, alignItems: "center", gap: 6 },
  emptyTitle: { fontWeight: "900", color: "#111827", marginTop: 4 },
  emptySub: { color: "#6B7280", fontWeight: "700", textAlign: "center" },

  tapHintRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E5E7EB", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tapHintText: { flex: 1, marginLeft: 8, color: "#6B7280", fontWeight: "700" },
});

export default RescheduledTab;
