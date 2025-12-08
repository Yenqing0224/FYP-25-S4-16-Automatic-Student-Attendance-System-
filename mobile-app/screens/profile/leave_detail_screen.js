import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LeaveDetailScreen = ({ navigation, route }) => {
  const { leave } = route.params || {};

  // Base URL for your backend (needed to open files)
  const BASE_URL = 'https://attendify-ekg6.onrender.com';

  if (!leave) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>{"<"}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leave Details</Text>
          <View style={{ width: 20 }} />
        </View>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>No record data found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- HELPERS ---
  const formatStatus = (status) => {
    if (!status) return "";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
        day: '2-digit', month: '2-digit', year: 'numeric' 
    }).replace(/\//g, '-');
  };

  // --- FILE OPENING LOGIC ---
  const handleOpenFile = async () => {
    const docUrl = leave.document || leave.document_url; 

    if (!docUrl) {
      Alert.alert("No file", "There is no file attached to this leave.");
      return;
    }

    const fullUrl = docUrl.startsWith('http') ? docUrl : `${BASE_URL}${docUrl}`;

    try {
      const supported = await Linking.canOpenURL(fullUrl);
      if (supported) {
        await Linking.openURL(fullUrl);
      } else {
        await Linking.openURL(fullUrl);
      }
    } catch (e) {
      console.warn("Error opening file:", e);
      Alert.alert("Error", "Failed to open the file.");
    }
  };

  // --- RENDER ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EAEAEA" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave Details</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* TYPE + STATUS */}
        <View style={styles.row}>
          <Text style={styles.type}>{leave.reason}</Text>

          <View style={[
              styles.statusBadge, 
              leave.status.toLowerCase() === 'approved' ? styles.approved :
              leave.status.toLowerCase() === 'rejected' ? styles.rejected : 
              styles.pending
          ]}>
            <Text style={styles.statusText}>{formatStatus(leave.status)}</Text>
          </View>
        </View>

        {/* DATE RANGE */}
        <View style={styles.item}>
          <Text style={styles.label}>Date Range</Text>
          <Text style={styles.value}>
            {leave.start_date === leave.end_date 
                ? formatDate(leave.start_date) 
                : `${formatDate(leave.start_date)} - ${formatDate(leave.end_date)}`}
          </Text>
        </View>

        {/* SUBMITTED ON */}
        <View style={styles.item}>
          <Text style={styles.label}>Submitted On</Text>
          <Text style={styles.value}>
             {leave.submitted_on || formatDate(leave.created_at)}
          </Text>
        </View>

        {/* REASON */}
        <View style={styles.item}>
          <Text style={styles.label}>Reason</Text>
          <Text style={styles.value}>{leave.reason}</Text>
        </View>

        {/* REMARKS */}
        {leave.remarks ? (
          <View style={styles.item}>
            <Text style={styles.label}>Remarks</Text>
            <View style={styles.remarksBox}>
                <Text style={styles.remarksText}>{leave.remarks}</Text>
            </View>
          </View>
        ) : null}

        {/* DOCUMENT */}
        <View style={styles.item}>
          <Text style={styles.label}>Attached File</Text>
          
          {leave.document ? (
            <View>
                <Text style={styles.fileName}>Document Uploaded</Text>
                <TouchableOpacity
                style={styles.fileButton}
                onPress={handleOpenFile}
                >
                <Text style={styles.fileButtonText}>View Document</Text>
                </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.value}>No file attached</Text>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default LeaveDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#EAEAEA",
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backArrow: { fontSize: 24, color: "#333", fontWeight: "300" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#000" },
  scrollContent: { padding: 20, paddingBottom: 30 },
  errorBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: "#555" },

  // detail UI
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  type: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    flexShrink: 1,
    paddingRight: 10,
  },
  item: { marginBottom: 20 },
  label: { fontSize: 13, color: "#777", marginBottom: 4 },
  value: { fontSize: 15, fontWeight: "600", color: "#000" },
  
  fileName: { fontSize: 14, color: "#333", marginBottom: 8, fontStyle: 'italic' },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 12,
  },
  approved: { backgroundColor: "#DFF6E3" },
  pending: { backgroundColor: "#FFF3CC" },
  rejected: { backgroundColor: "#F7D4D4" },

  remarksBox: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee"
  },
  remarksText: { color: "#333", fontSize: 14 },

  fileButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#E0E0E0",
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  fileButtonText: { fontSize: 14, fontWeight: "600" },
});