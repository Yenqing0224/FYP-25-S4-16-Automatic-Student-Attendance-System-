import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const NotificationScreen = ({ navigation }) => {
  
  // 1. STATE Management
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const API_URL = 'https://attendify-ekg6.onrender.com/api/notifications/';

  // 2. FETCH DATA on Load
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      // Get User ID from Storage
      const storedData = await AsyncStorage.getItem('userInfo');
      if (storedData) {
        const user = JSON.parse(storedData);
        setUserId(user.id); // Save ID for later use

        // Call API
        const response = await axios.get(`${API_URL}?user_id=${user.id}`);
        setNotifications(response.data);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. MARK ALL AS READ FUNCTION
  const handleMarkAllRead = async () => {
    if (!userId) return;

    // A. Optimistic Update (Update UI immediately so it feels fast)
    const updatedList = notifications.map(item => ({ ...item, is_read: true }));
    setNotifications(updatedList);

    try {
      // B. Send Request to Backend
      await axios.post(`${API_URL}mark-read/`, { user_id: userId });
      console.log("All marked as read on server");
    } catch (error) {
      console.error("Failed to mark read:", error);
      Alert.alert("Error", "Could not sync with server");
      // Optional: Revert changes if failed, but for FYP this is fine
    }
  };

  // Helper to format date nicely
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <View style={styles.mainContainer}>
      
      {/* 1. TOP STRIP */}
      <SafeAreaView edges={['top']} style={styles.topSafeArea} />

      {/* 2. BODY */}
      <View style={styles.contentContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#EAEAEA" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Text style={styles.backArrow}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 20 }} />
        </View>

        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
            <Text>Checking alerts...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            
            {/* Mark Read Button */}
            <View style={styles.actionContainer}>
              <TouchableOpacity onPress={handleMarkAllRead}>
                <Text style={styles.markReadText}>Mark all as read</Text>
              </TouchableOpacity>
            </View>

            {/* List */}
            <View style={styles.listContainer}>
              {notifications.length === 0 ? (
                 <Text style={{textAlign: 'center', marginTop: 20, color: '#777'}}>
                    No new notifications.
                 </Text>
              ) : (
                notifications.map((item) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[
                      styles.card, 
                      // Django uses 'is_read', so we check that
                      item.is_read ? styles.cardRead : styles.cardUnread
                    ]}
                    // Navigate to Detail (if you have one, or just expand)
                    // onPress={() => navigation.navigate('NotificationDetail', { item: item })}
                  >
                    <View style={styles.cardContentRow}>
                      {/* Dot Indicator for Unread */}
                      {item.is_read === false ? (
                          <View style={styles.dotIndicator} />
                      ) : null}
                      
                      <View style={styles.textContainer}>
                        <Text style={styles.messageText} numberOfLines={2}>
                          {item.message || item.title} 
                        </Text>
                        <Text style={styles.dateText}>
                          {formatDate(item.date_sent)}
                        </Text>
                      </View>
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
  mainContainer: {
    flex: 1,
    backgroundColor: '#ffffffff', 
  },
  topSafeArea: {
    flex: 0, 
    backgroundColor: '#EAEAEA', 
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
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
  actionContainer: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10, alignItems: 'flex-end' },
  markReadText: { fontWeight: 'bold', fontSize: 14, color: '#000' },
  listContainer: { paddingHorizontal: 20 },
  card: { borderRadius: 10, paddingVertical: 20, paddingHorizontal: 15, marginBottom: 15 },
  
  // Styles for Read/Unread
  cardUnread: { backgroundColor: '#E0E0E0', borderWidth: 0 },
  cardRead: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0' },
  
  cardContentRow: { flexDirection: 'row', alignItems: 'flex-start' },
  dotIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#757575', marginTop: 6, marginRight: 10 },
  textContainer: { flex: 1 },
  messageText: { fontSize: 15, fontWeight: '700', color: '#000', marginBottom: 8, lineHeight: 20 },
  dateText: { fontSize: 12, color: '#555' },
});

export default NotificationScreen;