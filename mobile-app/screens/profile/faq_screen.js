import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// Enable smooth animation on Android
if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const COLORS = {
  background: "#F5F7FB",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  primary: "#3A7AFE",
  borderSoft: "#E5E7EB",
};

// ✅ STATIC DATA (No Database needed)
const FAQ_CATEGORIES = [
  {
    title: "Attendance & Detection",
    items: [
      {
        q: "How do I register attendance?",
        a: "Attendance is automatically recorded via facial recognition at lecture hall entrances and Bluetooth signals in classrooms. No manual check-in is required.",
      },
      {
        q: "What if facial recognition doesn’t detect me?",
        a: "If facial recognition fails, Bluetooth verification inside the classroom will confirm your presence. Ensure Bluetooth remains turned on.",
      },
      {
        q: "Do I need to keep Bluetooth turned on?",
        a: "Yes. Bluetooth allows the system to verify that you are inside the classroom. It reduces false absences and ensures accurate attendance tracking.",
      },
      {
        q: "What if my phone battery is flat?",
        a: "If your phone is off, the system cannot detect you. Inform your lecturer and submit an attendance appeal if necessary.",
      },
    ],
  },
  {
    title: "Late Attendance & Absences",
    items: [
      {
        q: "Am I marked absent if I enter class late?",
        a: "The system will still detect you when you enter the classroom, but late attendance is subject to your lecturer’s policy.",
      },
      {
        q: "What if I leave the classroom halfway?",
        a: "Your attendance may be flagged as incomplete. Continuous presence is required for full attendance.",
      },
      {
        q: "I forgot to turn on Bluetooth. What should I do?",
        a: "Turn it on immediately. If detection still fails, you may need to submit an appeal.",
      },
      {
        q: "What counts as a valid excuse for absence?",
        a: "Medical certificates, approved school events, emergencies, or unavoidable circumstances.",
      },
    ],
  },
  {
    title: "Leave of Absence (LOA)",
    items: [
      {
        q: "How do I apply for leave of absence (LOA)?",
        a: "Go to Profile → Apply Leave. Fill in dates, select a reason, upload documents, and submit.",
      },
      {
        q: "How long does LOA approval take?",
        a: "Most LOA requests are processed within 2–3 working days.",
      },
      {
        q: "Can I edit my LOA after submission?",
        a: "No. Please cancel and submit a new LOA request if changes are needed.",
      },
      {
        q: "Do I need medical documents for sick leave?",
        a: "Yes, a valid medical certificate is required to approve medical leave.",
      },
    ],
  },
  {
    title: "Appeals",
    items: [
      {
        q: "How do I appeal my attendance?",
        a: "Go to Appeals & Leave Status → select lesson → submit your reason and supporting documents.",
      },
      {
        q: "How long do attendance appeals take?",
        a: "Appeals are usually reviewed within 2–5 working days.",
      },
      {
        q: "What documents do I need for an appeal?",
        a: "Medical certificates, screenshots, travel proofs, or technical issue evidence.",
      },
      {
        q: "Will I be notified when my appeal is approved?",
        a: "Yes, you will receive an in-app notification once your appeal is processed.",
      },
    ],
  },
  {
    title: "Technical Issues",
    items: [
      {
        q: "What if the app fails to load?",
        a: "Restart the app, check your internet connection, and ensure your app is updated.",
      },
      {
        q: "Does Low Power Mode affect attendance tracking?",
        a: "Yes. Low Power Mode may disable Bluetooth scanning. Turn it off during class.",
      },
      {
        q: "Will VPN affect attendance detection?",
        a: "Yes. VPN may disrupt Bluetooth and network syncing. Avoid using VPN during class.",
      },
      {
        q: "I changed phones. Do I need to reconfigure anything?",
        a: "Just log in on your new device. Ensure Bluetooth is on during class.",
      },
    ],
  },
  {
    title: "Security & Privacy",
    items: [
      {
        q: "Who can access my attendance data?",
        a: "Only authorised lecturers, programme coordinators, and system administrators.",
      },
      {
        q: "Is my facial data stored permanently?",
        a: "No. Facial templates are processed securely and removed after the retention period.",
      },
      {
        q: "Does the system track my location?",
        a: "No. Attendance only detects Bluetooth proximity within the classroom.",
      },
      {
        q: "Does the app drain my battery?",
        a: "The app uses Bluetooth Low Energy (BLE), which consumes minimal power.",
      },
    ],
  },
];

export default function FAQScreen({ navigation }) {
  const [openCategories, setOpenCategories] = useState({});
  const [openQuestions, setOpenQuestions] = useState({});

  const toggleCategory = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenCategories((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleQuestion = (catIndex, qIndex) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const key = `${catIndex}-${qIndex}`;
    setOpenQuestions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & FAQ</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* SMALL SUBHEADER */}
      <View style={styles.subHeader}>
        <Text style={styles.subHeaderText}>
          Find answers to common questions about attendance, leave and appeals.
        </Text>
      </View>

      {/* CONTENT */}
      <ScrollView contentContainerStyle={styles.scroll}>
        {FAQ_CATEGORIES.map((cat, catIndex) => {
          const catOpen = !!openCategories[catIndex];

          return (
            <View key={catIndex} style={styles.categoryCard}>
              {/* CATEGORY HEADER */}
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(catIndex)}
              >
                <View style={styles.categoryTitleRow}>
                  <View style={styles.categoryIconCircle}>
                    <Ionicons name="help-circle-outline" size={16} color={COLORS.primary} />
                  </View>
                  <Text style={styles.categoryTitle}>{cat.title}</Text>
                </View>

                <Ionicons
                  name={catOpen ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#4B5563"
                />
              </TouchableOpacity>

              {/* QUESTIONS */}
              {catOpen && (
                <View style={styles.questionList}>
                  {cat.items.map((item, qIndex) => {
                    const key = `${catIndex}-${qIndex}`;
                    const qOpen = !!openQuestions[key];

                    return (
                      <View
                        key={qIndex}
                        style={[
                          styles.questionSection,
                          qIndex !== 0 && styles.questionDivider,
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.questionRow}
                          onPress={() => toggleQuestion(catIndex, qIndex)}
                        >
                          <Text style={styles.questionText}>{item.q}</Text>
                          <Ionicons
                            name={qOpen ? "chevron-up" : "chevron-down"}
                            size={18}
                            color="#6B7280"
                          />
                        </TouchableOpacity>

                        {qOpen && <Text style={styles.answerText}>{item.a}</Text>}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    backgroundColor: COLORS.background,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderSoft,
  },
  backArrow: { fontSize: 24, color: COLORS.textDark, fontWeight: "300" },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textDark,
  },

  subHeader: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
  },
  subHeaderText: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },

  scroll: {
    padding: 16,
    paddingBottom: 40,
  },

  categoryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 5,
  },

  categoryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  categoryIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E0ECFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  categoryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
  },

  questionList: {
    marginTop: 10,
  },

  questionSection: {
    paddingVertical: 10,
  },

  questionDivider: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSoft,
  },

  questionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  questionText: {
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
    marginRight: 10,
    color: "#111827",
  },

  answerText: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
});