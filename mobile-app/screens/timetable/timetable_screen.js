import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

const TimetableScreen = () => {
  // Mock data to represent the calendar grid in the image
  // 0 = empty/padding, numbers are days.
  // We strictly follow the image's layout (Oct 1 on Monday).
  const calendarRows = [
    [1, 2, 3, 4, 5, 6, 7],
    [8, 9, 10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19, 20, 21],
    [22, 23, 24, 25, 26, 27, 28],
    [29, 30, 31, 1, 2, 3, 4], // Last 4 are next month
  ];

  // Configuration for the dots under dates
  // type: 'blue' or 'purple'
  const events = {
    3:  [{ color: '#90CAF9' }, { color: '#B39DDB' }], // simplified colors for demo
    6:  [{ color: '#90CAF9' }],
    9:  [{ color: '#90CAF9' }, { color: '#90CAF9' }],
    12: [{ color: '#CE93D8' }],
    18: [{ color: '#fff' }, { color: '#fff' }], // Selected day has white dots
    19: [{ color: '#90CAF9' }, { color: '#B39DDB' }],
    24: [{ color: '#90CAF9' }],
    25: [{ color: '#90CAF9' }],
    28: [{ color: '#CE93D8' }],
  };

  const renderCalendarDay = (day, rowIndex, colIndex) => {
    // Determine if this is the "Next Month" section (last row, indices > 2)
    const isNextMonth = rowIndex === 4 && colIndex > 2;
    const isSelected = day === 18 && !isNextMonth;
    
    // Styling logic
    let dayContainerStyle = styles.dayContainer;
    let textStyle = styles.dayText;

    if (isSelected) {
      dayContainerStyle = [styles.dayContainer, styles.selectedDayContainer];
      textStyle = styles.selectedDayText;
    } else if (isNextMonth) {
      dayContainerStyle = [styles.dayContainer, styles.nextMonthDayContainer];
      textStyle = styles.nextMonthDayText;
    }

    return (
      <View key={`${rowIndex}-${colIndex}`} style={styles.dayWrapper}>
        <View style={dayContainerStyle}>
          <Text style={textStyle}>{day}</Text>
          
          {/* Render Dots */}
          {!isNextMonth && events[day] && (
            <View style={styles.dotsContainer}>
              {events[day].map((dot, index) => (
                <View 
                  key={index} 
                  style={[styles.dot, { backgroundColor: dot.color }]} 
                />
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Header Bar */}
      <View style={styles.header}>
        <Text style={styles.backArrow}>{'<'}</Text>
        <Text style={styles.headerTitle}>Timetable</Text>
        <View style={{ width: 20 }} />{/* Spacer to balance center title */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* 2. Calendar Section */}
        <View style={styles.calendarCard}>
          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <Text style={styles.navArrow}>{'<'}</Text>
            <Text style={styles.monthTitle}>Oct 2025</Text>
            <Text style={styles.navArrow}>{'>'}</Text>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekRow}>
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
              <Text key={day} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.gridContainer}>
            {calendarRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((day, colIndex) => renderCalendarDay(day, rowIndex, colIndex))}
              </View>
            ))}
          </View>
        </View>

        {/* 3. Toggle Segment (Selected / Upcoming) */}
        <View style={styles.toggleContainer}>
          <View style={styles.toggleButtonInactive}>
            <Text style={styles.toggleTextInactive}>Selected</Text>
          </View>
          <View style={styles.toggleButtonActive}>
            <Text style={styles.toggleTextActive}>Upcoming</Text>
          </View>
        </View>

        {/* 4. Date Title */}
        <Text style={styles.sectionDateTitle}>18 Oct 2025</Text>

        {/* 5. Event Cards */}
        {/* Blue Card */}
        <View style={[styles.eventCard, styles.cardBlue]}>
          <View style={styles.cardContent}>
            <Text style={styles.eventTitle}>CSIT123</Text>
            <Text style={styles.eventTime}>12.00pm - 3.00pm</Text>
            <Text style={styles.eventLoc}>Blk.A.1.17</Text>
          </View>
        </View>

        {/* Purple Card */}
        <View style={[styles.eventCard, styles.cardPurple]}>
          <View style={styles.cardContent}>
            <Text style={styles.eventTitle}>Group Meeting for CSIT123</Text>
            <Text style={styles.eventTime}>12.00pm - 3.00pm</Text>
            <Text style={styles.eventLoc}>Online discord</Text>
          </View>
          {/* Plus Icon Circle */}
          <View style={styles.plusIconCircle}>
            <Text style={styles.plusIconText}>+</Text>
          </View>
        </View>
        
        <View style={{height: 30}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Light gray background for the top area
  },
  scrollContent: {
    paddingBottom: 20,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backArrow: {
    fontSize: 24,
    color: '#333',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },

  // Calendar Card
  calendarCard: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    borderRadius: 20,
    paddingBottom: 20,
    paddingTop: 10,
    // Add Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  navArrow: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  weekDayText: {
    width: 30,
    textAlign: 'center',
    fontWeight: '600',
    color: '#000',
    fontSize: 14,
  },
  gridContainer: {
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  dayWrapper: {
    width: 35,
    alignItems: 'center',
  },
  dayContainer: {
    width: 32,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  dayText: {
    fontSize: 15,
    color: '#333',
  },
  
  // States
  selectedDayContainer: {
    backgroundColor: '#3F4E85', // Dark Blue/Purple
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  nextMonthDayContainer: {
    backgroundColor: '#F2F4F8', // Light Gray Box
    width: 48, // The gray boxes in image look wider/connected
    borderRadius: 0, // Looks like a continuous block in the image row? 
    // Actually in the image they look like individual light boxes.
    // Let's keep them distinct but styled.
  },
  nextMonthDayText: {
    color: '#B0B0B0',
  },
  
  // Dots
  dotsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },

  // Toggle Section
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#000',
    height: 50,
    overflow: 'hidden',
  },
  toggleButtonInactive: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAEAEA', // Gray side
  },
  toggleTextInactive: {
    color: '#A0A0A0',
    fontWeight: '700',
    fontSize: 15,
  },
  toggleButtonActive: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff', // White side
    borderLeftWidth: 1,
    borderLeftColor: '#000',
  },
  toggleTextActive: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },

  // Event List
  sectionDateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 10,
    color: '#000',
  },
  eventCard: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBlue: {
    backgroundColor: '#B3E5FC', // Light Cyan
  },
  cardPurple: {
    backgroundColor: '#E1BEE7', // Light Purple
  },
  cardContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  eventLoc: {
    fontSize: 14,
    color: '#333',
  },
  plusIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIconText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: -2,
  },
});

export default TimetableScreen;