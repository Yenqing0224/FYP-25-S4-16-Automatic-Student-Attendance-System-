import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Alert, ActivityIndicator } from "react-native";
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
  danger: "#DC2626",
};

const toText = (v, fallback = "-") => {
  if (v == null) return fallback;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map((x) => toText(x, "")).filter(Boolean).join(", ") || fallback;
  if (typeof v === "object") return String(v.name ?? v.code ?? v.title ?? v.id ?? v._id ?? fallback);
  return fallback;
};

export default function LecturerClassDetailScreen({ route, navigation }) {
  const cls = route?.params?.cls;

  const [busy, setBusy] = useState(false);

  const moduleText = toText(cls?.module, "MOD");
  const titleText = toText(cls?.title, "Class");
  const venueText = toText(cls?.venue, "TBA");
  const timeText = toText(cls?.time, "-");
  const dateText = toText(cls?.date, "-");

  const status = String(toText(cls?.status, "active")).toLowerCase();
  const isCancelled = status === "cancelled";

  const isUpcoming = useMemo(() => {
    const t = new Date(toText(cls?.startISO, "")).getTime();
    return !isNaN(t) && t > Date.now();
  }, [cls?.startISO]);

  const goToCancelledTab = () => {
    const parent = navigation.getParent?.();

    if (parent) {
      parent.navigate("LSessions", {
        screen: "LecturerSessionsMain",
        params: { tab: "Cancelled", refreshKey: Date.now() },
      });
    } else {
      navigation.navigate("LecturerSessionsMain", {
        tab: "Cancelled",
        refreshKey: Date.now(),
      });
    }
  };


  const cancelSession = () => {
    if (!cls?.id) return Alert.alert("Missing", "No session id found.");

    Alert.alert("Cancel this session?", "This will move it into Cancelled tab.", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, cancel",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          try {
            // ✅ If your backend uses a dedicated endpoint, change this:
            // await api.post("/cancel-class/", { session_id: cls.id });
            await api.post("/reschedule-class/", { session_id: String(cls.id), action: "cancel" });

            // ✅ leave detail page immediately
            goToCancelledTab();

          } catch (e) {
            console.log("cancel error:", e?.response?.status, e?.response?.data);
            Alert.alert("Error", "Could not cancel session.");
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const goReschedule = () => {
    if (!cls?.id) return Alert.alert("Missing", "No session id found.");
    navigation.navigate("LecturerReschedule", { cls });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Class Details</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isCancelled && (
          <View style={styles.cancelPill}>
            <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
            <Text style={styles.cancelPillText}>CANCELLED</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.module}>{moduleText}</Text>
          <Text style={styles.title}>{titleText}</Text>

          <View style={styles.divider} />

          <View style={styles.infoRow}><Text style={styles.label}>Date</Text><Text style={styles.value}>{dateText}</Text></View>
          <View style={styles.infoRow}><Text style={styles.label}>Time</Text><Text style={styles.value}>{timeText}</Text></View>
          <View style={styles.infoRow}><Text style={styles.label}>Venue</Text><Text style={styles.value}>{venueText}</Text></View>
        </View>

        {isUpcoming && !isCancelled && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Actions</Text>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.primaryBtn} onPress={goReschedule} disabled={busy}>
                <Ionicons name="calendar-outline" size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>Reschedule</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dangerBtn} onPress={cancelSession} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Ionicons name="close-circle-outline" size={16} color="#fff" />}
                <Text style={styles.dangerBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingVertical: 14, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 30 },
  headerTitle: { fontSize: 20, fontWeight: "900", color: COLORS.textDark },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },

  cancelPill: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEE2E2", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, alignSelf: "flex-start", marginBottom: 12, borderWidth: 1, borderColor: "#FCA5A5" },
  cancelPillText: { color: COLORS.danger, fontWeight: "900", fontSize: 12 },

  card: { backgroundColor: COLORS.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  module: { fontWeight: "900", color: COLORS.primary },
  title: { marginTop: 4, fontSize: 18, fontWeight: "900", color: COLORS.textDark },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  label: { color: COLORS.textMuted, fontWeight: "800" },
  value: { color: COLORS.textDark, fontWeight: "900", maxWidth: "55%", textAlign: "right" },

  cardTitle: { fontSize: 16, fontWeight: "900", color: COLORS.textDark },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 12 },

  primaryBtn: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  dangerBtn: { flex: 1, backgroundColor: COLORS.danger, paddingVertical: 12, borderRadius: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  dangerBtnText: { color: "#fff", fontWeight: "900" },
});
