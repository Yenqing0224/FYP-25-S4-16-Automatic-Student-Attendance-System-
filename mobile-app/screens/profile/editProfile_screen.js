import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const PROFILE_API_URL = "https://attendify-ekg6.onrender.com/api/profile/";

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

  // non-editable fields
  const [name, setName] = useState("");
  const [course, setCourse] = useState("Bachelor of Computer Science (Big Data)");
  const [schoolEmail, setSchoolEmail] = useState("");

  // editable fields
  const [mobileNumber, setMobileNumber] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [country, setCountry] = useState("Singapore");
  const [streetAddress, setStreetAddress] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const initialValues = useRef(null);

  // 1️⃣ Load existing data from API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const storedData = await AsyncStorage.getItem("userInfo");
        if (!storedData) {
          Alert.alert("Error", "No user found. Please log in again.");
          navigation.goBack();
          return;
        }

        const basicUser = JSON.parse(storedData);
        const res = await axios.get(`${PROFILE_API_URL}?id=${basicUser.id}`);
        const student = res.data;

        setName(student.user?.username || "");
        setCourse(student.programme || "Bachelor of Computer Science (Big Data)");
        setSchoolEmail(student.user?.email || "");

        setMobileNumber(student.mobile_number || "");
        setPersonalEmail(student.personal_email || "");
        setCountry(student.country || "Singapore");
        setStreetAddress(student.street_address || "");
        setUnitNumber(student.unit_number || "");
        setPostalCode(student.postal_code || "");

        initialValues.current = {
          mobileNumber: student.mobile_number || "",
          personalEmail: student.personal_email || "",
          country: student.country || "Singapore",
          streetAddress: student.street_address || "",
          unitNumber: student.unit_number || "",
          postalCode: student.postal_code || "",
        };
      } catch (err) {
        console.log("Profile fetch error:", err.response?.data || err);
        Alert.alert("Error", "Unable to load profile.");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <Text style={{ padding: 20 }}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    const mobileTrim = mobileNumber.trim();
    const personalEmailTrim = personalEmail.trim();
    const countryTrim = country.trim();
    const streetTrim = streetAddress.trim();
    const unitTrim = unitNumber.trim();
    const postalTrim = postalCode.trim();

    if (
      !mobileTrim ||
      !personalEmailTrim ||
      !countryTrim ||
      !streetTrim ||
      !postalTrim
    ) {
      Alert.alert(
        "Missing information",
        "Please fill in all the required fields."
      );
      return;
    }

    const phoneRegex = /^\d{8}$/;
    if (!phoneRegex.test(mobileTrim)) {
      Alert.alert(
        "Invalid mobile number",
        "Mobile number must be exactly 8 digits."
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personalEmailTrim)) {
      Alert.alert(
        "Invalid personal email",
        "Please enter a valid email address."
      );
      return;
    }

    const hasChanges =
      !initialValues.current ||
      mobileTrim !== initialValues.current.mobileNumber ||
      personalEmailTrim !== initialValues.current.personalEmail ||
      countryTrim !== initialValues.current.country ||
      streetTrim !== initialValues.current.streetAddress ||
      unitTrim !== initialValues.current.unitNumber ||
      postalTrim !== initialValues.current.postalCode;

    if (!hasChanges) {
      Alert.alert("No changes", "You have not made any changes.");
      return;
    }

    Alert.alert(
      "Confirm changes",
      "Do you want to save these changes to your profile?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              const storedData = await AsyncStorage.getItem("userInfo");
              const basicUser = JSON.parse(storedData);

              await axios.patch(
                `https://attendify-ekg6.onrender.com/api/profile/${basicUser.id}/`,
                {
                  mobile_number: mobileTrim,
                  personal_email: personalEmailTrim,
                  country: countryTrim,
                  street_address: streetTrim,
                  unit_number: unitTrim,
                  postal_code: postalTrim,
                }
              );

              Alert.alert("Saved", "Your profile has been updated.");
              navigation.goBack();
            } catch (err) {
              console.log("Profile update error:", err.response?.data || err);
              Alert.alert("Error", "Failed to update profile.");
            }
          },
        },
      ]
    );
  };

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
            <TouchableOpacity>
              <Text style={styles.changePhotoText}>Change profile picture</Text>
            </TouchableOpacity>
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
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Unit Number (optional)</Text>
              <TextInput
                style={styles.input}
                value={unitNumber}
                onChangeText={setUnitNumber}
                placeholder="e.g. #05-12 (optional)"
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
              />
            </View>
          </View>
        </View>

        {/* SAVE BUTTON */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save changes</Text>
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
  changePhotoText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "600",
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