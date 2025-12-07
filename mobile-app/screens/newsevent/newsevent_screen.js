import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const NewsEventsScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('News');
  
  // STATE: Hold the real data from Server
  const [newsList, setNewsList] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ FIX 1: Use the correct URL endpoint defined in Django urls.py
  const API_URL = 'https://attendify-ekg6.onrender.com/api/newsevent/';

  // FETCH DATA ON LOAD
  useEffect(() => {
    fetchNewsAndEvents();
  }, []);

  const fetchNewsAndEvents = async () => {
    try {
      const response = await axios.get(API_URL);
      setNewsList(response.data.news);
      setEventsList(response.data.events);
    } catch (error) {
      console.error("Failed to fetch feed:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX 2: Search Filter Logic
  // First, pick the list based on the tab
  const rawItems = activeTab === 'Events' ? eventsList : newsList;
  
  // Then, filter that list based on the Search Text
  const currentItems = rawItems.filter(item => 
    item.title.toLowerCase().includes(searchText.toLowerCase())
  );

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView edges={['top']} style={styles.topSafeArea} />

      <View style={styles.contentContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#EAEAEA" />

        {/* --- HEADER --- */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Text style={styles.backArrow}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>News & Events</Text>
          <View style={{ width: 20 }} /> 
        </View>

        {/* --- LOADING STATE --- */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={{marginTop: 10}}>Loading updates...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            
            {/* SEARCH BAR */}
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

            {/* TAB TOGGLES */}
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={activeTab === 'News' ? styles.tabActive : styles.tabInactive}
                onPress={() => {
                    setActiveTab('News');
                    setSearchText(''); // Optional: Clear search when switching tabs
                }}
              >
                <Text style={activeTab === 'News' ? styles.tabTextActive : styles.tabTextInactive}>News</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={activeTab === 'Events' ? styles.tabActive : styles.tabInactive}
                onPress={() => {
                    setActiveTab('Events');
                    setSearchText('');
                }}
              >
                <Text style={activeTab === 'Events' ? styles.tabTextActive : styles.tabTextInactive}>Events</Text>
              </TouchableOpacity>
            </View>

            {/* LIST CONTENT */}
            <View style={styles.listContainer}>
              {currentItems.length === 0 ? (
                <Text style={styles.emptyText}>
                    {searchText ? `No results for "${searchText}"` : `No ${activeTab} found.`}
                </Text>
              ) : (
                currentItems.map((item) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.card}
                    onPress={() => navigation.navigate('NewseventDetail', { item: item })}
                  >
                    {/* Image Handling */}
                    {item.image_url ? (
                         <Image source={{ uri: item.image_url }} style={styles.cardImage} />
                    ) : (
                         <View style={styles.imagePlaceholder} />
                    )}

                    <View style={styles.textContainer}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardDescription} numberOfLines={2}>
                        {item.message || item.description}
                      </Text>
                      <Text style={styles.cardTime}>
                        {formatDate(activeTab === 'News' ? item.news_date : item.event_date)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>

          </ScrollView>
        )}
      </View>
    </View>
  );
};

// ... Styles remain exactly the same as your code ...
const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#fff' },
  topSafeArea: { flex: 0, backgroundColor: '#EAEAEA' },
  contentContainer: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  emptyText: { textAlign: 'center', marginTop: 20, color: '#777' },
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
  cardImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
    marginRight: 15,
    backgroundColor: '#ccc'
  },
  textContainer: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  cardDescription: { fontSize: 12, color: '#333', marginBottom: 4 },
  cardTime: { fontSize: 10, color: '#555' },
});

export default NewsEventsScreen;