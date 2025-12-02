import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const NewsEventDetailScreen = ({ route, navigation }) => {
  // Get the data passed from the previous screen
  const { item } = route.params;

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
          
          {/* Big Image Placeholder */}
          <View style={styles.imagePlaceholder} />

          {/* Title Section */}
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.description}</Text>
          
          <Text style={styles.date}>{item.fullDate || item.time}</Text>

          {/* Long Body Text */}
          <Text style={styles.bodyText}>
            {item.longDescription}
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
  
  scrollContent: { padding: 20 },
  
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#757575',
    borderRadius: 0, // Sharp corners as per image
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 15,
    lineHeight: 20,
  },
  date: {
    fontSize: 14,
    color: '#333',
    marginBottom: 20,
  },
  bodyText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
    textAlign: 'justify',
  },
});

export default NewsEventDetailScreen;