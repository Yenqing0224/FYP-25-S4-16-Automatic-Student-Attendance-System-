// screens/profile/changePassword_screen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../../api/api_client";

const ChangePasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Password mismatch", "New passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/change-password/", {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      Alert.alert("Success", response.data.message || "Updated successfully.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.log("ChangePassword error:", err.response?.data || err);
      const errorMessage =
        err.response?.data?.error || "Failed to change password.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled =
    !currentPassword || !newPassword || !confirmPassword || loading;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Section */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Text style={styles.backArrow}>{"<"}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.headerTitle}>Change Password</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor="#A0A0A0"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor="#A0A0A0"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                placeholderTextColor="#A0A0A0"
              />
            </View>

            {/* Button Container */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.saveButton, isDisabled && { opacity: 0.5 }]}
                onPress={handleChangePassword}
                disabled={isDisabled}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  
  scrollContent: {
    paddingHorizontal: 25,
    paddingBottom: 40,
  },
  header: {
    marginTop: 10,
    marginBottom: 10,
    alignItems: "flex-start",
  },
  backButton: {
    padding: 10,
    marginLeft: -10,
  },
  backArrow: {
    fontSize: 28,
    color: "#000",
    fontWeight: "300",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 30,
    marginTop: 10,
  },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#000",
  },
  buttonContainer: {
    marginTop: 30,
  },
  // 👇 Updated to match ApplyLeaveScreen Submit Button UI
  saveButton: {
    marginTop: 8,
    backgroundColor: "#3A7AFE", // COLORS.primary
    paddingVertical: 12,        // Matches Apply Leave padding
    borderRadius: 999,          // Matches Apply Leave pill shape
    alignItems: "center",
    alignSelf: "stretch",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,       // Matches Apply Leave font size
    fontWeight: "700",  // Matches Apply Leave weight
  },
});

export default ChangePasswordScreen;