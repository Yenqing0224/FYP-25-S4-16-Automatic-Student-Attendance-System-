// mobile-app/src/screens/lecturer/classes/class_list_screen.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  primary: "#6D5EF5",
  background: "#F6F5FF",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  soft: "#ECE9FF",
};

export default function LecturerClassListScreen({ route, navigation }) {
  const mode = route.params?.mode || "today"; // today | week
  const classes = route.params?.classes || [];

  const filtered = mode === "today" ? classes.filter((c) => c.dateLabel === "Today") : classes;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{mode === "today" ? "Classes Today" : "Classes This Week"}</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filtered.length === 0 ? (
          <Text style={styles.empty}>No classes.</Text>
        ) : (
          filtered.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.card}
              onPress={() => navigation.navigate("LecturerClassDetail", { cls: c })}
            >
              <View style={styles.topRow}>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{c.dateLabel}</Text>
                </View>
                <Text style={styles.time}>{c.time}</Text>
              </View>

              <Text style={styles.module}>{c.module}</Text>
              <Text style={styles.title}>{c.title}</Text>
              <Text style={styles.meta}>{c.venue}</Text>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { width: 30 },
  headerTitle: { fontSize: 18, fontWeight: "900", color: COLORS.textDark },
  content: { padding: 20 },

  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },

  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pill: { backgroundColor: COLORS.soft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { color: COLORS.primary, fontWeight: "900", fontSize: 12 },
  time: { color: COLORS.textMuted, fontWeight: "900", fontSize: 12 },

  module: { marginTop: 10, color: COLORS.primary, fontWeight: "900" },
  title: { marginTop: 2, fontSize: 15, fontWeight: "900", color: COLORS.textDark },
  meta: { marginTop: 6, color: COLORS.textMuted, fontWeight: "700" },

  empty: { color: COLORS.textMuted, fontWeight: "800", textAlign: "center", marginTop: 30 },
});
