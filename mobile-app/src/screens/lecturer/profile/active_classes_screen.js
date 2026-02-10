// src/screens/lecturer/profile/active_classes_screen.js
import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../../api/api_client";

const COLORS = {
  primary: "#6D5EF5",
  background: "#F6F5FF",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  chipBg: "#ECE9FF",
};

export default function LecturerActiveClassesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [query, setQuery] = useState("");

  // Fetch Data from Profile API
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/profile/");
      setClasses(res.data.active_modules || []);
    } catch (err) {
      console.error("Failed to fetch active classes:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchClasses();
    }, [])
  );

  // Filter Logic
  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter((c) => {
      const hay = `${c.code} ${c.name} ${c.status}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, classes]);

  const openClass = (item) => {

  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openClass(item)} activeOpacity={0.7}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {item.code}
          </Text>
          <Text style={styles.subtitle}>{item.name}</Text>
        </View>

        <View style={styles.statusChip}>
          {/* Status from API */}
          <Text style={styles.statusText}>
            {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : "Active"}
          </Text>
        </View>
      </View>

      {/* Bottom Row: Students Count */}
      <View style={styles.bottomRow}>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.metaText}>{item.student_enrolled || 0} students</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Active Modules</Text>

        <View style={{ width: 38 }} />
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search module code or name..."
          placeholderTextColor={COLORS.textMuted}
          style={styles.searchInput}
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={{ marginTop: 50 }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No active classes found</Text>
              <Text style={styles.emptySub}>You are not teaching any active modules this semester.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: COLORS.textDark },

  searchBox: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, color: COLORS.textDark, fontWeight: "700" },

  card: {
    marginTop: 12,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 14, fontWeight: "900", color: COLORS.textDark },
  subtitle: { marginTop: 2, color: COLORS.textMuted, fontWeight: "700" },

  statusChip: {
    backgroundColor: COLORS.chipBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#DCD7FF",
  },
  statusText: { color: COLORS.primary, fontWeight: "900", fontSize: 12 },

  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { color: COLORS.textMuted, fontWeight: "700" },

  bottomRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  emptyBox: {
    marginTop: 40,
    alignItems: "center",
    padding: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: "900", color: COLORS.textDark },
  emptySub: { marginTop: 6, color: COLORS.textMuted, fontWeight: "700" },
});