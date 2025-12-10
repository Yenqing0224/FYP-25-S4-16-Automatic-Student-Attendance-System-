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

const COLORS = {
  primary: "#3A7AFE",
  background: "#F5F7FB",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
};

const FILTERS = ["All", "Pending", "Approved", "Rejected"];

// Helper to get colors based on status
const getStatusStyle = (status) => {
  const normalized = status ? status.toLowerCase() : "";

  switch (normalized) {
    case "approved":
      return {
        bg: "#E8F8EE",   
        text: "#15803D",
      };

    case "rejected":
      return {
        bg: "#F9E5E5",   
        text: "#B91C1C",
      };

    case "pending":
    default:
      return {
        bg: "#F7F4EC",  
        text: "#8B6B2C", 
      };
  }
};


const AppealStatusScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = "https://attendify-ekg6.onrender.com/api/appeals/";

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAppeals();
    }, [])
  );

  const fetchAppeals = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("userInfo");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const response = await axios.get(`${API_URL}?user_id=${user.id}`);
        setAppeals(response.data);
      }
    } catch (error) {
      console.error("Fetch Appeals Error:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredAppeals =
    selectedFilter === "All"
      ? appeals
      : appeals.filter(
          (item) => item.status.toLowerCase() === selectedFilter.toLowerCase()
        );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appeals Status</Text>
        <View style={{ width: 20 }} />
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

      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: 50 }}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {filteredAppeals.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No records found</Text>
              <Text style={styles.emptyText}>
                There are no {selectedFilter.toLowerCase()} appeals.
              </Text>
            </View>
          ) : (
            filteredAppeals.map((item) => {
              const stylesStatus = getStatusStyle(item.status);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  onPress={() =>
                    navigation.navigate("AppealDetail", { appeal: item })
                  }
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.cardType}>Reason</Text>
                      <Text style={styles.cardReason}>{item.reason}</Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: stylesStatus.bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: stylesStatus.text },
                        ]}
                      >
                        {formatStatus(item.status)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.label}>
                    Module:{" "}
                    <Text style={styles.value}>
                      {item.class_session?.module?.code} -{" "}
                      {item.class_session?.module?.name}
                    </Text>
                  </Text>

                  <Text style={styles.label}>
                    Class Date:{" "}
                    <Text style={styles.value}>
                      {formatDate(item.class_session?.date_time)}
                    </Text>
                  </Text>

                  <Text style={styles.label}>
                    Submitted on:{" "}
                    <Text style={styles.value}>
                      {formatDate(item.created_at)}
                    </Text>
                  </Text>
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
  // PAGE
  container: { flex: 1, backgroundColor: COLORS.background },

  // HEADER
  header: {
    backgroundColor: COLORS.background,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  backArrow: { fontSize: 24, color: COLORS.textDark, fontWeight: "300" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.textDark },

  // FILTERS
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: "space-between",
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6,
    flex: 1,
    marginHorizontal: 3,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: { fontSize: 12, color: COLORS.textMuted, fontWeight: "500" },
  filterTextActive: { color: "#FFFFFF", fontWeight: "700" },

  // LIST
  scrollContent: { padding: 20, paddingBottom: 40 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardType: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  cardReason: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  statusText: { fontSize: 12, fontWeight: "700" },

  label: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  value: { fontWeight: "600", color: COLORS.textDark },

  // EMPTY STATE
  emptyBox: { marginTop: 40, alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});

export default AppealStatusScreen;