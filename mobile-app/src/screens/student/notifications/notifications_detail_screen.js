// mobile-app/src/screens/student/notifications/notifications_detail_screen.js
import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  primary: "#3A7AFE",
  background: "#F5F7FB",
  textDark: "#111827",
  textMuted: "#6B7280",
  card: "#FFFFFF",
};

const NotificationDetailScreen = ({ route, navigation }) => {
  const { item } = route.params;

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // ✅ no need to mark read here because we already mark read on tap in list
  useEffect(() => {}, []);

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView edges={["top"]} style={styles.safeTop} />
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notification</Text>

        <View style={{ width: 30 }} />
      </View>

      {/* MAIN CONTENT */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentCard}>
          {/* Title + Date */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{item?.title || "Notification"}</Text>
            <Text style={styles.date}>{formatDate(item?.date_sent)}</Text>
          </View>

          <View style={styles.divider} />

          {/* Body */}
          <Text style={styles.bodyText}>
            {item?.message || item?.description || item?.title || "-"}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.background },
  safeTop: { flex: 0, backgroundColor: COLORS.background },

  header: {
    backgroundColor: COLORS.background,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#E6E6E6",
  },

  backBtn: { width: 30 },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textDark,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  contentCard: {
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textDark,
    marginRight: 15,
  },

  date: {
    fontSize: 12,
    color: COLORS.textMuted,
    minWidth: 90,
    textAlign: "right",
  },

  divider: {
    height: 1,
    backgroundColor: "#E4E5E7",
    marginVertical: 16,
  },

  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textDark,
  },
});

export default NotificationDetailScreen;
