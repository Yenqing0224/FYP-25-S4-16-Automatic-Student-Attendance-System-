// screens/onboarding/welcome_screen.js
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PRIMARY = "#3A7AFE";
const BG = "#F5F7FB";

const SLIDES = (firstName) => [
  {
    key: "1",
    image: require("../../../assets/onboarding/download.jpeg"),
    title: `Welcome to Attendify, ${firstName} 👋`,
    description:
      "Your smart assistant for tracking attendance and staying on top of your academic schedule.",
  },
  {
    key: "2",
    image: require("../../../assets/onboarding/attendance.jpeg"),
    title: "Track Attendance Easily",
    description:
      "View your attendance rate, monitor modules and see which classes need extra attention.",
  },
  {
    key: "3",
    image: require("../../../assets/onboarding/timetable.jpeg"),
    title: "Manage Classes & Requests",
    description:
      "See today’s timetable, upcoming classes, and submit leave or appeals quickly — all in one place.",
  },
];

export default function WelcomeScreen({ navigation }) {
  const scrollRef = useRef(null);
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);

  const [firstName, setFirstName] = useState("Student");
  useEffect(() => {
    const loadUserName = async () => {
      const storedUser = await AsyncStorage.getItem("userInfo");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const rawName =
          parsed.username ||
          parsed.student_name ||
          parsed.name ||
          "Student";
        setFirstName(rawName.split(" ")[0]);
      }
    };
    loadUserName();
  }, []);

  const slides = SLIDES(firstName);

  const handleScroll = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const next = () => {
    if (currentIndex === slides.length - 1) {
      navigation.replace("MainTabs");
    } else {
      scrollRef.current?.scrollTo({
        x: (currentIndex + 1) * width,
        animated: true,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
    
      <View style={{ flex: 1 }}>
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
              <View style={styles.imageCard}>
                <Image source={slide.image} style={styles.image} />
              </View>

              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>
            </View>
          ))}
        </ScrollView>

       
        <TouchableOpacity style={styles.skipButton} onPress={() => navigation.replace("MainTabs")}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* BOTTOM SECTION */}
      <View style={styles.bottom}>
        {/* DOTS */}
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex && styles.dotActive]}
            />
          ))}
        </View>

 
        <TouchableOpacity style={styles.nextButton} onPress={next}>
          <Text style={styles.nextButtonText}>
            {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingBottom: 20,
  },

  slide: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 30,
  },

  imageCard: {
    width: "100%",
    height: 260,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 28,
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },

  image: {
    width: "88%",
    height: "88%",
    resizeMode: "contain",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
  },

  description: {
    fontSize: 15,
    color: "#444",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
  },

  skipButton: {
    position: "absolute",
    top: 15,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skipText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "600",
  },

  bottom: {
    paddingHorizontal: 28,
    paddingBottom: 10,
  },

  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 18,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: "#C6C6C6",
    marginHorizontal: 5,
  },
  dotActive: {
    width: 24,
    backgroundColor: PRIMARY,
  },

  nextButton: {
    backgroundColor: PRIMARY,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,

    shadowColor: PRIMARY,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },

  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
