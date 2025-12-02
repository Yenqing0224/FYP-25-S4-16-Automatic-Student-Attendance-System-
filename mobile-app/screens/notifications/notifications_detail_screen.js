import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const NotificationDetailScreen = ({ route, navigation }) => {
  // We get the specific notification data passed from the previous screen
  const { item } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 20 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* The Title (Message) */}
        <Text style={styles.title}>
          {item.message}
        </Text>

        {/* The Long Details Body */}
        <Text style={styles.bodyText}>
          {item.longDescription}
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  content: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
    lineHeight: 26,
  },
  bodyText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlign: 'justify', // Makes it look like a real paragraph
  },
});

export default NotificationDetailScreen;