import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileScreen = ({ navigation }) => {
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const toggleSwitch = () => setIsPushEnabled(previousState => !previousState);

  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
           <Text style={styles.backArrow}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 20 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
                <View style={styles.avatarPlaceholder} />
                <View style={styles.editBadge}>
                    <Text style={styles.editText}>✎</Text>
                </View>
            </View>

            <View style={styles.textSection}>
                <Text style={styles.name}>John Doe</Text>
                <Text style={styles.degree}>Bachelor of Computer Science</Text>
                <Text style={styles.degree}>(Big Data)</Text>
            </View>
        </View>

        <View style={styles.menuContainer}>
            
            <View style={styles.menuItem}>
                <Text style={styles.menuText}>Push notification</Text>
                <Switch
                    trackColor={{ false: "#E0E0E0", true: "#3A7AFE" }}
                    thumbColor={"#fff"}
                    ios_backgroundColor="#E0E0E0"
                    onValueChange={toggleSwitch}
                    value={isPushEnabled}
                />
            </View>

            <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuText}>Apply Leave of absence</Text>
                <Text style={styles.arrow}>{'>'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuText}>Appeals & Leaves Status</Text>
                <Text style={styles.arrow}>{'>'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuText}>FAQ</Text>
                <Text style={styles.arrow}>{'>'}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.menuItem, { borderBottomWidth: 0 }]} 
                onPress={() => {
                    // Logic for logout
                    navigation.replace('Login');
                }}
            >
                <Text style={styles.menuText}>Log out</Text>
                <Text style={styles.arrow}>{'>'}</Text>
            </TouchableOpacity>

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
  profileSection: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D9D9D9',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  editText: {
    fontSize: 12,
    lineHeight: 14,
  },
  textSection: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  degree: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 0, 
  },
  menuText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  arrow: {
    fontSize: 18,
    color: '#333',
    fontWeight: '300',
  },
});

export default ProfileScreen;