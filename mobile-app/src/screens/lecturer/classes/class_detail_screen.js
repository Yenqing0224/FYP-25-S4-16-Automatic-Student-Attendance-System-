import React, { useMemo, useState } from "react";
import { 
  View, Text, StyleSheet, TouchableOpacity, StatusBar, 
  ScrollView, Alert, ActivityIndicator 
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
  danger: "#DC2626",
};

const MODULE_COLORS = [
  "#6D5EF5", "#10B981", "#F59E0B", "#EF4444", 
  "#3B82F6", "#EC4899", "#14B8A6", "#8B5CF6",
];

const getModuleColor = (moduleName = "") => {
  const str = String(moduleName || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MODULE_COLORS[Math.abs(hash) % MODULE_COLORS.length];
};

const toText = (v, fallback = "-") => {
  if (v == null) return fallback;
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (Array.isArray(v)) return v.map((x) => toText(x, "")).filter(Boolean).join(", ") || fallback;
  if (typeof v === "object") return String(v.name ?? v.code ?? v.title ?? v.id ?? v._id ?? fallback);
  return fallback;
};

export default function LecturerClassDetailScreen({ route, navigation }) {
  const cls = route?.params?.cls;
  const [busy, setBusy] = useState(false);

  const moduleText = toText(cls?.module, "MOD");
  const titleText = toText(cls?.moduleName ?? cls?.title, "Class"); 
  const sessionName = toText(cls?.name, ""); 

  const venueText = toText(cls?.venue, "TBA");
  const timeText = toText(cls?.time, "-");
  const dateText = toText(cls?.date, "-");

  const moduleColor = getModuleColor(moduleText);

  const status = String(toText(cls?.status, "active")).toLowerCase();
  const statusLabelLower = String(toText(cls?.statusLabel, "")).toLowerCase();

  const isCancelled = status === "cancelled" || statusLabelLower === "cancelled";
  
  const isOriginalMoved = status === "rescheduled" || statusLabelLower === "rescheduled";
  const isReplacement = String(sessionName).includes("(Rescheduled)") || String(titleText).includes("(Rescheduled)");
  const isLocked = isOriginalMoved || isReplacement;

  const isUpcoming = useMemo(() => {
    const t = new Date(toText(cls?.startISO, "")).getTime();
    return !isNaN(t) && t > Date.now();
  }, [cls?.startISO]);

  const goReschedule = async () => {
    const sessionId = cls?.id ?? cls?._id ?? cls?.session_id;
    if (!sessionId) return Alert.alert("Missing", "No session id found.");
    setBusy(true); 
    try {
      await api.post('/get-reschedule-options/', { session_id: sessionId });
      navigation.navigate("LecturerReschedule", { cls: { ...cls, id: String(sessionId) } });
    } catch (err) {
      Alert.alert("Not Allowed", "This class cannot be rescheduled.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F5FF" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#6D5EF5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Class Details</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {isOriginalMoved && !isCancelled && (
          <View style={[styles.statusPill, { backgroundColor: moduleColor + "22", borderColor: moduleColor + "55" }]}>
            <Ionicons name="swap-horizontal-outline" size={16} color={moduleColor} />
            <Text style={[styles.statusPillText, { color: moduleColor }]}>RESCHEDULED</Text>
          </View>
        )}

        {isCancelled && (
          <View style={styles.cancelPill}>
            <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
            <Text style={styles.cancelPillText}>CANCELLED</Text>
          </View>
        )}

        <View style={[styles.card, { borderColor: moduleColor + "55" }]}>
          <View style={{ flexDirection: "row" }}>
            <View style={[styles.moduleBar, { backgroundColor: moduleColor }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.module, { color: moduleColor }]}>{moduleText}</Text>
              <Text style={styles.title}>{titleText}</Text>
              
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.value}>{dateText}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Time</Text>
                <Text style={styles.value}>{timeText}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Venue</Text>
                <Text style={styles.value}>{venueText}</Text>
              </View>
            </View>
          </View>
        </View>

        {!isCancelled && (
          <>
            {isOriginalMoved && (
              <Text style={styles.rescheduledHint}>
                This class has been rescheduled once. Rescheduling again is disabled.
              </Text>
            )}
            
            {isReplacement && (
              <Text style={styles.rescheduledHint}>
                This is a replacement class. Rescheduling again is disabled.
              </Text>
            )}
          </>
        )}

        {isUpcoming && !isCancelled && !isLocked && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Actions</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: moduleColor }, busy && { opacity: 0.65 }]}
                onPress={goReschedule}
                disabled={busy} 
              >
                {busy ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="calendar-outline" size={16} color="#fff" />
                    <Text style={styles.primaryBtnText}>Reschedule</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F5FF" },
  header: { paddingVertical: 14, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  backBtn: { width: 30 },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#111827" },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, alignSelf: "flex-start", marginBottom: 12, borderWidth: 1 },
  statusPillText: { fontWeight: "900", fontSize: 12 },
  cancelPill: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEE2E2", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, alignSelf: "flex-start", marginBottom: 12, borderWidth: 1, borderColor: "#FCA5A5" },
  cancelPillText: { color: "#DC2626", fontWeight: "900", fontSize: 12 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 12 },
  moduleBar: { width: 6, borderRadius: 6, marginRight: 12 },
  module: { fontWeight: "900" },
  title: { marginTop: 4, fontSize: 18, fontWeight: "900", color: "#111827" },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 14 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  label: { color: "#6B7280", fontWeight: "800" },
  value: { color: "#111827", fontWeight: "900", maxWidth: "55%", textAlign: "right" },
  cardTitle: { fontSize: 16, fontWeight: "900", color: "#111827" },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  primaryBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  primaryBtnText: { color: "#fff", fontWeight: "900" },
  rescheduledHint: { marginTop: 4, marginLeft: 6, color: "#6B7280", fontSize: 12, fontWeight: "600" },
});