import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';

const TimetableScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Selected');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // --- 1. DATA: Class Details (The Source of Truth) ---
  // The dots will now be generated AUTOMATICALLY based on this list.
  const timetableData = {
    '2025-12-03': [
      { id: 103, title: "CSIT111 Lecture", time: "9.00am - 11.00am", location: "Lecture Hall 1", type: "blue" }
    ],
    '2025-12-06': [
      { id: 104, title: "CSIT123 Tutorial", time: "10.00am - 12.00pm", location: "Lab 2", type: "blue" }
    ],
    '2025-12-18': [
      { id: 101, title: "CSIT123", time: "12.00pm - 3.00pm", location: "Blk.A.1.17", type: "blue" },
      { id: 102, title: "Group Meeting", time: "3.00pm - 5.00pm", location: "Online Discord", type: "purple", hasPlusIcon: true }
    ],
    '2025-12-24': [
       { id: 105, title: "Consultation", time: "2.00pm - 3.00pm", location: "Office", type: "blue" }
    ]
  };

  const upcomingData = [
    { id: 201, title: "Final Exam", time: "9.00am - 12.00pm", location: "Main Hall", color: '#FFF9C4' },
    { id: 202, title: "Project Submission", time: "11.59pm", location: "Online Portal", color: '#FFB6C1' }
  ];

  // --- 2. LOGIC: Get Today's Date String ---
  const getTodayDate = () => {
    const now = new Date();
    // Returns format "YYYY-MM-DD"
    return now.toISOString().split('T')[0];
  };

  // --- 3. LOGIC: Auto-Generate Dots & Selection ---
  const getMarkedDates = () => {
    const marked = {};

    // A. Loop through data to place DOTS
    Object.keys(timetableData).forEach(date => {
      marked[date] = {
        dots: [{ key: 'class', color: '#90CAF9' }] // Default Blue dot for any class
      };
    });

    // B. Apply SELECTION style (Blue Box)
    // If the selected date exists in our map, keep its dot but turn it white.
    // If it doesn't exist, create a new entry for the blue box.
    if (marked[selectedDate]) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#3F4E85',
        dots: [{ key: 'class', color: '#ffffff' }] // White dot
      };
    } else {
      marked[selectedDate] = {
        selected: true,
        selectedColor: '#3F4E85',
      };
    }
    
    return marked;
  };

  const renderSelectedContent = () => {
    const classesForDay = timetableData[selectedDate] || [];

    return (
      <View>
        <Text style={styles.sectionDateTitle}>{selectedDate}</Text>
        {classesForDay.length > 0 ? (
          classesForDay.map((item) => (
            <View 
              key={item.id} 
              style={[
                styles.eventCard, 
                item.type === 'blue' ? styles.cardBlue : styles.cardPurple
              ]}
            >
              <View style={styles.cardContent}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventTime}>{item.time}</Text>
                <Text style={styles.eventLoc}>{item.location}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No classes scheduled for this day.</Text>
          </View>
        )}
      </View>
    );
  };

  const renderUpcomingContent = () => (
    <View>
      <Text style={styles.sectionDateTitle}>Upcoming Events</Text>
      {upcomingData.map((item) => (
        <View key={item.id} style={[styles.eventCard, { backgroundColor: item.color }]}>
          <View style={styles.cardContent}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventTime}>{item.time}</Text>
            <Text style={styles.eventLoc}>{item.location}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView edges={['top']} style={styles.topSafeArea} />
      <View style={styles.contentContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#EAEAEA" />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Text style={styles.backArrow}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Timetable</Text>
          <View style={{ width: 20 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.calendarCard}>
            <Calendar
              // Force calendar to show the month of the selected Date
              current={selectedDate} 
              onDayPress={day => {
                setSelectedDate(day.dateString);
                setActiveTab('Selected'); 
              }}
              markingType={'multi-dot'}
              markedDates={getMarkedDates()} // Dynamic Function
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#000',
                selectedDayBackgroundColor: '#3F4E85',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#3A7AFE',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                dotColor: '#00adf5',
                selectedDotColor: '#ffffff',
                arrowColor: 'black',
                monthTextColor: 'black',
                textDayFontWeight: '300',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 14
              }}
            />
          </View>

          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[
                styles.toggleButton, 
                activeTab === 'Selected' ? styles.activeBtn : styles.inactiveBtn
              ]}
              onPress={() => setActiveTab('Selected')}
            >
              <Text style={activeTab === 'Selected' ? styles.activeText : styles.inactiveText}>
                Selected
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.toggleButton, 
                activeTab === 'Upcoming' ? styles.activeBtn : styles.inactiveBtn
              ]}
              // ✅ INTERACTION FIX: Pressing Upcoming jumps to TODAY
              onPress={() => {
                setActiveTab('Upcoming');
                setSelectedDate(getTodayDate()); 
              }}
            >
              <Text style={activeTab === 'Upcoming' ? styles.activeText : styles.inactiveText}>
                Upcoming
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'Selected' ? renderSelectedContent() : renderUpcomingContent()}
          
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#fff' },
  topSafeArea: { flex: 0, backgroundColor: '#EAEAEA' },
  contentContainer: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 20 },
  header: { 
    backgroundColor: '#EAEAEA',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backArrow: { fontSize: 24, color: '#333', fontWeight: '300' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  calendarCard: { 
    backgroundColor: '#fff', 
    marginHorizontal: 10, 
    borderRadius: 20, 
    padding: 10,
    marginTop: 10,
    elevation: 2, 
    shadowColor: '#000', 
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#EAEAEA',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 30,
    padding: 2,
    height: 50,
  },
  toggleButton: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 28 },
  activeBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', elevation: 2 },
  inactiveBtn: { backgroundColor: 'transparent' },
  activeText: { fontWeight: 'bold', color: '#000' },
  inactiveText: { fontWeight: 'bold', color: '#999' },
  sectionDateTitle: { fontSize: 18, fontWeight: 'bold', margin: 20, marginBottom: 10 },
  eventCard: { marginHorizontal: 20, borderRadius: 12, padding: 20, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between' },
  cardBlue: { backgroundColor: '#B3E5FC' },
  cardPurple: { backgroundColor: '#E1BEE7' },
  cardContent: { flex: 1 },
  eventTitle: { fontWeight: 'bold', fontSize: 16 },
  eventTime: { fontSize: 14, marginTop: 4 },
  eventLoc: { fontSize: 14, color: '#555', marginTop: 2 },
  plusIconCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  plusIconText: { color: '#fff', fontWeight: 'bold', fontSize: 20, marginTop: -2 },
  emptyContainer: { alignItems: 'center', padding: 20 },
  emptyText: { color: '#999', fontSize: 16 }
});

export default TimetableScreen;