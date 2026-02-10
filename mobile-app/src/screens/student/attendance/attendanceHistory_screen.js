// src/screens/attendance/attendanceHistory_screen.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  SectionList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "../../../api/api_client";

const COLORS = {
  primary: "#3A7AFE",
  background: "#F5F7FB",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  chipBg: "rgba(58,122,254,0.12)",
};

const toText = (v, fallback = "-") => {
  if (v == null) return fallback;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map((x) => toText(x, "")).filter(Boolean).join(", ") || fallback;
  if (typeof v === "object") return String(v.name ?? v.title ?? v.code ?? v.id ?? fallback);
  return fallback;
};

const parseDateOnly = (rawDate) => {
  if (!rawDate) return null;
  const d = new Date(`${rawDate}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
};

const formatMonthHeader = (rawDate) => {
  const d = parseDateOnly(rawDate);
  if (!d) return "Unknown";
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" }); // "Feb 2026"
};

const formatDate = (rawDate) => {
  const d = parseDateOnly(rawDate);
  if (!d) return "-";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatTime = (rawTime) => (rawTime ? String(rawTime).slice(0, 5) : "-");

const statusUI = (statusRaw) => {
  const s = String(statusRaw || "").toLowerCase();
  
  if (s === "present")
    return { key: "present", label: "PRESENT", icon: "checkmark-circle-outline", fg: "#16A34A", bg: "rgba(22,163,74,0.12)" };
  
  return { key: "absent", label: "ABSENT", icon: "close-circle-outline", fg: "#DC2626", bg: "rgba(220,38,38,0.12)" };
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "present", label: "Present" },
  { key: "absent", label: "Absent" },
];

const AttendanceHistoryScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [activeFilter, setActiveFilter] = useState("all");

  const fetchHistory = async () => {
    try {
      const res = await api.get("/attendance-history/");
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("Attendance history error:", err?.response?.status, err?.response?.data);
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, []);

  // filter records
  const filtered = useMemo(() => {
    if (activeFilter === "all") return records;
    return records.filter((r) => String(r?.status || "").toLowerCase() === activeFilter);
  }, [records, activeFilter]);

  // sort newest-first
  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const ad = parseDateOnly(a?.session?.date)?.getTime() ?? 0;
      const bd = parseDateOnly(b?.session?.date)?.getTime() ?? 0;

      // date desc
      if (bd !== ad) return bd - ad;

      // time desc (fallback)
      const at = String(a?.session?.start_time || "");
      const bt = String(b?.session?.start_time || "");
      return bt.localeCompare(at);
    });
    return copy;
  }, [filtered]);

  // group into month sections
  const sections = useMemo(() => {
    const map = new Map(); // monthKey -> items
    for (const item of sorted) {
      const monthKey = formatMonthHeader(item?.session?.date);
      if (!map.has(monthKey)) map.set(monthKey, []);
      map.get(monthKey).push(item);
    }

    // preserve order as they appear in sorted (newest month first)
    return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
  }, [sorted]);

  const renderFilterChip = (f) => {
    const active = activeFilter === f.key;
    return (
      <TouchableOpacity
        key={f.key}
        onPress={() => setActiveFilter(f.key)}
        activeOpacity={0.9}
        style={[styles.filterChip, active && styles.filterChipActive]}
      >
        <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : styles.filterChipTextInactive]}>
          {f.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => {
    const moduleCode = toText(item?.session?.module?.code, "MOD");
    const moduleName = toText(item?.session?.module?.name, "Module");

    const rawDate = item?.session?.date;
    const rawTime = item?.session?.start_time;

    const date = formatDate(rawDate);
    const time = formatTime(rawTime);

    const s = statusUI(item?.status);

    return (
      <View style={styles.recordCard}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.moduleCode}>{moduleCode}</Text>
            <Text style={styles.moduleName} numberOfLines={1}>
              {moduleName}
            </Text>
          </View>

          <View style={[styles.statusChip, { backgroundColor: s.bg }]}>
            <Ionicons name={s.icon} size={14} color={s.fg} />
            <Text style={[styles.statusText, { color: s.fg }]}>{s.label}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{date}</Text>
          </View>

          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{time}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView edges={["top"]} style={styles.topSafeArea} />
      <View style={styles.contentContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backBtn} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Attendance History</Text>

          <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn} activeOpacity={0.85}>
            <Ionicons name="refresh-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filterBar}>
          {FILTERS.map(renderFilterChip)}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item, idx) => String(item?.id ?? idx)}
            renderItem={renderItem}
            renderSectionHeader={({ section: { title } }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <View style={styles.sectionLine} />
              </View>
            )}
            contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
            stickySectionHeadersEnabled={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={38} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No records</Text>
                <Text style={styles.emptySub}>
                  {activeFilter === "all"
                    ? "Your attendance history will appear here."
                    : `No ${activeFilter} records found.`}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.background },
  topSafeArea: { flex: 0, backgroundColor: COLORS.background },
  contentContainer: { flex: 1, backgroundColor: COLORS.background },

  header: {
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EDEEF2",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.chipBg,
    justifyContent: "center",
    alignItems: "center",
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.chipBg,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: COLORS.textDark },

  filterBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FFFFFF",
  },
  filterChipActive: {
    borderColor: "rgba(58,122,254,0.30)",
    backgroundColor: COLORS.chipBg,
  },
  filterChipText: { fontSize: 12, fontWeight: "900" },
  filterChipTextActive: { color: COLORS.primary },
  filterChipTextInactive: { color: COLORS.textMuted },

  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: COLORS.textMuted, fontWeight: "700" },

  sectionHeader: { marginTop: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  sectionTitle: { fontSize: 13, fontWeight: "900", color: "#475569", letterSpacing: 0.3 },
  sectionLine: { flex: 1, height: 1, backgroundColor: "#E7EAF2" },

  recordCard: {
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },

  moduleCode: { fontSize: 16, fontWeight: "900", color: COLORS.textDark },
  moduleName: { marginTop: 2, fontSize: 12.5, fontWeight: "700", color: COLORS.textMuted },

  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  statusText: { fontSize: 11.5, fontWeight: "900", letterSpacing: 0.2 },

  metaRow: { flexDirection: "row", gap: 10, marginTop: 12, flexWrap: "wrap" },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#F7F8FC",
    borderWidth: 1,
    borderColor: "#EEF0F6",
  },
  metaText: { fontSize: 12.5, fontWeight: "800", color: "#111827" },

  emptyContainer: { alignItems: "center", padding: 30 },
  emptyTitle: { marginTop: 10, fontSize: 15, fontWeight: "900", color: "#64748B" },
  emptySub: { marginTop: 4, fontSize: 12.5, fontWeight: "700", color: "#94A3B8", textAlign: "center" },
});

export default AttendanceHistoryScreen;