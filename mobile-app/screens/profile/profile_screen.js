import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  StatusBar,
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const ProfileScreen = ({ navigation }) => {
  // 1. STATE
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const toggleSwitch = () => setIsPushEnabled(previousState => !previousState);
  
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = 'https://attendify-ekg6.onrender.com/api/profile/';

  // 2. FETCH REAL DATA
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const storedData = await AsyncStorage.getItem('userInfo');
      if (storedData) {
        const basicUser = JSON.parse(storedData);
        // Fetch full details
        const response = await axios.get(`${API_URL}?id=${basicUser.id}`);
        setStudent(response.data);
      }
    } catch (error) {
      console.error("Profile Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. LOGOUT LOGIC
  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive", 
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userInfo');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (e) {
              console.error("Logout failed:", e);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView edges={['top']} style={styles.topSafeArea} />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
           <Text style={styles.backArrow}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 20 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <StatusBar barStyle="dark-content" backgroundColor="#EAEAEA" />
        
        {/* --- PROFILE CARD SECTION --- */}
        <View style={styles.profileSection}>
            
            {/* Avatar Circle */}
            <View style={styles.avatarContainer}>
                <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarLetter}>
                        {student?.first_name ? student.first_name[0].toUpperCase() : ""}
                    </Text>
                </View>
            </View>

            {/* Text & Button Column */}
            <View style={styles.textSection}>
                <Text style={styles.name}>
                    {student?.user?.username}
                </Text>
                
                <Text style={styles.degree}>
                    {student?.programme || "Bachelor of Computer Science"}
                </Text>

                <TouchableOpacity style={styles.editButton}
                    onPress={() => navigation.navigate('EditProfile')}>
                    <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* --- MENU LIST --- */}
        <View style={styles.menuContainer}>
            
            {/* Push Notification Toggle */}
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

            {/* Apply Leave */}
            <TouchableOpacity style={styles.menuItem}
              onPress={() => navigation.navigate('ApplyLeave')}>
                <Text style={styles.menuText}>Apply Leave of absence</Text>
                <Text style={styles.arrow}>{'>'}</Text>
            </TouchableOpacity>

            {/* ✅ SPLIT 1: Leaves Status */}
            <TouchableOpacity style={styles.menuItem}
                onPress={() => navigation.navigate('LeaveStatus')}>
                <Text style={styles.menuText}>Leaves Status</Text>
                <Text style={styles.arrow}>{'>'}</Text>
            </TouchableOpacity>

            {/* ✅ SPLIT 2: Appeals Module Status */}
            <TouchableOpacity style={styles.menuItem}
                onPress={() => navigation.navigate('AppealStatus')}>
                <Text style={styles.menuText}>Appeals Module Status</Text>
                <Text style={styles.arrow}>{'>'}</Text>
            </TouchableOpacity>

            {/* FAQ */}
            <TouchableOpacity style={styles.menuItem}
                onPress={() => navigation.navigate('FAQ')}>
                <Text style={styles.menuText}>FAQ</Text>
                <Text style={styles.arrow}>{'>'}</Text>
            </TouchableOpacity>

            {/* Logout Item */}
            <TouchableOpacity 
                style={[styles.menuItem, { borderBottomWidth: 0 }]} 
                onPress={handleLogout}
            >
                <Text style={styles.menuText}>Log out</Text>
                <Text style={styles.arrow}>{'>'}</Text>
            </TouchableOpacity>

        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#fff' },
  topSafeArea: { flex: 0, backgroundColor: '#EAEAEA' },
  
  header: {
    backgroundColor: '#EAEAEA',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backArrow: { fontSize: 24, color: '#333', fontWeight: '300' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#000' },

  scrollContent: { paddingBottom: 20 },

  profileSection: {
    flexDirection: 'row',
    padding: 30, 
    paddingBottom: 20,
    alignItems: 'flex-start', 
  },
  avatarContainer: { marginRight: 20 },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#D9D9D9', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold'
  },
  
  textSection: { flex: 1, justifyContent: 'center', paddingTop: 5 },
  name: {
    fontSize: 20,
    fontWeight: '800', 
    color: '#000',
    marginBottom: 4,
  },
  degree: {
    fontSize: 13,
    color: '#333',
    fontWeight: '400',
    lineHeight: 18,
  },
  
  editButton: {
    marginTop: 12,
    backgroundColor: '#8E8E8E', 
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20, 
    alignSelf: 'flex-start', 
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  menuContainer: { paddingHorizontal: 30, marginTop: 10 },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
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