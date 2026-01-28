// src/screens/student/newsevent/newsevent_screen.js
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../../api/api_client";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  primary: "#3A7AFE",
  background: "#F5F7FB",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  shadow: "rgba(0,0,0,0.08)",
  chipBg: "#E7F0FF",
};

const NewsEventsScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("News");

  const [newsList, setNewsList] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNewsAndEvents();
  }, []);

  const fetchNewsAndEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get("/newsevent/");
      setNewsList(Array.isArray(response.data?.news) ? response.data.news : []);
      setEventsList(Array.isArray(response.data?.events) ? response.data.events : []);
    } catch (error) {
      console.error("Failed to fetch feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const rawItems = activeTab === "Events" ? eventsList : newsList;

  const currentItems = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return rawItems;

    return rawItems.filter((item) => {
      const title = String(item?.title || "").toLowerCase();
      const body = String(item?.message || item?.description || "").toLowerCase();
      return title.includes(q) || body.includes(q);
    });
  }, [rawItems, searchText]);

  const getItemDate = (item) => {
    return activeTab === "News" ? item?.news_date : item?.event_date;
  };

  const getItemDesc = (item) => {
    return item?.message || item?.description || "";
  };

  const Chip = ({ label, type }) => {
    const isNews = type === "News";
    return (
      <View style={[styles.chip, { backgroundColor: isNews ? "#E7F0FF" : "#E8FBF8" }]}>
        <Text style={[styles.chipText, { color: isNews ? COLORS.primary : "#119C8B" }]}>{label}</Text>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView edges={["top"]} style={styles.topSafeArea} />

      <View style={styles.contentContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>News & Events</Text>

          <TouchableOpacity
            onPress={fetchNewsAndEvents}
            style={styles.refreshBtn}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading updates...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* SEARCH */}
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by title or description"
                placeholderTextColor={COLORS.textMuted}
                value={searchText}
                onChangeText={setSearchText}
                returnKeyType="search"
              />
              {!!searchText && (
                <TouchableOpacity onPress={() => setSearchText("")} style={styles.clearBtn} activeOpacity={0.85}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* TABS */}
            <View style={styles.tabContainer}>
              {["News", "Events"].map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.tabButton, isActive && styles.activeTab]}
                    onPress={() => {
                      setActiveTab(tab);
                      setSearchText("");
                    }}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.tabText, isActive ? styles.activeTabText : styles.inactiveTabText]}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* LIST */}
            <View style={styles.listContainer}>
              {currentItems.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="newspaper-outline" size={44} color={COLORS.primary} />
                  <Text style={styles.emptyTitle}>Nothing here yet</Text>
                  <Text style={styles.emptyText}>
                    {searchText ? `No results for "${searchText}"` : `No ${activeTab.toLowerCase()} found.`}
                  </Text>
                </View>
              ) : (
                currentItems.map((item) => (
                  <TouchableOpacity
                    key={String(item.id)}
                    style={styles.card}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate("NewseventDetail", { item })}
                  >
                    {/* Image */}
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={styles.cardImage} />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Ionicons name="image-outline" size={18} color="rgba(17,24,39,0.35)" />
                      </View>
                    )}

                    {/* Text */}
                    <View style={styles.cardText}>
                      <View style={styles.cardTopRow}>
                        <Chip label={activeTab === "News" ? "NEWS" : "EVENT"} type={activeTab} />
                        <View style={styles.dateRow}>
                          <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
                          <Text style={styles.cardDate}>{formatDate(getItemDate(item))}</Text>
                        </View>
                      </View>

                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {String(item.title || "Untitled")}
                      </Text>

                      <Text style={styles.cardDescription} numberOfLines={2}>
                        {String(getItemDesc(item))}
                      </Text>

                      <View style={styles.cardCtaRow}>
                        <Text style={styles.readMore}>Tap to view</Text>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.background },
  topSafeArea: { backgroundColor: COLORS.background },
  contentContainer: { flex: 1 },

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

  scrollContent: { paddingBottom: 20 },

  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: COLORS.textMuted, fontWeight: "600" },

  /* SEARCH */
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textDark, fontWeight: "600" },
  clearBtn: { padding: 2 },

  /* TABS */
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: COLORS.card,
    borderRadius: 999,
    padding: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabButton: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: { fontSize: 14, fontWeight: "800" },
  activeTabText: { color: "#fff" },
  inactiveTabText: { color: COLORS.textMuted },

  /* LIST */
  listContainer: { paddingHorizontal: 20, marginTop: 14 },

  emptyBox: {
    marginTop: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  emptyTitle: { marginTop: 10, fontSize: 15, fontWeight: "900", color: COLORS.textDark },
  emptyText: { marginTop: 6, color: COLORS.textMuted, fontSize: 13, textAlign: "center", fontWeight: "600" },

  card: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },

  cardImage: {
    width: 78,
    height: 78,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: "#D1D5DB",
  },
  imagePlaceholder: {
    width: 78,
    height: 78,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  cardText: { flex: 1 },
  cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  chipText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.6 },

  dateRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardDate: { fontSize: 12, color: COLORS.textMuted, fontWeight: "800" },

  cardTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.textDark,
    lineHeight: 20,
  },
  cardDescription: { marginTop: 6, fontSize: 13, color: COLORS.textMuted, fontWeight: "600", lineHeight: 18 },

  cardCtaRow: { marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  readMore: { color: COLORS.primary, fontWeight: "900", fontSize: 12 },
});

export default NewsEventsScreen;
