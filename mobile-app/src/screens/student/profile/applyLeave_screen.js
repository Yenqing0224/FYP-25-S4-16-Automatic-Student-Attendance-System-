// src/screens/student/profile/applyLeave_screen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Platform,
  ActivityIndicator, // For the spinner
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import api from "../../../api/api_client";

const COLORS = {
  primary: "#3A7AFE",
  background: "#F5F7FB",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
};

const REASONS = ["Medical Leave", "In-Camp Training", "Others"];

// ✅ Helper to ensure correct file type for backend
const getMimeType = (fileName) => {
  if (!fileName) return "application/octet-stream";
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith(".pdf")) return "application/pdf";
  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) return "image/jpeg";
  if (lowerName.endsWith(".png")) return "image/png";
  if (lowerName.endsWith(".heic")) return "image/heic";
  return "application/octet-stream";
};

const formatDate = (date) => {
  const d = date instanceof Date ? date : new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const toApiDate = (date) => {
  if (!(date instanceof Date)) return "";
  return date.toISOString().split("T")[0];
};

const ApplyLeaveScreen = ({ navigation }) => {
  // -------- Loading State --------
  const [loading, setLoading] = useState(false);

  // -------- Dates --------
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [startDateObj, setStartDateObj] = useState(new Date());
  const [endDateObj, setEndDateObj] = useState(new Date());

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Temp state for iOS spinner (confirm/cancel pattern)
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date());

  // -------- File --------
  const [fileName, setFileName] = useState("No file chosen");
  const [fileUri, setFileUri] = useState(null);
  const [fileType, setFileType] = useState(null);

  // -------- Reason --------
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [isReasonSheetVisible, setIsReasonSheetVisible] = useState(false);

  // ---------- SUBMIT LOGIC ----------
  const handleSubmit = async () => {
    // Basic Validation
    if (!startDate) return alert("Please select a start date.");
    if (!endDate) return alert("Please select an end date.");
    if (!reason) return alert("Please choose a reason.");
    if (!fileUri) return alert("Please attach a supporting document.");

    const trimmedOther = otherReason.trim();
    const mainReason = reason;
    const description = reason === "Others" && trimmedOther ? trimmedOther : "";
    const finalReason = reason === "Others" && trimmedOther ? `Others: ${trimmedOther}` : reason;

    // 1. Start Loading
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("start_date", toApiDate(startDateObj));
      formData.append("end_date", toApiDate(endDateObj));
      formData.append("reason", mainReason);
      formData.append("description", description);

      // 2. Attach File
      formData.append("document", {
        uri: fileUri,
        name: fileName,
        type: fileType || getMimeType(fileName),
      });

      // 3. API Call
      await api.post("/apply-leaves/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // 4. Success Navigation
      navigation.navigate("ApplyLeaveSuccess", {
        startDate,
        endDate,
        reason: finalReason,
      });

    } catch (err) {
      console.error("Submit leave error:", err.response?.data || err);
      alert("Failed to submit leave. Please try again.");
    } finally {
      // 5. Stop Loading (Always runs)
      setLoading(false);
    }
  };

  // ---------- FILE PICKER ----------
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"], // Allow PDF + Images
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setFileName(file.name || "Selected file");
      setFileUri(file.uri);
      const mime = file.mimeType || getMimeType(file.name);
      setFileType(mime);

    } catch (err) {
      console.warn("Error picking document:", err);
      alert("Failed to pick file");
    }
  };

  // ---------- DATE PICKER HELPERS ----------
  const openStartPicker = () => {
    setTempStartDate(startDateObj);
    setShowStartPicker(true);
  };

  const openEndPicker = () => {
    // Default the picker to start date if current end date is invalid
    const base = endDateObj < startDateObj ? startDateObj : endDateObj;
    setTempEndDate(base);
    setShowEndPicker(true);
  };

  const confirmStartDate = (dateParam) => {
    const finalDate = dateParam || tempStartDate;
    // Basic check: Start date cannot be in the past
    const today = new Date(); today.setHours(0,0,0,0);
    if (finalDate < today) {
       alert("Start date cannot be earlier than today.");
       return;
    }
    setStartDateObj(finalDate);
    setStartDate(formatDate(finalDate));
    setShowStartPicker(false);
  };

  const confirmEndDate = (dateParam) => {
    const finalDate = dateParam || tempEndDate;
    // Basic check: End date cannot be before Start date
    if (finalDate < startDateObj) {
      alert("End date cannot be earlier than the start date.");
      return;
    }
    setEndDateObj(finalDate);
    setEndDate(formatDate(finalDate));
    setShowEndPicker(false);
  };

  // ---------- ANDROID PICKERS (NO MODAL) ----------
  // These render directly to avoid the "Black Bar" freeze issue
  const renderAndroidPickers = () => {
    if (Platform.OS !== "android") return null;
    return (
      <>
        {showStartPicker && (
          <DateTimePicker
            value={tempStartDate}
            mode="date"
            display="default"
            minimumDate={new Date()} // Block past dates automatically
            onChange={(event, selected) => {
              setShowStartPicker(false);
              if (event.type === "set" && selected) {
                confirmStartDate(selected);
              }
            }}
          />
        )}
        {showEndPicker && (
          <DateTimePicker
            value={tempEndDate}
            mode="date"
            display="default"
            minimumDate={startDateObj} // Block dates before start date automatically
            onChange={(event, selected) => {
              setShowEndPicker(false);
              if (event.type === "set" && selected) {
                confirmEndDate(selected);
              }
            }}
          />
        )}
      </>
    );
  };

  // ---------- REASON SHEET HANDLERS ----------
  const openReasonSheet = () => setIsReasonSheetVisible(true);
  const closeReasonSheet = () => setIsReasonSheetVisible(false);
  const handleSelectReason = (value) => {
    setReason(value);
    closeReasonSheet();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apply Leave</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formCard}>

          {/* Start Date Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Start Date</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={styles.input}
                placeholder="dd-mm-yyyy"
                placeholderTextColor={COLORS.textMuted}
                value={startDate}
                editable={false}
              />
              <TouchableOpacity onPress={openStartPicker}>
                <Text style={styles.icon}>📅</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* End Date Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>End Date</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={styles.input}
                placeholder="dd-mm-yyyy"
                placeholderTextColor={COLORS.textMuted}
                value={endDate}
                editable={false}
              />
              <TouchableOpacity onPress={openEndPicker}>
                <Text style={styles.icon}>📅</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Reason Selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Reason</Text>
            <TouchableOpacity style={styles.dropdown} onPress={openReasonSheet} activeOpacity={0.8}>
              <Text style={[styles.dropdownText, !reason && { color: COLORS.textMuted }]}>
                {reason || "Choose your reason"}
              </Text>
              <Text style={styles.dropdownIcon}>⌄</Text>
            </TouchableOpacity>
          </View>

          {/* Others Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>If others, please specify (optional)</Text>
            <TextInput
              style={[styles.baseInputBox, styles.textArea]}
              multiline
              numberOfLines={4}
              placeholder="Type here..."
              placeholderTextColor={COLORS.textMuted}
              value={otherReason}
              onChangeText={setOtherReason}
            />
          </View>

          {/* File Attachment */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Attach Document</Text>
            <View style={styles.attachRow}>
              <TextInput
                style={[styles.baseInputBox, { flex: 1 }]}
                placeholder="No file chosen"
                placeholderTextColor={COLORS.textMuted}
                value={fileName}
                editable={false}
              />
              <TouchableOpacity style={styles.addFileButton} onPress={handlePickDocument}>
                <Text style={styles.addFileText}>Add File</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button (with Spinner) */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && { backgroundColor: "#8AB4F8" } // Lighter color when disabled
            ]}
            onPress={handleSubmit}
            disabled={loading} // Prevent double click
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>Submit</Text>
            )}
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* ✅ Render Android Pickers (Invisible logic hooks) */}
      {renderAndroidPickers()}

      {/* ✅ Render iOS Pickers (Modal Wrapped) */}
      {Platform.OS === "ios" && showStartPicker && (
        <Modal transparent animationType="fade">
          <View style={styles.modalBackground}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={tempStartDate}
                mode="date"
                display="spinner"
                minimumDate={new Date()}
                themeVariant="dark"
                textColor="#ffffff"
                onChange={(event, selected) => { if (selected) setTempStartDate(selected); }}
                style={{ width: "100%", height: 200 }}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                  <Text style={styles.cancelBtn}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmStartDate()}>
                  <Text style={styles.confirmBtn}>✔ OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === "ios" && showEndPicker && (
        <Modal transparent animationType="fade">
          <View style={styles.modalBackground}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={tempEndDate}
                mode="date"
                display="spinner"
                minimumDate={startDateObj} // Force valid date selection
                themeVariant="dark"
                textColor="#ffffff"
                onChange={(event, selected) => { if (selected) setTempEndDate(selected); }}
                style={{ width: "100%", height: 200 }}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                  <Text style={styles.cancelBtn}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmEndDate()}>
                  <Text style={styles.confirmBtn}>✔ OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Reason Bottom Sheet */}
      <Modal visible={isReasonSheetVisible} animationType="slide" transparent onRequestClose={closeReasonSheet}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={closeReasonSheet}>
          <View style={styles.sheetContainer} onStartShouldSetResponder={() => true}>
            <Text style={styles.sheetTitle}>Reasons</Text>
            {REASONS.map((item) => (
              <TouchableOpacity key={item} style={styles.sheetItem} onPress={() => handleSelectReason(item)}>
                <Text style={styles.sheetItemText}>{item}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.moreInfoBtn} onPress={() => alert("More information page not implemented")}>
              <Text style={styles.moreInfoText}>More Information</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  scrollContent: { paddingHorizontal: 20, paddingVertical: 24 },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 13, color: COLORS.textMuted, marginBottom: 6, fontWeight: "500" },
  baseInputBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textDark,
    backgroundColor: "#FFFFFF",
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: "#FFFFFF",
  },
  input: { flex: 1, fontSize: 14, color: COLORS.textDark },
  icon: { fontSize: 18, marginLeft: 8 },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },
  dropdownText: { fontSize: 14, color: COLORS.textDark },
  dropdownIcon: { fontSize: 16, color: COLORS.textMuted },
  textArea: { height: 100, textAlignVertical: "top" },
  attachRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  addFileButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  addFileText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  
  // Submit button centered content for Spinner
  submitButton: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: 'center',
    minHeight: 48,
  },
  submitText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },

  // Modals & Sheets
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-end" },
  sheetContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheetTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12, color: COLORS.textDark },
  sheetItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  sheetItemText: { fontSize: 14, color: COLORS.textDark },
  moreInfoBtn: { paddingVertical: 14 },
  moreInfoText: { fontSize: 14, fontWeight: "600", color: COLORS.primary },
  modalBackground: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)" },
  modalContent: { backgroundColor: "#111", borderRadius: 10, padding: 20, width: "90%" },
  cancelBtn: { fontSize: 16, color: "#ff5555" },
  confirmBtn: { fontSize: 16, color: "#55ff55", fontWeight: "bold" },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
});

export default ApplyLeaveScreen;