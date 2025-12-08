import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const FILTERS = ["All", "Pending", "Approved", "Rejected"];

// Helper to get colors based on status
const getStatusStyle = (status) => {
  const normalized = status ? status.toLowerCase() : "";
  switch (normalized) {
    case "approved":
      return { bg: "#E0F9E6", text: "#1A7F37" };
    case "rejected":
      return { bg: "#FCE4E4", text: "#B3261E" };
    case "pending":
    default:
      return { bg: "#FFF6E5", text: "#B26A00" };
  }
};

const AppealStatusScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = 'https://attendify-ekg6.onrender.com/api/appeals/';

  useFocusEffect(
    useCallback(() => {
      fetchAppeals();
    }, [])
  );

  const fetchAppeals = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userInfo');
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

  // --- HELPERS ---
  const formatStatus = (status) => {
    if (!status) return "";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Format Date from "2025-12-08T09:00:00" to "08-12-2025"
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
        day: '2-digit', month: '2-digit', year: 'numeric' 
    }).replace(/\//g, '-');
  };

  // Filter Logic
  const filteredAppeals =
    selectedFilter === "All"
      ? appeals
      : appeals.filter((item) => 
          item.status.toLowerCase() === selectedFilter.toLowerCase()
        );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EAEAEA" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appeals Status</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.filterContainer}>
        {FILTERS.map((filter) => {
          const isActive = filter === selectedFilter;
          return (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
          <ActivityIndicator size="large" color="#000" style={{marginTop: 50}} />
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
                    onPress={() => navigation.navigate("AppealDetail", { appeal: item })}
                  >
                    <View style={styles.cardHeaderRow}>
                      {/* Reason */}
                      <Text style={styles.cardType}>Reason: {item.reason}</Text> 
                      
                      {/* Status Badge */}
                      <View style={[styles.statusBadge, { backgroundColor: stylesStatus.bg }]}>
                        <Text style={[styles.statusText, { color: stylesStatus.text }]}>
                          {formatStatus(item.status)} 
                        </Text>
                      </View>
                    </View>

                    {/* ✅ UPDATED: Read Nested Data from Serializer */}
                    <Text style={styles.label}>
                      Module: <Text style={styles.value}>
                        {item.class_session?.module?.code} - {item.class_session?.module?.name}
                      </Text>
                    </Text>

                    {/* ✅ UPDATED: Read Nested Date */}
                    <Text style={styles.label}>
                      Class Date: <Text style={styles.value}>
                        {formatDate(item.class_session?.date_time)}
                      </Text>
                    </Text>

                    <Text style={styles.label}>
                      Submitted on: <Text style={styles.value}>{formatDate(item.created_at)}</Text>
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
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    backgroundColor: "#EAEAEA", paddingVertical: 15, paddingHorizontal: 20,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  backArrow: { fontSize: 24, color: "#333", fontWeight: "300" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#000" },
  
  filterContainer: {
    flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, justifyContent: "space-between",
  },
  filterChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
    borderColor: "#D0D0D0", marginRight: 6, flex: 1, marginHorizontal: 3, alignItems: "center",
  },
  filterChipActive: { backgroundColor: "#3A7AFE", borderColor: "#3A7AFE" },
  filterText: { fontSize: 12, color: "#555", fontWeight: "500" },
  filterTextActive: { color: "#FFFFFF", fontWeight: "700" },

  scrollContent: { padding: 20, paddingBottom: 40 },
  card: { backgroundColor: "#F7F7F7", borderRadius: 12, padding: 16, marginBottom: 16 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cardType: { fontSize: 16, fontWeight: "700", color: "#000" },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: "600" },
  label: { fontSize: 13, color: "#555", marginTop: 4 },
  value: { fontWeight: "600", color: "#222" },
  remarksBox: { marginTop: 10, backgroundColor: "#FFFFFF", borderRadius: 8, padding: 10 },
  remarksLabel: { fontSize: 12, fontWeight: "700", color: "#555", marginBottom: 4 },
  remarksText: { fontSize: 13, color: "#444" },
  emptyBox: { marginTop: 40, alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  emptyText: { fontSize: 13, color: "#666", textAlign: "center", paddingHorizontal: 20 },
});

export default AppealStatusScreen;