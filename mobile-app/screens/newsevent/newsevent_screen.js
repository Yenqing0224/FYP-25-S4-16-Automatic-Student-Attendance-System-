import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const NewsEventsScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  // 1. STATE: Track which tab is active
  const [activeTab, setActiveTab] = useState('News'); // Default to Events as per your image

  // DATA: Events List (Matches your image)
  const eventsData = [
    {
      id: 1,
      title: "Orientation Week Kicks Off for New Students!",
      description: "A warm welcome event to help newcomers settle in.",
      time: "2 hours ago",
      fullDate: "5 Oct 2025",
      longDescription: "The annual Orientation Week began today with a vibrant start as new students arrived on campus for the first time. The programme opened with a guided campus tour led by student volunteers, giving newcomers a chance to familiarize themselves with key facilities such as the library, labs, student services, and study hubs.\n\nThroughout the day, club booths lined the central courtyard, showcasing more than 30 CCAs ranging from sports teams to interest groups. Representatives engaged with incoming students, sharing details about training schedules, upcoming events, and membership requirements.",
    },
    {
      id: 2,
      title: "Mid-Semester Break Schedule Released!",
      description: "Official holiday dates for students to plan ahead.",
      time: "8 hours ago",
      fullDate: "12 Oct 2025",
      longDescription: "The administration has officially released the schedule for the upcoming Mid-Semester break. Students are advised to check the portal for specific dates related to their faculties. The library will remain open with shortened hours during this period.",
    },
    {
      id: 3,
      title: "Campus Sustainability Drive Launches Next Monday",
      description: "A week-long campaign promoting eco-friendly habits",
      time: "5 Oct 2025",
      fullDate: "5 Oct 2025",
      longDescription: "Join us in making our campus greener! The Sustainability Drive will feature workshops on recycling, a zero-waste market, and tree-planting sessions near the sports complex. All students are invited to participate.",
    },
  ];

  // DATA: News List (Dummy data for the other tab)
  const newsData = [
    {
      id: 101,
      title: "New Science Block Construction Update",
      description: "Construction is 50% complete.",
      time: "1 day ago",
      fullDate: "4 Oct 2025",
      longDescription: "The new Science Block is progressing well...",
    },
    {
      id: 102,
      title: "Student Achievements in Hackathon",
      description: "Our team took 2nd place!",
      time: "3 days ago",
      fullDate: "2 Oct 2025",
      longDescription: "Congratulations to our CS team...",
    },
  ];

  // Helper to decide which list to show
  const currentItems = activeTab === 'Events' ? eventsData : newsData;

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView edges={['top']} style={styles.topSafeArea} />

      <View style={styles.contentContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#EAEAEA" />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Text style={styles.backArrow}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>News & Events</Text>
          <View style={{ width: 20 }} /> 
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.searchContainer}>
            <Text style={{ marginRight: 10 }}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/* 2. TAB TOGGLES: Now interactive */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={activeTab === 'News' ? styles.tabActive : styles.tabInactive}
              onPress={() => setActiveTab('News')}
            >
              <Text style={activeTab === 'News' ? styles.tabTextActive : styles.tabTextInactive}>News</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={activeTab === 'Events' ? styles.tabActive : styles.tabInactive}
              onPress={() => setActiveTab('Events')}
            >
              <Text style={activeTab === 'Events' ? styles.tabTextActive : styles.tabTextInactive}>Events</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listContainer}>
            {currentItems.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.card}
                // 3. NAVIGATION: Go to Detail Screen
                onPress={() => navigation.navigate('NewseventDetail', { item: item })}
              >
                <View style={styles.imagePlaceholder} />
                <View style={styles.textContainer}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDescription}>{item.description}</Text>
                  <Text style={styles.cardTime}>{item.time}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#fff' },
  topSafeArea: { flex: 0, backgroundColor: '#EAEAEA' },
  contentContainer: { flex: 1, backgroundColor: '#fff' },
  
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
  
  scrollContent: { paddingBottom: 20 },
  
  searchContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 45,
  },
  searchInput: { flex: 1, height: 40, color: '#000' },
  
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
    height: 40,
  },
  tabInactive: {
    flex: 1,
    backgroundColor: '#EAEAEA',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#333',
  },
  tabActive: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabTextInactive: { color: '#999', fontWeight: '700', fontSize: 15 },
  tabTextActive: { color: '#000', fontWeight: '700', fontSize: 15 },
  
  listContainer: { paddingHorizontal: 20 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#757575',
    borderRadius: 4,
    marginRight: 15,
  },
  textContainer: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  cardDescription: { fontSize: 12, color: '#333', marginBottom: 4 },
  cardTime: { fontSize: 10, color: '#555' },
});

export default NewsEventsScreen;