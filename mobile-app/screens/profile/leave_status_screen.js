import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const FILTERS = ["All", "Pending", "Approved", "Rejected"];

const COLORS = {
  primary: "#3A7AFE",
  background: "#F5F7FB",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  borderSoft: "#E5E7EB",
};

// Helper to get colors based on status
const getStatusStyle = (status) => {
  const normalized = status ? status.toLowerCase() : "";
  switch (normalized) {
    case "approved":
      return { bg: "#E8F8EE", text: "#15803D", stripe: "#4ADE80" }; // soft green

    case "rejected":
      return { bg: "#F9E5E5", text: "#B91C1C", stripe: "#F87171" }; // soft red

    case "pending":
    default:
      return {
        bg: "#F7F4EC",       // ⬅️ VERY SOFT CREAM (barely yellow)
        text: "#8B6B2C",     // muted gold-brown text
        stripe: "#E6D892"    // soft pastel gold stripe
      };
  }
};


const LeaveStatusScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = "https://attendify-ekg6.onrender.com/api/leaves/";

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchLeaves();
    }, [])
  );

  const fetchLeaves = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("userInfo");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const response = await axios.get(`${API_URL}?user_id=${user.id}`);
        setLeaves(response.data);
      }
    } catch (error) {
      console.error("Fetch Leaves Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- FORMATTING HELPERS ---
  const formatStatus = (status) => {
    if (!status) return "";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "-");
  };

  // Filter Logic
  const filteredLeaves =
    selectedFilter === "All"
      ? leaves
      : leaves.filter(
        (item) =>
          item.status &&
          item.status.toLowerCase() === selectedFilter.toLowerCase()
      );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaves Status</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* FILTER CHIPS */}
      <View style={styles.filterContainer}>
        {FILTERS.map((filter) => {
          const isActive = filter === selectedFilter;
          return (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  isActive && styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* CONTENT */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: 50 }}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {filteredLeaves.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No records found</Text>
              <Text style={styles.emptyText}>
                There are no {selectedFilter.toLowerCase()} records.
              </Text>
            </View>
          ) : (
            filteredLeaves.map((item) => {
              const statusStyles = getStatusStyle(item.status);

              // ❌ REMOVED: const description = item.description || item.remarks;
              // We now use item.description and item.remarks directly below

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.cardWrapper}
                  onPress={() =>
                    navigation.navigate("LeaveDetail", { leave: item })
                  }
                >
                  {/* Colored stripe on the left */}
                  <View
                    style={[
                      styles.statusStripe,
                      { backgroundColor: statusStyles.stripe },
                    ]}
                  />
                  <View
                    style={[
                      styles.card,
                      { backgroundColor: statusStyles.bg || COLORS.card },
                    ]}
                  >
                    {/* Header row: reason + badge */}
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardType}>{item.reason}</Text>

                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: "#FFFFFF" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: statusStyles.text },
                          ]}
                        >
                          {formatStatus(item.status)}
                        </Text>
                      </View>
                    </View>

                    {/* Date Range */}
                    <Text style={styles.label}>
                      Date range:{" "}
                      <Text style={styles.value}>
                        {item.start_date === item.end_date
                          ? formatDate(item.start_date)
                          : `${formatDate(item.start_date)} - ${formatDate(
                            item.end_date
                          )}`}
                      </Text>
                    </Text>

                    {/* Submitted On */}
                    <Text style={styles.label}>
                      Submitted on:{" "}
                      <Text style={styles.value}>
                        {formatDate(item.created_at)}
                      </Text>
                    </Text>

                    {/* --- 1. STUDENT DESCRIPTION --- */}
                    {item.description ? (
                      <View style={styles.remarksBox}>
                        <Text style={styles.remarksLabel}>Description</Text>
                        <Text style={styles.remarksText}>{item.description}</Text>
                      </View>
                    ) : null}

                    {/* --- 2. ADMIN REMARKS (Only if rejected/commented) --- */}
                    {item.remarks ? (
                      <View style={[styles.remarksBox, { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.6)' }]}>
                        {/* We use status color for the label to indicate it comes from Admin/System */}
                        <Text style={[styles.remarksLabel, { color: statusStyles.text }]}>
                          Admin Remarks
                        </Text>
                        <Text style={styles.remarksText}>{item.remarks}</Text>
                      </View>
                    ) : null}

                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // HEADER
  header: {
    backgroundColor: COLORS.background,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderSoft,
  },
  backArrow: { fontSize: 24, color: COLORS.textDark, fontWeight: "300" },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textDark,
  },

  // FILTERS
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "space-between",
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    flex: 1,
    marginHorizontal: 3,
    alignItems: "center",
    backgroundColor: COLORS.card,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // CONTENT
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },


  cardWrapper: {
    flexDirection: "row",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: "transparent",
  },
  statusStripe: {
    width: 5,
  },
  card: {
    flex: 1,
    padding: 14,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardType: { fontSize: 16, fontWeight: "700", color: COLORS.textDark },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontSize: 12, fontWeight: "700" },

  label: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  value: { fontWeight: "600", color: COLORS.textDark },

  remarksBox: {
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 8,
    padding: 10,
  },
  remarksLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  remarksText: { fontSize: 13, color: COLORS.textDark },

  // EMPTY STATE
  emptyBox: { marginTop: 40, alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});

export default LeaveStatusScreen;