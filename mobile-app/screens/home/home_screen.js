import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Main Content ScrollView */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Top Header Section */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.greetingLabel}>Hello,</Text>
            <Text style={styles.greetingName}>Moses Lim!</Text>
          </View>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>Tuesday</Text>
            <Text style={styles.dateText}>31-Oct-2025</Text>
          </View>
        </View>

        {/* Attendance Section */}
        <View style={styles.attendanceContainer}>
          <Text style={styles.attendanceTitle}>Attendance rate</Text>
          <Text style={styles.attendancePercentage}>83%</Text>
          <Text style={styles.attendanceSubtitle}>Oct 2025 - Mar 2026</Text>
        </View>

        {/* Today's Classes Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Today's Classes</Text>
        </View>

        {/* Today's Classes List */}
        <View style={styles.paddingContainer}>
          {/* Pink Card */}
          <View style={[styles.todayCard, styles.cardPink]}>
            <Text style={styles.cardTitle}>CSIT123</Text>
            <Text style={styles.cardDetail}>12.00pm - 3.00pm</Text>
            <Text style={styles.cardDetail}>Blk.A.1.17</Text>
          </View>

          {/* Yellow Card */}
          <View style={[styles.todayCard, styles.cardYellow]}>
            <Text style={styles.cardTitle}>CSIT131</Text>
            <Text style={styles.cardDetail}>3.30pm - 6.30pm</Text>
            <Text style={styles.cardDetail}>Blk.B.4.13</Text>
          </View>
        </View>

        {/* Upcoming Classes Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Upcoming Classes</Text>
        </View>

        {/* Upcoming Classes Horizontal Scroll */}
        <ScrollView 
          horizontal={true} 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContainer}
        >
          {/* Upcoming Card 1 */}
          <View style={styles.upcomingCard}>
            <Text style={styles.upcomingDate}>1 Nov</Text>
            <Text style={styles.upcomingDetail}>8.30am - 11.30am</Text>
            <Text style={styles.upcomingDetail}>CSIT111</Text>
          </View>

           {/* Upcoming Card 2 */}
           <View style={styles.upcomingCard}>
            <Text style={styles.upcomingDate}>3 Nov</Text>
            <Text style={styles.upcomingDetail}>8.30am - 11.30am</Text>
            <Text style={styles.upcomingDetail}>CSIT111</Text>
          </View>

           {/* Upcoming Card 3 */}
           <View style={styles.upcomingCard}>
            <Text style={styles.upcomingDate}>3 Nov</Text>
            <Text style={styles.upcomingDetail}>6.30am - 9.30am</Text>
            <Text style={styles.upcomingDetail}>Group Meeting</Text>
          </View>
        </ScrollView>

        <View style={{ height: 40 }} /> 

      </ScrollView>
    </SafeAreaView>
  );
};

// Styles definition
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
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 16,
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
  cardPink: {
    backgroundColor: '#FFB6C1', 
  },
  cardYellow: {
    backgroundColor: '#FFE4B5', 
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