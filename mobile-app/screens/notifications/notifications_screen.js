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
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#3A7AFE',
  background: '#F5F7FB',
  textDark: '#111827',
  textMuted: '#6B7280',
  card: '#FFFFFF',
};

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const API_URL = 'https://attendify-ekg6.onrender.com/api/notifications/';

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const storedData = await AsyncStorage.getItem('userInfo');
      if (storedData) {
        const user = JSON.parse(storedData);
        setUserId(user.id);

        const response = await axios.get(`${API_URL}?user_id=${user.id}`);
        setNotifications(response.data);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;

    const updatedList = notifications.map(item => ({ ...item, is_read: true }));
    setNotifications(updatedList);

    try {
      await axios.post(`${API_URL}mark-read/`, { user_id: userId });
    } catch (error) {
      console.error("Failed to mark read:", error);
      Alert.alert("Error", "Could not sync with server");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView edges={['top']} style={styles.safeTop} />
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* HEADER (beautified) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.headerIconBox}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifications</Text>

        {/* placeholder for alignment */}
        <View style={styles.headerIconBox} />
      </View>

      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Checking alerts...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            
            {/* MARK ALL READ */}
            <View style={styles.actionContainer}>
              <TouchableOpacity style={styles.markReadButton} onPress={handleMarkAllRead}>
                <Ionicons name="checkmark-done-outline" size={16} color={COLORS.primary} />
                <Text style={styles.markReadText}>Mark all as read</Text>
              </TouchableOpacity>
            </View>

            {/* LIST */}
            <View style={styles.listContainer}>
              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="notifications-off-outline" size={40} color={COLORS.primary} />
                  <Text style={styles.emptyTitle}>All caught up</Text>
                  <Text style={styles.emptySubtitle}>No new notifications right now.</Text>
                </View>
              ) : (
                notifications.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.card,
                      item.is_read ? styles.cardRead : styles.cardUnread,
                    ]}
                    onPress={() => navigation.navigate('NotificationDetail', { item })}
                  >
                    <View style={styles.cardTopRow}>
                      <View style={styles.cardTitleRow}>
                        {!item.is_read && <View style={styles.dotIndicator} />}
                        <Text
                          style={[
                            styles.messageText,
                            !item.is_read && styles.messageTextUnread,
                          ]}
                          numberOfLines={2}
                        >
                          {item.message || item.title}
                        </Text>
                      </View>

                      <Text style={styles.dateText}>
                        {formatDate(item.date_sent)}
                      </Text>
                    </View>

                    {!item.is_read && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>New</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeTop: {
    flex: 0,
    backgroundColor: COLORS.background,
  },

  header: {
    backgroundColor: COLORS.background,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  headerIconBox: {
    width: 32,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  contentContainer: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textMuted,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },

  actionContainer: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  markReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F0FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  markReadText: {
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 13,
    color: COLORS.primary,
  },

  listContainer: {
    marginTop: 4,
  },

  card: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  cardUnread: {
    backgroundColor: '#E0ECFF',
  },
  cardRead: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },

  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 6,
    marginRight: 8,
  },

  messageText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    lineHeight: 20,
  },
  messageTextUnread: {
    color: '#1D2A5B',
  },

  dateText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  unreadBadge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // EMPTY STATE
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
});

export default NotificationScreen;