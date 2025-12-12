import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
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

const REASONS = ["Medical Leave", "Late", "Emergency", "Others"];

const API_URL = "https://attendify-ekg6.onrender.com/api/apply-appeals/";

const ApplyAppealScreen = ({ route, navigation }) => {
  // Get the class session data passed from ClassDetailScreen
  const { classSession } = route.params || {};

  // -------- file --------
  const [fileName, setFileName] = useState("No file chosen");
  const [fileUri, setFileUri] = useState(null);

  // -------- reason --------
  const [reason, setReason] = useState("");        
  const [otherReason, setOtherReason] = useState(""); 
  const [isReasonSheetVisible, setIsReasonSheetVisible] = useState(false);

  // ---------- SUBMIT ----------
  const handleSubmit = async () => {
    if (!reason) {
      alert("Please choose a reason.");
      return;
    }
    // Note: If document is optional for appeals, remove this check.
    // Based on your screenshot, it looks standard to require it.
    if (!fileUri) {
      alert("Please attach a supporting document.");
      return;
    }

    const trimmedOther = otherReason.trim();
    const mainReason = reason;
    // If "Others", we use the text box value as description
    const description = reason === "Others" && trimmedOther ? trimmedOther : "";

    try {
      const storedUser = await AsyncStorage.getItem("userInfo");
      if (!storedUser) {
        alert("No user found. Please log in again.");
        return;
      }
      const user = JSON.parse(storedUser);

      const formData = new FormData();
      formData.append("user_id", String(user.id));
      formData.append("session_id", String(classSession?.id)); 
      formData.append("reason", mainReason);
      formData.append("description", description);

      formData.append("document", {
        uri: fileUri,
        name: fileName,
        type: "application/pdf", // Adjust if allowing images
      });

      await axios.post(API_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Navigate to Success Screen
      navigation.navigate("ApplyAppealSuccess", {
        moduleCode: classSession?.module?.code,
        moduleName: classSession?.module?.name,
        reason: mainReason,
      });
      
    } catch (err) {
      console.error("Submit appeal error:", err.response?.data || err);
      alert("Failed to submit appeal. Please try again.");
    }
  };

  // ---------- REASON SHEET ----------
  const openReasonSheet = () => setIsReasonSheetVisible(true);
  const closeReasonSheet = () => setIsReasonSheetVisible(false);

  const handleSelectReason = (value) => {
    setReason(value);
    closeReasonSheet();
  };

  // ---------- FILE PICKER ----------
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"], // Allow PDF and Images
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setFileName(file.name || "Selected file");
      setFileUri(file.uri);
    } catch (err) {
      console.warn("Error picking document:", err);
      alert("Failed to pick file");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appeal</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formCard}>
          
          {/* Module (Read Only) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Module</Text>
            <View style={[styles.baseInputBox, { backgroundColor: '#F3F4F6' }]}>
              <Text style={{ color: COLORS.textDark, fontSize: 14 }}>
                {classSession?.module?.code} - {classSession?.module?.name}
              </Text>
            </View>
          </View>

          {/* Reason selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Reason</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={openReasonSheet}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !reason && { color: COLORS.textMuted },
                ]}
              >
                {reason || "Choose your reason"}
              </Text>
              <Text style={styles.dropdownIcon}>⌄</Text>
            </TouchableOpacity>
          </View>

          {/* If others, specify */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              If others, please specify (optional)
            </Text>
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

          {/* Attach document */}
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
              <TouchableOpacity
                style={styles.addFileButton}
                onPress={handlePickDocument}
              >
                <Text style={styles.addFileText}>Add File</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Reason bottom sheet */}
      <Modal
        visible={isReasonSheetVisible}
        animationType="slide"
        transparent
        onRequestClose={closeReasonSheet}
      >
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={closeReasonSheet}
        >
          <View
            style={styles.sheetContainer}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.sheetTitle}>Reasons</Text>

            {REASONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.sheetItem}
                onPress={() => handleSelectReason(item)}
              >
                <Text style={styles.sheetItemText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
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
  backArrow: {
    fontSize: 24,
    color: COLORS.textDark,
    fontWeight: "300",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
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
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 6,
    fontWeight: "500",
  },
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
  dropdownText: {
    fontSize: 14,
    color: COLORS.textDark,
  },
  dropdownIcon: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  attachRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addFileButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  addFileText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  submitText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: COLORS.textDark,
  },
  sheetItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sheetItemText: {
    fontSize: 14,
    color: COLORS.textDark,
  },
});

export default ApplyAppealScreen;