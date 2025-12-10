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

const COLORS = {
  primary: '#3A7AFE',
  background: '#F5F7FB',
  card: '#FFFFFF',
  textDark: '#111827',
  textMuted: '#6B7280',
  border: '#D1D5DB',
  shadow: 'rgba(0,0,0,0.08)'
};

const NewsEventsScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('News');

  const [newsList, setNewsList] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = 'https://attendify-ekg6.onrender.com/api/newsevent/';

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

  const rawItems = activeTab === 'Events' ? eventsList : newsList;
  const currentItems = rawItems.filter(item =>
    item.title.toLowerCase().includes(searchText.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView edges={['top']} style={styles.topSafeArea} />

      <View style={styles.contentContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>{'<'}</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>News & Events</Text>

          <View style={{ width: 24 }} />
        </View>


        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ marginTop: 10, color: COLORS.textMuted }}>Loading updates...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>

            {/* SEARCH BAR */}
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search news or events"
                placeholderTextColor={COLORS.textMuted}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>

            {/* TAB SWITCHER */}
            <View style={styles.tabContainer}>
              {['News', 'Events'].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tabButton,
                    activeTab === tab && styles.activeTab
                  ]}
                  onPress={() => {
                    setActiveTab(tab);
                    setSearchText('');
                  }}
                >
                  <Text style={activeTab === tab ? styles.activeTabText : styles.inactiveTabText}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* LIST */}
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
                    onPress={() =>
                      navigation.navigate('NewseventDetail', { item })
                    }
                  >
                    {/* Image */}
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={styles.cardImage} />
                    ) : (
                      <View style={styles.imagePlaceholder} />
                    )}

                    {/* Text */}
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>{item.title}</Text>

                      <Text style={styles.cardDescription} numberOfLines={2}>
                        {item.message || item.description}
                      </Text>

                      <Text style={styles.cardDate}>
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


const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.background },
  topSafeArea: { backgroundColor: COLORS.background },

  contentContainer: { flex: 1 },

  header: {
    backgroundColor: '#F5F7FB',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E4',
  },

  backArrow: {
    fontSize: 26,
    fontWeight: '300',
    color: '#3A7AFE',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.4,
    marginRight: 24,
  },



  scrollContent: { paddingBottom: 20 },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* SEARCH BAR */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    margin: 20,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchIcon: { fontSize: 18, marginRight: 10, color: COLORS.textMuted },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.textDark },

  /* TABS */
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: COLORS.card,
    borderRadius: 30,
    overflow: 'hidden',
    height: 45,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  inactiveTabText: {
    color: COLORS.textMuted,
    fontWeight: '600',
    fontSize: 15,
  },

  /* LIST */
  listContainer: { paddingHorizontal: 20, marginTop: 10 },

  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: COLORS.textMuted,
    fontSize: 14,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  cardImage: {
    width: 65,
    height: 65,
    borderRadius: 10,
    marginRight: 14,
    backgroundColor: '#D1D5DB',
  },
  imagePlaceholder: {
    width: 65,
    height: 65,
    borderRadius: 10,
    marginRight: 14,
    backgroundColor: '#C7C9D1',
  },

  cardText: { flex: 1 },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  cardDate: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default NewsEventsScreen;