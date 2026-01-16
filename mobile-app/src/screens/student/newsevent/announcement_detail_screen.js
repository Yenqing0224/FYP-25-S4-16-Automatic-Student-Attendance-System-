//src/screens/student/newsevent/announcement_detail_screen.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  primary: "#3A7AFE",
  background: "#F5F7FB",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
};

export default function StudentAnnouncementDetailScreen({ route, navigation }) {
  const announcement = route.params?.announcement;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcement</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>{announcement?.title || "No title"}</Text>
          <Text style={styles.date}>{announcement?.dateLabel || announcement?.date || ""}</Text>
          <View style={styles.divider} />
          <Text style={styles.body}>
            {announcement?.body || announcement?.desc || "No details."}
          </Text>
        </View>
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
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: { fontSize: 18, fontWeight: "900", color: COLORS.textDark },
  date: { marginTop: 6, color: COLORS.textMuted, fontWeight: "700" },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
  body: { color: COLORS.textDark, fontWeight: "700", lineHeight: 22 },
});
