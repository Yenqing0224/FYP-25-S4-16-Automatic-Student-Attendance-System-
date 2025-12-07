import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image, // Import Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const NewsEventDetailScreen = ({ route, navigation }) => {
  // Get the data passed from the previous screen
  const { item } = route.params;

  // Helper to format the specific date string from Django
  const getFormattedDate = () => {
    const dateString = item.news_date || item.event_date || item.date_sent;
    if (!dateString) return "Date not available";
    
    // Format: "5 Oct 2025"
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', 
      month: 'short', 
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
          <Text style={styles.headerTitle}>News & Events</Text>
          <View style={{ width: 20 }} /> 
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Big Image Section */}
          {item.image_url ? (
            <Image 
              source={{ uri: item.image_url }} 
              style={styles.heroImage} 
              resizeMode="cover"
            />
          ) : (
            // Fallback Gray Box if no image
            <View style={styles.imagePlaceholder} />
          )}

          {/* Title Section */}
          <Text style={styles.title}>{item.title}</Text>
          
          {/* Subtitle / Short Description */}
          <Text style={styles.subtitle}>
            {item.message || item.description}
          </Text>
          
          {/* Date */}
          <Text style={styles.date}>{getFormattedDate()}</Text>

          {/* Long Body Text (Use description if no separate long_description exists) */}
          <Text style={styles.bodyText}>
            {item.description || item.message}
          </Text>

          {/* Extra Details for Events (Venue/Organizer) */}
          {item.venue && (
            <View style={styles.extraDetails}>
              <Text style={styles.detailLabel}>Venue: {item.venue}</Text>
              {item.organizer && <Text style={styles.detailLabel}>Organizer: {item.organizer}</Text>}
            </View>
          )}

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
  
  scrollContent: { padding: 20 },
  
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#757575',
    marginBottom: 20,
  },
  heroImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#ccc',
    marginBottom: 20,
  },
  
  title: {
    fontSize: 22, // Slightly larger
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600', // Semi-bold for emphasis
    color: '#333',
    marginBottom: 10,
    lineHeight: 22,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  bodyText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
    textAlign: 'justify',
  },
  extraDetails: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 5,
  }
});

export default NewsEventDetailScreen;