// mobile-app/screens/student/notifications/notifications_screen.js
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "../../../api/api_client";

const COLORS = {
  primary: "#3A7AFE",
  background: "#F5F7FB", // ✅ FIX: you were using COLORS.background but it wasn't defined
  textDark: "#111827",
  textMuted: "#6B7280",
  card: "#FFFFFF",
  border: "#E5E7EB",
  soft: "#E7F0FF",
};

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get("/notifications/");
      setNotifications(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;

    // Optimistic update
    const updatedList = notifications.map((item) => ({ ...item, is_read: true }));
    setNotifications(updatedList);

    try {
      await api.post("/notifications/mark-read/");
    } catch (error) {
      console.error("Failed to mark read:", error);
      Alert.alert("Error", "Could not sync with server");
      fetchNotifications();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getIconName = (item) => {
    // Simple heuristic based on message/title (optional)
    const text = String(item?.message || item?.title || "").toLowerCase();
    if (text.includes("class") || text.includes("timetable")) return "calendar-outline";
    if (text.includes("announcement") || text.includes("news")) return "megaphone-outline";
    if (text.includes("payment") || text.includes("fee")) return "card-outline";
    return "notifications-outline";
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView edges={["top"]} style={styles.safeTop} />
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>

        <View style={{ alignItems: "center" }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSub}>
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={fetchNotifications}
          style={styles.headerBtn}
          activeOpacity={0.85}
        >
          <Ionicons name="refresh" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Checking alerts...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* TOP ACTION ROW */}
            <View style={styles.topRow}>
              <View style={styles.unreadPill}>
                <Ionicons name="mail-unread-outline" size={14} color={COLORS.primary} />
                <Text style={styles.unreadPillText}>{unreadCount} unread</Text>
              </View>

              <TouchableOpacity
                style={[styles.markReadButton, unreadCount === 0 && styles.markReadButtonDisabled]}
                onPress={handleMarkAllRead}
                activeOpacity={0.85}
                disabled={unreadCount === 0}
              >
                <Ionicons
                  name="checkmark-done-outline"
                  size={16}
                  color={unreadCount === 0 ? COLORS.textMuted : COLORS.primary}
                />
                <Text style={[styles.markReadText, unreadCount === 0 && { color: COLORS.textMuted }]}>
                  Mark all read
                </Text>
              </TouchableOpacity>
            </View>

            {/* LIST */}
            {notifications.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="notifications-off-outline" size={34} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>All caught up</Text>
                <Text style={styles.emptySubtitle}>No new notifications right now.</Text>
              </View>
            ) : (
              <View style={styles.listContainer}>
                {notifications.map((item) => {
                  const isUnread = !item.is_read;

                  return (
                    <TouchableOpacity
                      key={String(item.id)}
                      style={[styles.card, isUnread ? styles.cardUnread : styles.cardRead]}
                      activeOpacity={0.9}
                      onPress={() => navigation.navigate("NotificationDetail", { item })}
                    >
                      {/* Left accent */}
                      {isUnread && <View style={styles.leftAccent} />}

                      <View style={styles.cardInner}>
                        {/* Icon */}
                        <View style={[styles.iconBox, isUnread && styles.iconBoxUnread]}>
                          <Ionicons name={getIconName(item)} size={18} color={COLORS.primary} />
                        </View>

                        {/* Text */}
                        <View style={{ flex: 1 }}>
                          <View style={styles.cardTopRow}>
                            <View style={styles.titleRow}>
                              {isUnread && <View style={styles.dotIndicator} />}
                              <Text
                                style={[styles.messageText, isUnread && styles.messageTextUnread]}
                                numberOfLines={1}
                              >
                                {item.title || "Notification"}
                              </Text>
                            </View>

                            {isUnread && (
                              <View style={styles.newChip}>
                                <Text style={styles.newChipText}>NEW</Text>
                              </View>
                            )}
                          </View>

                          <Text style={styles.bodyText} numberOfLines={2}>
                            {item.message || item.title || "-"}
                          </Text>

                          <View style={styles.dateRow}>
                            <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
                            <Text style={styles.dateText}>{formatDate(item.date_sent)}</Text>
                          </View>
                        </View>

                        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.background },
  safeTop: { flex: 0, backgroundColor: COLORS.background },

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
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.soft,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: COLORS.textDark },
  headerSub: { marginTop: 2, fontSize: 12, fontWeight: "700", color: COLORS.textMuted },

  contentContainer: { flex: 1 },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: COLORS.textMuted, fontWeight: "600" },

  scrollContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },

  unreadPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  unreadPillText: { fontWeight: "900", fontSize: 12, color: COLORS.textDark },

  markReadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  markReadButtonDisabled: {
    opacity: 0.7,
  },
  markReadText: { fontWeight: "900", fontSize: 12, color: COLORS.primary },

  listContainer: { marginTop: 4 },

  card: {
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    overflow: "hidden",
  },
  cardUnread: {
    borderColor: "rgba(58,122,254,0.25)",
    backgroundColor: "#F4F8FF",
  },
  cardRead: {
    backgroundColor: COLORS.card,
  },

  leftAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.primary,
  },

  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.soft,
    justifyContent: "center",
    alignItems: "center",
  },
  iconBoxUnread: {
    backgroundColor: "#E7F0FF",
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },

  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: COLORS.primary,
  },

  messageText: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.textDark,
    flex: 1,
  },
  messageTextUnread: {
    color: "#1D2A5B",
  },

  newChip: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  newChipText: { fontSize: 10, fontWeight: "900", color: "#fff", letterSpacing: 0.7 },

  bodyText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
    lineHeight: 18,
  },

  dateRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  dateText: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },

  emptyCard: {
    marginTop: 24,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.soft,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: "900", color: COLORS.textDark },
  emptySubtitle: { marginTop: 6, fontSize: 13, fontWeight: "600", color: COLORS.textMuted, textAlign: "center" },
});

export default NotificationScreen;
