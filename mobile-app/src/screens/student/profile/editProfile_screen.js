import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../../api/api_client"; // 👈 Ensure this path matches your folder structure

const COLORS = {
  primary: "#3A7AFE",
  background: "#F5F7FB",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  borderSoft: "#E5E7EB",
};

const EditProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- READ ONLY FIELDS ---
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");

  // --- EDITABLE FIELDS ---
  const [mobileNumber, setMobileNumber] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");

  // Address
  const [country, setCountry] = useState("Singapore");
  const [streetAddress, setStreetAddress] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // To check for changes
  const initialValues = useRef(null);

  // 1️⃣ LOAD DATA
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // ✅ CORRECT: Use the GET endpoint to READ data
        const res = await api.get('/profile/');

        const student = res.data;
        const user = student.user || {};

        // --- MAP DATA TO STATE ---
        setName(`${user.first_name} ${user.last_name}`);
        setCourse(student.programme);
        setSchoolEmail(user.email);

        setMobileNumber(user.phone_number || "");
        setPersonalEmail(user.personal_email || "");
        setCountry(user.address_country || "Singapore");
        setStreetAddress(user.address_street || "");
        setUnitNumber(user.address_unit || "");
        setPostalCode(user.address_postal || "");

        initialValues.current = {
          mobileNumber: user.phone_number || "",
          personalEmail: user.personal_email || "",
          country: user.address_country || "Singapore",
          streetAddress: user.address_street || "",
          unitNumber: user.address_unit || "",
          postalCode: user.address_postal || "",
        };
      } catch (err) {
        console.error("Profile fetch error:", err);
        Alert.alert("Error", "Unable to load profile.");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigation]);

  // 2️⃣ SAVE DATA
  const handleSave = async () => {
    // Trim inputs
    const mobileTrim = mobileNumber.trim();
    const personalEmailTrim = personalEmail.trim();
    const countryTrim = country.trim();
    const streetTrim = streetAddress.trim();
    const unitTrim = unitNumber.trim();
    const postalTrim = postalCode.trim();

    // Basic Validation
    if (!mobileTrim || !personalEmailTrim || !streetTrim || !postalTrim) {
      Alert.alert("Missing Info", "Please fill in all required fields.");
      return;
    }

    // Check for changes
    const hasChanges =
      mobileTrim !== initialValues.current.mobileNumber ||
      personalEmailTrim !== initialValues.current.personalEmail ||
      countryTrim !== initialValues.current.country ||
      streetTrim !== initialValues.current.streetAddress ||
      unitTrim !== initialValues.current.unitNumber ||
      postalTrim !== initialValues.current.postalCode;

    if (!hasChanges) {
      navigation.goBack();
      return;
    }

    setSaving(true);

    try {
      // ✅ USES /edit-profile/ for SAVING
      const payload = {
        phone_number: mobileTrim,
        personal_email: personalEmailTrim,
        address_country: countryTrim,
        address_street: streetTrim,
        address_unit: unitTrim,
        address_postal: postalTrim,
      };

      const response = await api.patch('/edit-profile/', payload);

      Alert.alert("Success", response.data.message, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error("Update error:", err);
      Alert.alert("Error", "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          {/* ✅ FIXED SYNTAX ERROR HERE */}
          <Text style={{ marginTop: 10, color: COLORS.textMuted }}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* AVATAR CARD */}
        <View style={styles.card}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {name ? name.charAt(0).toUpperCase() : ""}
              </Text>
            </View>
          </View>
        </View>

        {/* BASIC INFO CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={name}
              editable={false}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Course</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={course}
              editable={false}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>School Email</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={schoolEmail}
              editable={false}
            />
          </View>
        </View>

        {/* CONTACT CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact Details</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              maxLength={8}
              placeholder="e.g. 8888 9999"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Personal Email</Text>
            <TextInput
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              value={personalEmail}
              onChangeText={setPersonalEmail}
              placeholder="e.g. john@gmail.com"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        </View>

        {/* ADDRESS CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mailing Address</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Country</Text>
            <TextInput
              style={styles.input}
              value={country}
              onChangeText={setCountry}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Street Address</Text>
            <TextInput
              style={styles.input}
              value={streetAddress}
              onChangeText={setStreetAddress}
              placeholder="e.g. Blk 123 Tampines St"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Unit Number (optional)</Text>
              <TextInput
                style={styles.input}
                value={unitNumber}
                onChangeText={setUnitNumber}
                placeholder="e.g. #05-12"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Postal Code</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={postalCode}
                onChangeText={setPostalCode}
                maxLength={6}
                placeholder="123456"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>
        </View>

        {/* SAVE BUTTON */}
        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    borderBottomColor: COLORS.borderSoft,
  },
  backArrow: { fontSize: 24, color: COLORS.textDark, fontWeight: "300" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.textDark },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  avatarSection: { alignItems: "center" },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#CBD5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1E1B4B",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 10,
  },

  formGroup: { marginBottom: 12 },
  label: { fontSize: 13, color: COLORS.textMuted, marginBottom: 4 },
  input: {
    height: 45,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    paddingHorizontal: 12,
    fontSize: 15,
    color: COLORS.textDark,
    backgroundColor: "#FFFFFF",
  },
  readOnlyInput: {
    backgroundColor: "#F3F4F6",
    color: COLORS.textMuted,
  },

  formRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  saveButton: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3A7AFE",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default EditProfileScreen;
