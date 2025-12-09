// mobile-app/screens/profile/applyLeave_screen.js
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const REASONS = ["Medical Leave", "In-Camp Training", "Others"];

// UI display format: dd-mm-yyyy
const formatDate = (date) => {
  const d = date instanceof Date ? date : new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

// API expects YYYY-MM-DD
const toApiDate = (date) => {
  if (!(date instanceof Date)) return "";
  return date.toISOString().split("T")[0];
};

// 🔗 your real POST endpoint
const API_URL = "https://attendify-ekg6.onrender.com/api/apply-leaves/";

const ApplyLeaveScreen = ({ navigation }) => {
  // -------- dates --------
  const [startDate, setStartDate] = useState(""); // display (dd-mm-yyyy)
  const [endDate, setEndDate] = useState("");

  const [startDateObj, setStartDateObj] = useState(new Date());
  const [endDateObj, setEndDateObj] = useState(new Date());

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date());

  // -------- file --------
  const [fileName, setFileName] = useState("No file chosen");
  const [fileUri, setFileUri] = useState(null);

  // -------- reason --------
  const [reason, setReason] = useState("");        // main category
  const [otherReason, setOtherReason] = useState(""); // extra details for "Others"
  const [isReasonSheetVisible, setIsReasonSheetVisible] = useState(false);

  // ---------- SUBMIT ----------
  const handleSubmit = async () => {
    // 1. Basic validations
    if (!startDate) {
      alert("Please select a start date.");
      return;
    }

    if (!endDate) {
      alert("Please select an end date.");
      return;
    }

    if (!reason) {
      alert("Please choose a reason.");
      return;
    }

    if (!fileUri) {
      alert("Please attach a supporting document.");
      return;
    }

    const trimmedOther = otherReason.trim();

    // 👇 What we send to API:
    // - reason      -> main category (from dropdown)
    // - description -> extra text (only if user typed something)
    const mainReason = reason; // e.g. "Medical Leave"
    const description =
      reason === "Others" && trimmedOther ? trimmedOther : "";

    // For UI summary on success screen
    const finalReason =
      reason === "Others" && trimmedOther
        ? `Others: ${trimmedOther}`
        : reason;

    try {
      // 2. Get current user
      const storedUser = await AsyncStorage.getItem("userInfo");
      if (!storedUser) {
        alert("No user found. Please log in again.");
        return;
      }
      const user = JSON.parse(storedUser); // should have user.id

      // 3. Build FormData exactly as backend expects
      const formData = new FormData();

      formData.append("user_id", String(user.id));                     // ✅ user_id
      formData.append("start_date", toApiDate(startDateObj));          // ✅ YYYY-MM-DD
      formData.append("end_date", toApiDate(endDateObj));             // ✅ YYYY-MM-DD
      formData.append("reason", mainReason);                           // ✅ main category
      formData.append("description", description);                     // ✅ extra details (can be "")

      // document (backend will receive but maybe not store)
      formData.append("document", {
        uri: fileUri,
        name: fileName,
        type: "application/pdf",
      });

      // 4. POST to backend
      await axios.post(API_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // 5. Go to success screen
      navigation.navigate("ApplyLeaveSuccess", {
        startDate,
        endDate,
        reason: finalReason, // pretty text for display
      });
    } catch (err) {
      console.error("Submit leave error:", err.response?.data || err);
      alert("Failed to submit leave. Please try again.");
    }
  };

  // ---------- START DATE PICKER ----------
  const openStartPicker = () => {
    setTempStartDate(startDateObj);
    setShowStartPicker(true);
  };

  const confirmStartDate = (dateParam) => {
    const finalDate = dateParam || tempStartDate;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const picked = new Date(finalDate);
    picked.setHours(0, 0, 0, 0);

    if (picked < today) {
      alert("Start date cannot be earlier than today.");
      return;
    }

    setStartDateObj(finalDate);
    setStartDate(formatDate(finalDate)); // dd-mm-yyyy
    setShowStartPicker(false);
  };

  const cancelStartPicker = () => {
    setShowStartPicker(false);
  };

  // ---------- END DATE PICKER ----------
  const openEndPicker = () => {
    const base = endDateObj < startDateObj ? startDateObj : endDateObj;
    setTempEndDate(base);
    setShowEndPicker(true);
  };

  const confirmEndDate = (dateParam) => {
    const finalDate = dateParam || tempEndDate;

    if (startDate && finalDate < startDateObj) {
      alert("End date cannot be earlier than the start date.");
      return;
    }

    setEndDateObj(finalDate);
    setEndDate(formatDate(finalDate));
    setShowEndPicker(false);
  };

  const cancelEndPicker = () => {
    setShowEndPicker(false);
  };

  // ---------- REASON SHEET ----------
  const openReasonSheet = () => setIsReasonSheetVisible(true);
  const closeReasonSheet = () => setIsReasonSheetVisible(false);

  const handleSelectReason = (value) => {
    setReason(value);
    closeReasonSheet();
  };

  // ---------- FILE PICKER (PDF only) ----------
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
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
        <Text style={styles.headerTitle}>Apply Leave</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Start Date */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Start Date</Text>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={styles.input}
              placeholder="dd-mm-yyyy"
              value={startDate}
              editable={false}
            />
            <TouchableOpacity onPress={openStartPicker}>
              <Text style={styles.icon}>📅</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* End Date */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>End Date</Text>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={styles.input}
              placeholder="dd-mm-yyyy"
              value={endDate}
              editable={false}
            />
            <TouchableOpacity onPress={openEndPicker}>
              <Text style={styles.icon}>📅</Text>
            </TouchableOpacity>
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
                !reason && { color: "#999" },
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
            value={otherReason}
            onChangeText={setOtherReason}
          />
        </View>

        {/* Attach document */}
        <View className="fieldGroup" style={styles.fieldGroup}>
          <Text style={styles.label}>Attach Document</Text>
          <View style={styles.attachRow}>
            <TextInput
              style={[styles.baseInputBox, { flex: 1 }]}
              placeholder="No file chosen"
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
      </ScrollView>

      {/* START DATE modal */}
      {showStartPicker && (
        <Modal transparent animationType="fade">
          <View style={styles.modalBackground}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={tempStartDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={new Date()}
                themeVariant="dark"
                textColor="#ffffff"
                onChange={(event, selected) => {
                  if (Platform.OS === "android") {
                    if (event.type === "set" && selected) {
                      setTempStartDate(selected);
                      confirmStartDate(selected);
                    } else {
                      cancelStartPicker();
                    }
                  } else {
                    if (selected) setTempStartDate(selected);
                  }
                }}
                style={{ width: "100%", height: 200 }}
              />

              {Platform.OS === "ios" && (
                <View style={styles.modalButtons}>
                  <TouchableOpacity onPress={cancelStartPicker}>
                    <Text style={styles.cancelBtn}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => confirmStartDate()}>
                    <Text style={styles.confirmBtn}>✔ OK</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* END DATE modal */}
      {showEndPicker && (
        <Modal transparent animationType="fade">
          <View style={styles.modalBackground}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={tempEndDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                themeVariant="dark"
                textColor="#ffffff"
                onChange={(event, selected) => {
                  if (Platform.OS === "android") {
                    if (event.type === "set" && selected) {
                      if (selected < startDateObj) {
                        alert(
                          "End date cannot be earlier than the start date."
                        );
                        return;
                      }
                      confirmEndDate(selected);
                    } else {
                      cancelEndPicker();
                    }
                  } else {
                    if (selected) setTempEndDate(selected);
                  }
                }}
                style={{ width: "100%", height: 200 }}
              />

              {Platform.OS === "ios" && (
                <View style={styles.modalButtons}>
                  <TouchableOpacity onPress={cancelEndPicker}>
                    <Text style={styles.cancelBtn}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => confirmEndDate()}>
                    <Text style={styles.confirmBtn}>✔ OK</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}

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

            <TouchableOpacity
              style={styles.moreInfoBtn}
              onPress={() =>
                alert("More information page not implemented")
              }
            >
              <Text style={styles.moreInfoText}>More Information</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ... keep your existing styles exactly as before ...
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#EAEAEA",
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backArrow: {
    fontSize: 24,
    color: "#333",
    fontWeight: "300",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 6,
  },
  baseInputBox: {
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#000",
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 40,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  icon: {
    fontSize: 16,
    marginLeft: 6,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 40,
    justifyContent: "space-between",
  },
  dropdownText: {
    fontSize: 14,
    color: "#000",
  },
  dropdownIcon: {
    fontSize: 16,
    color: "#333",
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
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: "#EAEAEA",
  },
  addFileText: {
    fontSize: 12,
    fontWeight: "600",
  },
  submitButton: {
    marginTop: 10,
    backgroundColor: "#D9D9D9",
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  submitText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
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
  },
  sheetItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sheetItemText: {
    fontSize: 14,
    color: "#000",
  },
  moreInfoBtn: {
    paddingVertical: 14,
  },
  moreInfoText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContent: {
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 20,
    width: "90%",
  },
  cancelBtn: {
    fontSize: 16,
    color: "#ff5555",
  },
  confirmBtn: {
    fontSize: 16,
    color: "#55ff55",
    fontWeight: "bold",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
});

export default ApplyLeaveScreen;
