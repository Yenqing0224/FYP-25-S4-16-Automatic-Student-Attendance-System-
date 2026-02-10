// src/screens/student/timetable/applyAppeal_screen.js
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import api from "../../../api/api_client";

const COLORS = {
  primary: "#3A7AFE",
  background: "#F5F7FB",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  chipBg: "rgba(58,122,254,0.12)",
};

const REASONS = ["Medical Leave", "Late", "Emergency", "Others"];

const getMimeType = (fileName) => {
  if (!fileName) return "application/octet-stream";
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith(".pdf")) return "application/pdf";
  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) return "image/jpeg";
  if (lowerName.endsWith(".png")) return "image/png";
  if (lowerName.endsWith(".heic")) return "image/heic";
  return "application/octet-stream";
};

const toText = (v, fallback = "") => {
  if (v == null) return fallback;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map((x) => toText(x, "")).filter(Boolean).join(", ");
  if (typeof v === "object") return String(v.name ?? v.title ?? v.code ?? v.id ?? fallback);
  return fallback;
};

const ApplyAppealScreen = ({ route, navigation }) => {
  const { classSession } = route.params || {};

  const moduleCode = toText(classSession?.module?.code, "MOD");
  const moduleName = toText(classSession?.module?.name, "Module");

  const [loading, setLoading] = useState(false);

  const [fileName, setFileName] = useState("");
  const [fileUri, setFileUri] = useState(null);
  const [fileType, setFileType] = useState(null);

  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [isReasonSheetVisible, setIsReasonSheetVisible] = useState(false);

  const canSubmit = useMemo(() => {
    if (!reason) return false;
    if (!fileUri) return false;
    if (reason === "Others" && otherReason.trim().length === 0) return true; // optional, still okay
    return true;
  }, [reason, fileUri, otherReason]);

  const openReasonSheet = () => setIsReasonSheetVisible(true);
  const closeReasonSheet = () => setIsReasonSheetVisible(false);

  const handleSelectReason = (value) => {
    setReason(value);
    closeReasonSheet();
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const name = file.name || "Selected file";
      const uri = file.uri;

      setFileName(name);
      setFileUri(uri);

      const mime = file.mimeType || getMimeType(name);
      setFileType(mime);
    } catch (err) {
      console.warn("Error picking document:", err);
      Alert.alert("Error", "Failed to pick file.");
    }
  };

  const clearFile = () => {
    setFileName("");
    setFileUri(null);
    setFileType(null);
  };

  const handleSubmit = async () => {
    if (!reason) return Alert.alert("Missing", "Please choose a reason.");
    if (!fileUri) return Alert.alert("Missing", "Please attach a supporting document.");

    const trimmedOther = otherReason.trim();
    const mainReason = reason;
    const description = reason === "Others" && trimmedOther ? trimmedOther : "";

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("session_id", String(classSession?.id));
      formData.append("reason", mainReason);
      formData.append("description", description);

      formData.append("document", {
        uri: fileUri,
        name: fileName || "document",
        type: fileType || getMimeType(fileName),
      });

      await api.post("/apply-appeals/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigation.navigate("ApplyAppealSuccess", {
        moduleCode,
        moduleName,
        reason: mainReason,
      });
    } catch (err) {
      console.error("Submit appeal error:", err?.response?.data || err);
      Alert.alert("Failed", "Failed to submit appeal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView edges={["top"]} style={styles.topSafeArea} />
      <View style={styles.contentContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

        {/* Timetable-style header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Appeal</Text>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top info card */}
          <View style={styles.infoCard}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="school-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Module</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {moduleCode} · {moduleName}
              </Text>
            </View>
          </View>

          {/* Reason */}
          <View style={styles.fieldCard}>
            <View style={styles.fieldHeader}>
              <Ionicons name="help-circle-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.label}>Reason</Text>
            </View>

            <TouchableOpacity style={styles.dropdown} onPress={openReasonSheet} activeOpacity={0.9}>
              <Text style={[styles.dropdownText, !reason && { color: COLORS.textMuted }]}>
                {reason || "Choose your reason"}
              </Text>
              <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>

            {reason === "Others" ? (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.subLabel}>If others, please specify (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={4}
                  placeholder="Type here..."
                  placeholderTextColor={COLORS.textMuted}
                  value={otherReason}
                  onChangeText={setOtherReason}
                />
              </View>
            ) : null}
          </View>

          {/* Document */}
          <View style={styles.fieldCard}>
            <View style={styles.fieldHeader}>
              <Ionicons name="document-attach-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.label}>Supporting document</Text>
            </View>

            {fileUri ? (
              <View style={styles.fileRow}>
                <View style={styles.fileChip}>
                  <Ionicons
                    name={String(fileType || "").includes("pdf") ? "document-text-outline" : "image-outline"}
                    size={16}
                    color={COLORS.primary}
                  />
                  <Text style={styles.fileName} numberOfLines={1}>
                    {fileName || "Selected file"}
                  </Text>
                </View>

                <TouchableOpacity onPress={clearFile} style={styles.removeBtn} activeOpacity={0.9}>
                  <Ionicons name="close" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadBox} onPress={handlePickDocument} activeOpacity={0.9}>
                <View style={styles.uploadIcon}>
                  <Ionicons name="cloud-upload-outline" size={20} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.uploadTitle}>Add file</Text>
                  <Text style={styles.uploadSub}>PDF / Image accepted</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!canSubmit || loading) && { opacity: 0.65 },
            ]}
            onPress={handleSubmit}
            activeOpacity={0.9}
            disabled={!canSubmit || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="paper-plane-outline" size={16} color="#fff" />
                <Text style={styles.submitText}>Submit appeal</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.footerHint}>
            Make sure your document clearly supports your reason.
          </Text>
        </ScrollView>

        {/* Reason bottom sheet */}
        <Modal visible={isReasonSheetVisible} animationType="slide" transparent onRequestClose={closeReasonSheet}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={closeReasonSheet}>
            <View style={styles.sheetContainer} onStartShouldSetResponder={() => true}>
              <View style={styles.sheetHandle} />

              <Text style={styles.sheetTitle}>Select a reason</Text>

              {REASONS.map((item) => {
                const selected = item === reason;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.sheetItem, selected && styles.sheetItemSelected]}
                    onPress={() => handleSelectReason(item)}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.sheetItemText, selected && { color: COLORS.primary }]}>
                      {item}
                    </Text>
                    {selected ? <Ionicons name="checkmark" size={18} color={COLORS.primary} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.background },
  topSafeArea: { flex: 0, backgroundColor: COLORS.background },
  contentContainer: { flex: 1, backgroundColor: COLORS.background },

  // Header
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
    backgroundColor: COLORS.chipBg,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: COLORS.textDark },

  scrollContent: { padding: 16, paddingBottom: 28 },

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.chipBg,
    justifyContent: "center",
    alignItems: "center",
  },
  infoTitle: { fontSize: 12, fontWeight: "800", color: COLORS.textMuted },
  infoValue: { marginTop: 2, fontSize: 15, fontWeight: "900", color: COLORS.textDark },

  fieldCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  fieldHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  label: { fontSize: 13, fontWeight: "800", color: COLORS.textDark },

  subLabel: { fontSize: 12.5, fontWeight: "700", color: COLORS.textMuted, marginBottom: 6 },

  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#EEF0F6",
    backgroundColor: "#F7F8FC",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  dropdownText: { fontSize: 14, fontWeight: "800", color: COLORS.textDark },

  input: {
    borderWidth: 1,
    borderColor: "#EEF0F6",
    backgroundColor: "#F7F8FC",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  textArea: { height: 110, textAlignVertical: "top" },

  uploadBox: {
    borderWidth: 1,
    borderColor: "#EEF0F6",
    backgroundColor: "#F7F8FC",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  uploadIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(58,122,254,0.16)",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadTitle: { fontSize: 14, fontWeight: "900", color: COLORS.textDark },
  uploadSub: { marginTop: 2, fontSize: 12.5, fontWeight: "700", color: COLORS.textMuted },

  fileRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  fileChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EEF0F6",
    backgroundColor: "#F7F8FC",
  },
  fileName: { flex: 1, fontSize: 13.5, fontWeight: "800", color: COLORS.textDark },
  removeBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(239,68,68,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  submitButton: {
    marginTop: 6,
    height: 52,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "900" },

  footerHint: {
    marginTop: 10,
    textAlign: "center",
    color: "#94A3B8",
    fontWeight: "700",
    fontSize: 12.5,
  },

  // Bottom sheet
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheetContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 26,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    marginBottom: 10,
  },
  sheetTitle: { fontSize: 16, fontWeight: "900", color: COLORS.textDark, marginBottom: 10 },
  sheetItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetItemSelected: { backgroundColor: "rgba(58,122,254,0.10)" },
  sheetItemText: { fontSize: 14, fontWeight: "800", color: COLORS.textDark },
});

export default ApplyAppealScreen;
