import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const NotificationDetailScreen = ({ route, navigation }) => {
  const { item } = route.params;

  // ✅ CHANGED: Date format (No Time)
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric'
    });
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView edges={['top']} style={styles.topSafeArea} />

      <View style={styles.contentContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#EAEAEA" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Details</Text>
          <View style={{ width: 20 }} /> 
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          
          {/* ✅ CHANGED: Header Row (Title Left, Date Right) */}
          <View style={styles.topHeaderRow}>
            {/* Title takes up remaining space */}
            <Text style={styles.title}>
              {item.title}
            </Text>

            {/* Date is fixed on the right */}
            <Text style={styles.date}>
              {formatDate(item.date_sent)}
            </Text>
          </View>

          {/* Divider Line */}
          <View style={styles.divider} />

          {/* Body Text */}
          <Text style={styles.bodyText}>
            {item.description}
          </Text>

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
  
  content: { padding: 20 },

  // ✅ NEW: Row layout for Title and Date
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Ensures alignment at the top
    marginBottom: 15,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    flex: 1, // Allow title to wrap if long
    marginRight: 15, // Gap between title and date
  },

  date: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4, // Slight adjustment to align with title text
    minWidth: 100, // Ensure date doesn't wrap weirdly
  },

  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 20,
  },
  bodyText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 26,
    textAlign: 'left',
  },
});

export default NotificationDetailScreen;