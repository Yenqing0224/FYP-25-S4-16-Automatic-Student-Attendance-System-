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
  StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const BASE_URL = "https://attendify-ekg6.onrender.com";

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
  const [country, setCountry] = useState("Singapore"); // Default to Singapore
  const [streetAddress, setStreetAddress] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // To check for changes
  const initialValues = useRef(null);

  // 1️⃣ LOAD DATA
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const storedData = await AsyncStorage.getItem("userInfo");
        if (!storedData) return;

        const basicUser = JSON.parse(storedData);
        
        // Fetch full profile
        const res = await axios.get(`${BASE_URL}/api/profile/?id=${basicUser.id}`);
        const student = res.data;
        
        // ✅ CRITICAL FIX: Access fields from student.user, not student
        const user = student.user || {}; 

        // --- MAP DATA TO STATE ---
        
        // Read-Only
        setName(`${user.first_name} ${user.last_name}`);
        setCourse(student.programme); 
        setSchoolEmail(user.email);

        // Editable (Handle nulls)
        // ✅ Fix: Use user.phone_number matching your Django model
        setMobileNumber(user.phone_number || ""); 
        setPersonalEmail(user.personal_email || "");
        
        // ✅ Fix: Default to "Singapore" if empty so it shows as value, not placeholder
        setCountry(user.address_country || "Singapore"); 
        
        setStreetAddress(user.address_street || "");
        setUnitNumber(user.address_unit || "");
        setPostalCode(user.address_postal || "");

        // Save initial state to compare later
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
      const storedData = await AsyncStorage.getItem("userInfo");
      const basicUser = JSON.parse(storedData);

      // ✅ Send Payload to update-profile endpoint
      const payload = {
        user_id: basicUser.id,
        phone_number: mobileTrim,
        personal_email: personalEmailTrim,
        address_country: countryTrim,
        address_street: streetTrim,
        address_unit: unitTrim,
        address_postal: postalTrim,
      };

      await axios.patch(`${BASE_URL}/api/edit-profile/`, payload);

      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => navigation.goBack() }
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
      <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EAEAEA" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Avatar Placeholder */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarPlaceholder} />
        </View>

        {/* --- READ ONLY SECTION --- */}
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

        {/* --- EDITABLE SECTION --- */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            value={mobileNumber}
            onChangeText={setMobileNumber}
            placeholder="e.g. 8888 9999"
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
          />
        </View>

        <Text style={styles.sectionTitle}>Mailing Address</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Country</Text>
          <TextInput
            style={styles.input}
            value={country} // ✅ Shows "Singapore" as text value
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
          />
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Unit Number</Text>
            <TextInput
              style={styles.input}
              value={unitNumber}
              onChangeText={setUnitNumber}
              placeholder="#01-01"
            />
          </View>

          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Postal Code</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={postalCode}
              onChangeText={setPostalCode}
              placeholder="123456"
            />
          </View>
        </View>

        <TouchableOpacity 
            style={[styles.saveButton, saving && {opacity: 0.7}]} 
            onPress={handleSave}
            disabled={saving}
        >
          {saving ? (
             <ActivityIndicator color="#fff" />
          ) : (
             <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#EAEAEA",
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backArrow: { fontSize: 24, color: "#333", fontWeight: "300" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#000" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  avatarSection: { alignItems: "center", marginBottom: 20 },
  avatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: "#D9D9D9", marginBottom: 10,
  },
  
  formGroup: { marginBottom: 15 },
  label: { fontSize: 14, color: "#555", marginBottom: 6 },
  input: {
    height: 45, borderRadius: 8, borderWidth: 1, borderColor: "#CCC",
    paddingHorizontal: 12, fontSize: 15, color: "#000",
  },
  readOnlyInput: { backgroundColor: "#F0F0F0", color: "#777" },
  
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 10, marginBottom: 10 },
  formRow: { flexDirection: "row", justifyContent: "space-between" },
  
  saveButton: {
    marginTop: 20, backgroundColor: "#8E8E93", height: 50,
    borderRadius: 10, justifyContent: "center", alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default EditProfileScreen;