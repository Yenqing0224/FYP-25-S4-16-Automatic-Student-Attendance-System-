// src/screens/student/profile/appeal_detail_screen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../../api/api_client";
import { Ionicons } from '@expo/vector-icons';

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
  const [opening, setOpening] = useState(false);

  if (!appeal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerIconBox}
          >
            <Ionicons name="chevron-back" size={24} color="#3A7AFE" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Appeal Details</Text>

          <View style={styles.headerIconBox} />
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

  // ✅ Helper for Time (HH:mm)
  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString.slice(0, 5);
  };

  // ✅ Just-in-Time Link Generation
  const handleOpenFile = async () => {
    const hasFile = appeal.document_path || appeal.document_url;

    if (!hasFile) {
      Alert.alert("No file", "There is no file attached to this appeal.");
      return;
    }

    setOpening(true);

    try {
      const response = await api.get(`/get-appeals-document/${appeal.id}/`);
      const { document_url } = response.data;

      if (document_url) {
        const supported = await Linking.canOpenURL(document_url);
        if (supported) {
          await Linking.openURL(document_url);
        } else {
          await Linking.openURL(document_url);
        }
      } else {
        Alert.alert("Error", "Could not retrieve document link.");
      }
    } catch (error) {
      console.error("Open File Error:", error);
      Alert.alert("Error", "Failed to open the file. Please try again.");
    } finally {
      setOpening(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerIconBox}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Appeal Details</Text>

        <View style={styles.headerIconBox} />
      </View>


      <ScrollView contentContainerStyle={styles.scrollContent}>
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

          {/* 2. MODULE (Fixed: Changed class_session -> session) */}
          <View style={styles.item}>
            <Text style={styles.label}>Module</Text>
            <Text style={styles.value}>
              {appeal.session?.module
                ? `${appeal.session.module.code} - ${appeal.session.module.name}`
                : "Unknown Module"}
            </Text>
          </View>

          {/* 3. CLASS DATE (Fixed: Changed date_time -> date) */}
          <View style={styles.item}>
            <Text style={styles.label}>Class Date</Text>
            <Text style={styles.value}>
              {appeal.session?.date
                ? formatDate(appeal.session.date)
                : "N.A."}
            </Text>
          </View>

          {/* 4. CLASS TIME (✅ Newly Added) */}
          <View style={styles.item}>
            <Text style={styles.label}>Class Time</Text>
            <Text style={styles.value}>
              {appeal.session?.start_time && appeal.session?.end_time
                ? `${formatTime(appeal.session.start_time)} - ${formatTime(appeal.session.end_time)}`
                : "N.A."}
            </Text>
          </View>

          {/* 5. SUBMITTED ON */}
          <View style={styles.item}>
            <Text style={styles.label}>Submitted On</Text>
            <Text style={styles.value}>{formatDate(appeal.created_at)}</Text>
          </View>

          {/* 6. DESCRIPTION */}
          {appeal.description ? (
            <View style={styles.item}>
              <Text style={styles.label}>Description</Text>
              <View style={styles.remarksBox}>
                <Text style={styles.remarksText}>{appeal.description}</Text>
              </View>
            </View>
          ) : null}

          {/* 7. DOCUMENT */}
          <View style={styles.item}>
            <Text style={styles.label}>Attached File</Text>
            {(appeal.document_path || appeal.document_url) ? (
              <View>
                <Text style={styles.fileName}>Document Uploaded</Text>
                <TouchableOpacity
                  style={styles.fileButton}
                  onPress={handleOpenFile}
                  disabled={opening}
                >
                  {opening ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Text style={styles.fileButtonText}>View Document</Text>
                  )}
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
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.background,
    paddingVertical: 14,
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
  headerIconBox: { width: 32, alignItems: "flex-start" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: COLORS.textDark },

  scrollContent: { padding: 20, paddingBottom: 30 },
  errorBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: COLORS.textMuted },

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
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center'
  },
  fileButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
});

export default AppealDetailScreen;