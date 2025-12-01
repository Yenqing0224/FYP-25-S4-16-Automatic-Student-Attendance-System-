import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

const NotificationScreen = () => {
  
  const notifications = [
    {
      id: 1,
      message: "Class has started! Reminder to take your attendance!",
      date: "18 Oct 2025",
      isRead: false,
    },
    {
      id: 2,
      message: "Your attendance appeal for the 27 Mar 2025 class was successful!",
      date: "15 Oct 2025",
      isRead: false,
    },
    {
      id: 3,
      message: "Do NOT share your password with anyone! The school will not ask for...",
      date: "15 Oct 2025",
      isRead: false,
    },
    {
      id: 4,
      message: "CSIT123 Workshop (FREE) - Introduction to Programming",
      date: "29 Sep 2025",
      isRead: true, 
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Text style={styles.backArrow}>&lt;</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Action Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity>
            <Text style={styles.markReadText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>

        {/* Notification List */}
        <View style={styles.listContainer}>
          {notifications.map((item) => (
            <View 
              key={item.id} 
              style={[
                styles.card, 
                item.isRead ? styles.cardRead : styles.cardUnread
              ]}
            >
              <View style={styles.cardContentRow}>
                {/* Dot Indicator logic using ternary to avoid boolean leakage */}
                {item.isRead === false ? (
                    <View style={styles.dotIndicator} />
                ) : null}
                
                <View style={styles.textContainer}>
                  <Text style={styles.messageText}>
                    {item.message}
                  </Text>
                  <Text style={styles.dateText}>
                    {item.date}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#EAEAEA',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  actionContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    alignItems: 'flex-end',
  },
  markReadText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#000',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  cardUnread: {
    backgroundColor: '#E0E0E0',
    borderWidth: 0,
  },
  cardRead: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#757575',
    marginTop: 6,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  messageText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    lineHeight: 20,
  },
  dateText: {
    fontSize: 12,
    color: '#555',
  },
});

export default NotificationScreen;