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
  primary: "#3A7AFE",
  background: "#F5F7FB",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
};

const AppealDetailScreen = ({ navigation, route }) => {
  const { appeal } = route.params || {};

  const BASE_URL = "https://attendify-ekg6.onrender.com";

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
    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "-");
  };

  const handleOpenFile = async () => {
    const docUrl = appeal.document_url;
    if (!docUrl) {
      Alert.alert("No file", "There is no file attached to this appeal.");
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appeal Details</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* CARD WRAPPER */}
        <View style={styles.card}>
          {/* 1. REASON + STATUS */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Reason</Text>
              <Text style={styles.type}>{appeal.reason}</Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                appeal.status.toLowerCase() === "approved"
                  ? styles.approved
                  : appeal.status.toLowerCase() === "rejected"
                  ? styles.rejected
                  : styles.pending,
              ]}
            >
              <Text style={styles.statusText}>
                {formatStatus(appeal.status)}
              </Text>
            </View>
          </View>

          {/* 2. MODULE */}
          <View style={styles.item}>
            <Text style={styles.label}>Module</Text>
            <Text style={styles.value}>
              {appeal.session?.module
                ? `${appeal.session.module.code} - ${appeal.session.module.name}`
                : "Unknown Module"}
            </Text>
          </View>

          {/* 3. CLASS DATE */}
          <View style={styles.item}>
            <Text style={styles.label}>Class Date</Text>
            <Text style={styles.value}>
              {appeal.session?.date_time
                ? formatDate(appeal.session.date_time)
                : "N.A."}
            </Text>
          </View>

          {/* 4. SUBMITTED ON */}
          <View style={styles.item}>
            <Text style={styles.label}>Submitted On</Text>
            <Text style={styles.value}>{formatDate(appeal.created_at)}</Text>
          </View>

          {/* 5. DESCRIPTION */}
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // PAGE
  container: { flex: 1, backgroundColor: COLORS.background },

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

  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },

  // ERROR
  errorBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: COLORS.textMuted },

  // CARD
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },

  type: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textDark,
    marginTop: 2,
  },

  item: { marginBottom: 18 },

  label: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textDark,
  },

  fileName: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 8,
    fontStyle: "italic",
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginLeft: 10,
  },
  statusText: {
    fontWeight: "700",
    fontSize: 12,
  },

  approved: { backgroundColor: "#DFF6E3" },
  pending: { backgroundColor: "#FFF3CC" },
  rejected: { backgroundColor: "#F7D4D4" },

  remarksBox: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  remarksText: {
    color: COLORS.textDark,
    fontSize: 14,
    lineHeight: 22,
  },

  fileButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#E5EDFF",
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  fileButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
});

export default AppealDetailScreen;