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

const AppealDetailScreen = ({ navigation, route }) => {
  const { appeal } = route.params || {};

  const BASE_URL = 'https://attendify-ekg6.onrender.com';

  if (!appeal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>{"<"}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Appeal Details</Text>
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

  const handleOpenFile = async () => {
    const docUrl = appeal.document_url; 
    if (!docUrl) {
      Alert.alert("No file", "There is no file attached to this appeal.");
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
        <Text style={styles.headerTitle}>Appeal Details</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* 1. REASON (Header) + STATUS */}
        <View style={styles.row}>
          <View style={{flex: 1}}>
             <Text style={styles.label}>Reason</Text>
             <Text style={styles.type}>{appeal.reason}</Text>
          </View>

          <View style={[
              styles.statusBadge, 
              appeal.status.toLowerCase() === 'approved' ? styles.approved :
              appeal.status.toLowerCase() === 'rejected' ? styles.rejected : 
              styles.pending
          ]}>
            <Text style={styles.statusText}>{formatStatus(appeal.status)}</Text>
          </View>
        </View>

        {/* 2. MODULE (Deep Nested Access) */}
        <View style={styles.item}>
          <Text style={styles.label}>Module</Text>
          <Text style={styles.value}>
            {/* Check if nested objects exist before accessing properties */}
            {appeal.class_session?.module 
                ? `${appeal.class_session.module.code} - ${appeal.class_session.module.name}`
                : "Unknown Module"}
          </Text>
        </View>

        {/* 3. CLASS DATE (Deep Nested Access) */}
        <View style={styles.item}>
          <Text style={styles.label}>Class Date</Text>
          <Text style={styles.value}>
            {appeal.class_session?.date_time 
                ? formatDate(appeal.class_session.date_time) 
                : "N.A."}
          </Text>
        </View>

        {/* 4. SUBMITTED ON */}
        <View style={styles.item}>
          <Text style={styles.label}>Submitted On</Text>
          <Text style={styles.value}>{formatDate(appeal.created_at)}</Text>
        </View>

        {/* 5. DESCRIPTION (Separate Section) */}
        {appeal.description ? (
            <View style={styles.item}>
            <Text style={styles.label}>Description</Text>
            <View style={styles.remarksBox}>
                <Text style={styles.remarksText}>{appeal.description}</Text>
            </View>
            </View>
        ) : null}

        {/* 6. DOCUMENT */}
        <View style={styles.item}>
          <Text style={styles.label}>Attached File</Text>
          
          {appeal.document_url ? (
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
    alignItems: "center", // Aligns Status Badge with the text
    marginBottom: 25,
  },
  type: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginTop: 2,
  },
  item: { marginBottom: 20 },
  label: { fontSize: 13, color: "#777", marginBottom: 6 },
  value: { fontSize: 16, fontWeight: "600", color: "#000" },
  
  fileName: { fontSize: 14, color: "#333", marginBottom: 8, fontStyle: 'italic' },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start', // Ensures badge doesn't stretch
    marginTop: 10,
  },
  statusText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 12,
  },
  
  // Status Colors
  approved: { backgroundColor: "#DFF6E3" },
  pending: { backgroundColor: "#FFF3CC" },
  rejected: { backgroundColor: "#F7D4D4" },

  remarksBox: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee"
  },
  remarksText: { color: "#333", fontSize: 15, lineHeight: 22 },

  fileButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#E0E0E0",
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  fileButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000"
  },
});

export default AppealDetailScreen;