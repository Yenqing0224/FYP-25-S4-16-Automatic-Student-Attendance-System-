import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// 1. Import the library
import { Calendar } from 'react-native-calendars';

const TimetableScreen = () => {
  const [activeTab, setActiveTab] = useState('Selected');
  // Track the selected date string
  const [selectedDate, setSelectedDate] = useState('2025-10-18');

  // 2. Define your events (Dots)
  // The library uses a specific format for marking dates
  const markedDates = {
    '2025-10-03': { dots: [{ key: '1', color: '#90CAF9' }, { key: '2', color: '#B39DDB' }] },
    '2025-10-06': { dots: [{ key: '3', color: '#90CAF9' }] },
    '2025-10-09': { dots: [{ key: '4', color: '#90CAF9' }, { key: '5', color: '#90CAF9' }] },
    '2025-10-12': { dots: [{ key: '6', color: '#CE93D8' }] },
    '2025-10-24': { dots: [{ key: '7', color: '#90CAF9' }] },
    // DYNAMIC: We add the 'selected: true' property to whichever day is clicked
    [selectedDate]: { 
      selected: true, 
      selectedColor: '#3F4E85', 
      dots: [{ key: 'selectedDot', color: '#fff' }] // White dot on selected day
    },
  };

  // Helper: Content for "Selected" View
  const renderSelectedContent = () => (
    <View>
      <Text style={styles.sectionDateTitle}>{selectedDate}</Text>
      
      <View style={[styles.eventCard, styles.cardBlue]}>
        <View style={styles.cardContent}>
          <Text style={styles.eventTitle}>CSIT123</Text>
          <Text style={styles.eventTime}>12.00pm - 3.00pm</Text>
          <Text style={styles.eventLoc}>Blk.A.1.17</Text>
        </View>
      </View>

      <View style={[styles.eventCard, styles.cardPurple]}>
        <View style={styles.cardContent}>
          <Text style={styles.eventTitle}>Group Meeting for CSIT123</Text>
          <Text style={styles.eventTime}>12.00pm - 3.00pm</Text>
          <Text style={styles.eventLoc}>Online discord</Text>
        </View>
        <View style={styles.plusIconCircle}>
          <Text style={styles.plusIconText}>+</Text>
        </View>
      </View>
    </View>
  );

  // Helper: Content for "Upcoming" View
  const renderUpcomingContent = () => (
    <View>
      <Text style={styles.sectionDateTitle}>Upcoming Events</Text>
      <View style={[styles.eventCard, { backgroundColor: '#FFF9C4' }]}>
        <View style={styles.cardContent}>
          <Text style={styles.eventTitle}>Final Exam</Text>
          <Text style={styles.eventTime}>9.00am - 12.00pm</Text>
          <Text style={styles.eventLoc}>Main Hall</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Timetable</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* 3. The Real Calendar Component */}
        <View style={styles.calendarCard}>
          <Calendar
            // Initially visible month
            current={'2025-10-01'}
            // Handler when day is pressed
            onDayPress={day => {
              setSelectedDate(day.dateString);
            }}
            // Enable Multi-dot marking
            markingType={'multi-dot'}
            markedDates={markedDates}
            
            // Visual Styling to match your design
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#000', // Mo, Tu, We color
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

        {/* Toggle Buttons */}
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
            onPress={() => setActiveTab('Upcoming')}
          >
            <Text style={activeTab === 'Upcoming' ? styles.activeText : styles.inactiveText}>
              Upcoming
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conditional Content */}
        {activeTab === 'Selected' ? renderSelectedContent() : renderUpcomingContent()}
        
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { paddingBottom: 20 },
  header: { padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  
  // Calendar Card
  calendarCard: { 
    backgroundColor: '#fff', 
    marginHorizontal: 10, 
    borderRadius: 20, 
    padding: 10,
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  
  // Toggle Styles
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#EAEAEA',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 30,
    padding: 2,
    height: 50,
  },
  toggleButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
  },
  activeBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  inactiveBtn: { backgroundColor: 'transparent' },
  activeText: { fontWeight: 'bold', color: '#000' },
  inactiveText: { fontWeight: 'bold', color: '#999' },

  // Content Styles
  sectionDateTitle: { fontSize: 18, fontWeight: 'bold', margin: 20, marginBottom: 10 },
  eventCard: { marginHorizontal: 20, borderRadius: 12, padding: 20, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between' },
  cardBlue: { backgroundColor: '#B3E5FC' },
  cardPurple: { backgroundColor: '#E1BEE7' },
  eventTitle: { fontWeight: 'bold', fontSize: 16 },
  eventTime: { fontSize: 14, marginTop: 4 },
  eventLoc: { fontSize: 14, color: '#555', marginTop: 2 },
  plusIconCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  plusIconText: { color: '#fff', fontWeight: 'bold', fontSize: 20, marginTop: -2 },
  cardContent: { flex: 1 }
});

export default TimetableScreen;