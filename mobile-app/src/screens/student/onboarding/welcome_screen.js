// screens/student/onboarding/welcome_screen.js
import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Image,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const PRIMARY = "#3A7AFE";
const BG = "#F5F7FB";
const CARD = "#FFFFFF";
const TEXT = "#111827";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";

const ONBOARDING_KEY = "studentOnboardingSeen_v1";

const SLIDES = (firstName) => [
  {
    key: "1",
    image: require("../../../../assets/onboarding/download.jpeg"),
    title: `Welcome, ${firstName} 👋`,
    description: "Track attendance, view classes, and stay updated with announcements.",
    icon: "sparkles-outline",
  },
  {
    key: "2",
    image: require("../../../../assets/onboarding/attendance.jpeg"),
    title: "Attendance at a glance",
    description: "See your attendance rate and identify modules that need attention.",
    icon: "pie-chart-outline",
  },
  {
    key: "3",
    image: require("../../../../assets/onboarding/timetable.jpeg"),
    title: "Timetable + requests",
    description: "Check today’s & upcoming classes, submit leave or appeals quickly.",
    icon: "calendar-outline",
  },
];

export default function WelcomeScreen({ navigation }) {
  const scrollRef = useRef(null);
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [firstName, setFirstName] = useState("Student");

  useEffect(() => {
    (async () => {
      const storedUser = await AsyncStorage.getItem("userInfo");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const rawName = parsed.first_name || parsed.username || parsed.student_name || parsed.name || "Student";
        setFirstName(String(rawName).split(" ")[0]);
      }
    })();
  }, []);

  const slides = useMemo(() => SLIDES(firstName), [firstName]);

  const handleScroll = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "1");
    navigation.replace("HomeMain"); // ✅ go to home inside HomeStack
  };

  const next = () => {
    if (currentIndex === slides.length - 1) finish();
    else {
      scrollRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true });
    }
  };

  const back = () => {
    if (currentIndex === 0) return;
    scrollRef.current?.scrollTo({ x: (currentIndex - 1) * width, animated: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.brand}>Attendify</Text>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={finish}
          activeOpacity={0.85}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide) => (
          <View key={slide.key} style={[styles.slide, { width }]}>
            <View style={styles.heroCard}>
              <View style={styles.heroIcon}>
                <Ionicons name={slide.icon} size={18} color={PRIMARY} />
              </View>

              <View style={styles.imageCard}>
                <Image source={slide.image} style={styles.image} />
              </View>

              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom */}
      <View style={styles.bottom}>
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.secondaryBtn, currentIndex === 0 && { opacity: 0.4 }]}
            onPress={back}
            disabled={currentIndex === 0}
            activeOpacity={0.9}
          >
            <Ionicons name="chevron-back" size={18} color={PRIMARY} />
            <Text style={styles.secondaryText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryBtn} onPress={next} activeOpacity={0.9}>
            <Text style={styles.primaryText}>
              {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  topBar: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { fontSize: 14, fontWeight: "900", color: TEXT, letterSpacing: 0.2 },
  skipBtn: {
    position: "absolute",
    right: 18,
    top: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  skipText: {
    fontSize: 12,
    fontWeight: "800",
    color: PRIMARY,
  },

  slide: { paddingHorizontal: 18, paddingTop: 8 },
  heroCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 18,
  },

  heroIcon: {
    alignSelf: "flex-start",
    backgroundColor: "#E7F0FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  imageCard: {
    height: 250,
    borderRadius: 18,
    backgroundColor: "#F3F6FF",
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  image: { width: "90%", height: "90%", resizeMode: "contain" },

  title: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: "900",
    color: TEXT,
    textAlign: "center",
  },
  description: {
    marginTop: 10,
    fontSize: 14,
    color: MUTED,
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 6,
    fontWeight: "600",
  },

  bottom: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 18 },

  dotsRow: { flexDirection: "row", justifyContent: "center", marginBottom: 14, gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 6, backgroundColor: "#C9D2E3" },
  dotActive: { width: 26, backgroundColor: PRIMARY },

  btnRow: { flexDirection: "row", gap: 10 },
  secondaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#E7F0FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryText: { color: PRIMARY, fontWeight: "900", fontSize: 14 },

  primaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryText: { color: "#fff", fontWeight: "900", fontSize: 14 },
});
