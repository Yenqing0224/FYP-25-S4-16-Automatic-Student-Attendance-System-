import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const NewsEventsScreen = () => {
  const [searchText, setSearchText] = useState('');

  const items = [
    {
      id: 1,
      title: "Orientation Week Kicks Off for New Students!",
      description: "A warm welcome event to help newcomers settle in.",
      time: "2 hours ago",
    },
    {
      id: 2,
      title: "Mid-Semester Break Schedule Released!",
      description: "Official holiday dates for students to plan ahead.",
      time: "8 hours ago",
    },
    {
      id: 3,
      title: "Campus Sustainability Drive Launches Next Monday",
      description: "A week-long campaign promoting eco-friendly habits",
      time: "5 Oct 2025",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.header}>
        <TouchableOpacity>
          <Text style={styles.backArrow}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>News & Events</Text>
        <View style={{ width: 20 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity style={styles.tabInactive}>
            <Text style={styles.tabTextInactive}>News</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.tabActive}>
            <Text style={styles.tabTextActive}>Events</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {items.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.imagePlaceholder} />
              
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
                <Text style={styles.cardTime}>{item.time}</Text>
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
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
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
  tabTextInactive: {
    color: '#999',
    fontWeight: '700',
    fontSize: 15,
  },
  tabTextActive: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: 70,
    height: 70,
    backgroundColor: '#757575',
    borderRadius: 2,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
    lineHeight: 18,
  },
  cardDescription: {
    fontSize: 10,
    color: '#333',
    marginBottom: 6,
    lineHeight: 14,
  },
  cardTime: {
    fontSize: 10,
    color: '#555',
  },
});

export default NewsEventsScreen;