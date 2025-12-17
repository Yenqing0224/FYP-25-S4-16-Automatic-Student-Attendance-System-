//src/screens/lecturer/profile/active_classes_screen.js
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  primary: "#6D5EF5",
  background: "#F6F5FF",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  chipBg: "#ECE9FF",
};

const MOCK_CLASSES = [
  {
    id: "1",
    moduleCode: "CSIT321",
    moduleName: "Software Design",
    section: "T01",
    venue: "LT19",
    time: "Mon 10:00–12:00",
    students: 58,
    status: "Active",
  },
  {
    id: "2",
    moduleCode: "CSIT314",
    moduleName: "Agile Methods",
    section: "T02",
    venue: "TR+12",
    time: "Wed 14:00–16:00",
    students: 42,
    status: "Active",
  },
  {
    id: "3",
    moduleCode: "CSIT998",
    moduleName: "Capstone Lab",
    section: "L03",
    venue: "COM2-02-10",
    time: "Fri 09:00–11:00",
    students: 28,
    status: "Active",
  },
];

export default function LecturerActiveClassesScreen({ navigation }) {
  const [query, setQuery] = useState("");

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_CLASSES;
    return MOCK_CLASSES.filter((c) => {
      const hay = `${c.moduleCode} ${c.moduleName} ${c.section} ${c.venue} ${c.time}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  const openClass = (item) => {
    // If you already have class detail screen, navigate there:
    // navigation.navigate("LecturerClassDetail", { classItem: item });
    // For now, we can go back or just keep it as a placeholder.
    navigation.navigate("LecturerClasses"); // change/remove if you don’t have this
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openClass(item)}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {item.moduleCode} • {item.section}
          </Text>
          <Text style={styles.subtitle}>{item.moduleName}</Text>
        </View>

        <View style={styles.statusChip}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.metaText}>{item.time}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.metaText}>{item.venue}</Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.metaText}>{item.students} students</Text>
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

        <Text style={styles.headerTitle}>Active Classes</Text>

        <View style={{ width: 38 }} />
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search module, venue, time..."
          placeholderTextColor={COLORS.textMuted}
          style={styles.searchInput}
        />
      </View>

      {/* List */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No classes found</Text>
            <Text style={styles.emptySub}>Try a different keyword.</Text>
          </View>
        }
      />
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

  metaRow: { marginTop: 10, flexDirection: "row", gap: 12, flexWrap: "wrap" },
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
