import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ✅ 1. Import AsyncStorage

const HomeScreen = ({ navigation }) => {
  
  // ✅ 2. State to hold the User Data
  const [user, setUser] = useState(null);

  // ✅ 3. Load User Data on Startup
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('userInfo');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log("HomeScreen loaded user:", parsedUser.username);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Failed to load user info:", error);
      }
    };

    loadUserInfo();
  }, []); // Run once when screen mounts

  // 4. REAL DATE LOGIC
  const [currentDate, setCurrentDate] = useState({ dayName: '', dateString: '' });

  useEffect(() => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();

    const dateString = `${day}-${month}-${year}`;
    setCurrentDate({ dayName, dateString });
  }, []);

  // 5. DASHBOARD DATA
  const dashboardData = {
    user: {
      // ✅ 6. Use the State (Fallback to "Student" if loading)
      name: user?.username || "Student", 
      attendanceRate: "83%",
      semesterRange: "Oct 2025 - Mar 2026",
    },
    todayClasses: [
      { 
        id: 1, 
        code: "CSIT123", 
        time: "12.00pm - 3.00pm", 
        venue: "Blk.A.1.17", 
        color: '#FFB6C1' 
      },
      { 
        id: 2, 
        code: "CSIT131", 
        time: "3.30pm - 6.30pm", 
        venue: "Blk.B.4.13", 
        color: '#FFE4B5' 
      },
    ],
    upcomingClasses: [
      { id: 101, date: "1 Nov", time: "8.30am - 11.30am", code: "CSIT111" },
      { id: 102, date: "3 Nov", time: "8.30am - 11.30am", code: "CSIT111" },
      { id: 103, date: "3 Nov", time: "6.30am - 9.30am", code: "Group Meeting" },
    ]
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* --- HEADER --- */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.greetingLabel}>Hello,</Text>
            {/* Display the Name */}
            <Text style={styles.greetingName}>{dashboardData.user.name}!</Text>
          </View>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{currentDate.dayName}</Text>
            <Text style={styles.dateText}>{currentDate.dateString}</Text>
          </View>
        </View>

        {/* --- ATTENDANCE --- */}
        <View style={styles.attendanceContainer}>
          <Text style={styles.attendanceTitle}>Attendance rate</Text>
          <Text style={styles.attendancePercentage}>{dashboardData.user.attendanceRate}</Text>
          <Text style={styles.attendanceSubtitle}>{dashboardData.user.semesterRange}</Text>
        </View>

        {/* --- TODAY'S CLASSES --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Today's Classes</Text>
        </View>

        <View style={styles.paddingContainer}>
          {dashboardData.todayClasses.map((item) => (
            <View 
              key={item.id} 
              style={[styles.todayCard, { backgroundColor: item.color }]}
            >
              <Text style={styles.cardTitle}>{item.code}</Text>
              <Text style={styles.cardDetail}>{item.time}</Text>
              <Text style={styles.cardDetail}>{item.venue}</Text>
            </View>
          ))}
        </View>

        {/* --- UPCOMING CLASSES --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Upcoming Classes</Text>
        </View>

        <ScrollView 
          horizontal={true} 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContainer}
        >
          {dashboardData.upcomingClasses.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.upcomingCard}
              onPress={() => navigation.navigate('Timetable')}
            >
              <Text style={styles.upcomingDate}>{item.date}</Text>
              <Text style={styles.upcomingDetail}>{item.time}</Text>
              <Text style={styles.upcomingDetail}>{item.code}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{ height: 40 }} /> 

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 20, 
  },
  paddingContainer: {
    paddingHorizontal: 20,
  },
  
  // --- Header Styles ---
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 20, 
  },
  greetingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  greetingName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textTransform: 'capitalize', // Makes "ali" look like "Ali"
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },

  // --- Attendance Styles ---
  attendanceContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  attendanceTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 5,
  },
  attendancePercentage: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
  },
  attendanceSubtitle: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },

  // --- Section Header Styles ---
  sectionHeader: {
    backgroundColor: '#E0E0E0', 
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },

  // --- Today's Classes Styles ---
  todayCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardDetail: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },

  // --- Upcoming Classes Styles ---
  horizontalScrollContainer: {
    paddingHorizontal: 20, 
  },
  upcomingCard: {
    backgroundColor: '#EAEAEA', 
    borderRadius: 10,
    padding: 15,
    width: 130, 
    marginRight: 15,
  },
  upcomingDate: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  upcomingDetail: {
    fontSize: 12,
    color: '#555',
    marginBottom: 2,
  },
});

export default HomeScreen;