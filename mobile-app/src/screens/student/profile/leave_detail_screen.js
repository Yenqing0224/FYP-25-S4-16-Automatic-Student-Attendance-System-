// mobile-app/screens/student/profile/leave_detail_screen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  background: "#F5F7FB",
  textDark: "#111827",
  textMuted: "#6B7280",
  card: "#FFFFFF",
  borderSoft: "#E5E7EB",
  approvedBg: "#DCFCE7",
  approvedText: "#15803D",
  pendingBg: "#FEF3C7",
  pendingText: "#B45309",
  rejectedBg: "#FEE2E2",
  rejectedText: "#B91C1C",
  primary: "#3A7AFE",
};

const LeaveDetailScreen = ({ navigation, route }) => {
  const { leave } = route.params || {};

  const BASE_URL = "https://attendify-ekg6.onrender.com";

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

  const docUrl = leave.document || leave.document_url;
  const descriptionText = leave.description || leave.remarks;

  // --- HELPERS ---
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

  const handleOpenFile = async () => {
    if (!docUrl) {
      Alert.alert("No file", "There is no file attached to this leave.");
      return;
    }

    const fullUrl = docUrl.startsWith("http") ? docUrl : `${BASE_URL}${docUrl}`;

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

  // pick colors for status
  const normalizedStatus = leave.status ? leave.status.toLowerCase() : "";
  let statusBg = COLORS.pendingBg;
  let statusTextColor = COLORS.pendingText;

  if (normalizedStatus === "approved") {
    statusBg = COLORS.approvedBg;
    statusTextColor = COLORS.approvedText;
  } else if (normalizedStatus === "rejected") {
    statusBg = COLORS.rejectedBg;
    statusTextColor = COLORS.rejectedText;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave Details</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* MAIN CARD */}
        <View style={styles.cardWrapper}>
          {/* TOP: Reason + Status */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Reason</Text>
              <Text style={styles.type}>{leave.reason}</Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[styles.statusText, { color: statusTextColor }]}>
                {formatStatus(leave.status)}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* DATE RANGE */}
          <View style={styles.item}>
            <Text style={styles.label}>Date Range</Text>
            <Text style={styles.value}>
              {leave.start_date === leave.end_date
                ? formatDate(leave.start_date)
                : `${formatDate(leave.start_date)} - ${formatDate(
                    leave.end_date
                  )}`}
            </Text>
          </View>

          {/* SUBMITTED ON */}
          <View style={styles.item}>
            <Text style={styles.label}>Submitted On</Text>
            <Text style={styles.value}>
              {leave.submitted_on
                ? formatDate(leave.submitted_on)
                : formatDate(leave.created_at)}
            </Text>
          </View>

          {/* DESCRIPTION / REMARKS */}
          {descriptionText ? (
            <View style={styles.item}>
              <Text style={styles.label}>Description / Remarks</Text>
              <View style={styles.remarksBox}>
                <Text style={styles.remarksText}>{descriptionText}</Text>
              </View>
            </View>
          ) : null}

          {/* DOCUMENT */}
          <View style={styles.item}>
            <Text style={styles.label}>Attached File</Text>

            {docUrl ? (
              <View>
                <Text style={styles.fileName}>Document uploaded</Text>
                <TouchableOpacity style={styles.fileButton} onPress={handleOpenFile}>
                  <Text style={styles.fileButtonText}>View Document</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.value}>No file attached</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // LAYOUT
  container: { flex: 1, backgroundColor: COLORS.background },

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

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },

  errorBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: COLORS.textMuted },

  // CARD
  cardWrapper: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.borderSoft,
    marginVertical: 10,
  },

  item: { marginBottom: 16 },

  label: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  type: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textDark,
    marginTop: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textDark,
  },

  // STATUS
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  statusText: {
    fontWeight: "700",
    fontSize: 12,
  },

  // REMARKS
  remarksBox: {
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  remarksText: {
    color: COLORS.textDark,
    fontSize: 14,
    lineHeight: 22,
  },

  // FILE
  fileName: {
    fontSize: 14,
    color: COLORS.textDark,
    marginBottom: 8,
    fontStyle: "italic",
  },
  fileButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  fileButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default LeaveDetailScreen;
