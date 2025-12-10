// mobile-app/screens/profile/profile_screen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'https://attendify-ekg6.onrender.com/api/profile/';

const COLORS = {
  primary: '#3A7AFE',
  background: '#F5F7FB',
  card: '#FFFFFF',
  textDark: '#111827',
  textMuted: '#6B7280',
  borderSoft: '#E5E7EB',
};

const ProfileScreen = ({ navigation }) => {
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const toggleSwitch = () => setIsPushEnabled(prev => !prev);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const storedData = await AsyncStorage.getItem('userInfo');
      if (storedData) {
        const basicUser = JSON.parse(storedData);
        const response = await axios.get(`${API_URL}?id=${basicUser.id}`);
        setStudent(response.data);
      }
    } catch (error) {
      console.error("Profile Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backArrow}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* BODY */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* PROFILE CARD */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>
                  {student?.user?.username
                    ? student.user.username[0].toUpperCase()
                    : 'S'}
                </Text>
              </View>
            </View>

            <View style={styles.textSection}>
              <Text style={styles.name}>
                {student?.user?.username || "Student"}
              </Text>

              <Text style={styles.degree}>
                {student?.programme || "Bachelor of Computer Science"}
              </Text>

              <Text style={styles.emailText}>
                {student?.user?.email || "student@uow.edu.au"}
              </Text>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* SETTINGS CARD */}
          <View style={styles.settingsCard}>
            {/* Push Notification */}
            <View style={[styles.menuItem, styles.menuItemBorder]}>
              <View>
                <Text style={styles.menuText}>Push notification</Text>
                <Text style={styles.menuSubText}>
                  Receive important alerts about attendance and modules.
                </Text>
              </View>
              <Switch
                trackColor={{ false: "#E5E7EB", true: COLORS.primary }}
                thumbColor={"#fff"}
                ios_backgroundColor="#E5E7EB"
                onValueChange={toggleSwitch}
                value={isPushEnabled}
              />
            </View>

            {/* Apply Leave */}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBorder]}
              onPress={() => navigation.navigate('ApplyLeave')}
            >
              <View>
                <Text style={styles.menuText}>Apply Leave of Absence</Text>
                <Text style={styles.menuSubText}>
                  Submit leave requests for upcoming classes.
                </Text>
              </View>
              <Text style={styles.arrow}>{'>'}</Text>
            </TouchableOpacity>

            {/* Leave Status */}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBorder]}
              onPress={() => navigation.navigate('LeaveStatus')}
            >
              <View>
                <Text style={styles.menuText}>Leaves Status</Text>
                <Text style={styles.menuSubText}>
                  Track approval status for your leave submissions.
                </Text>
              </View>
              <Text style={styles.arrow}>{'>'}</Text>
            </TouchableOpacity>

            {/* Appeals Status */}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBorder]}
              onPress={() => navigation.navigate('AppealStatus')}
            >
              <View>
                <Text style={styles.menuText}>Appeals Module Status</Text>
                <Text style={styles.menuSubText}>
                  View updates on your module appeals.
                </Text>
              </View>
              <Text style={styles.arrow}>{'>'}</Text>
            </TouchableOpacity>

            {/* 🔐 Change Password */}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBorder]}
              onPress={() => navigation.navigate('ChangePassword')}
            >
              <View>
                <Text style={styles.menuText}>Change Password</Text>
                <Text style={styles.menuSubText}>
                  Update your login password securely.
                </Text>
              </View>
              <Text style={styles.arrow}>{'>'}</Text>
            </TouchableOpacity>

            {/* FAQ */}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBorder]}
              onPress={() => navigation.navigate('FAQ')}
            >
              <View>
                <Text style={styles.menuText}>FAQ</Text>
                <Text style={styles.menuSubText}>
                  Find answers to common questions.
                </Text>
              </View>
              <Text style={styles.arrow}>{'>'}</Text>
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleLogout}
            >
              <Text style={[styles.menuText, { color: '#B91C1C' }]}>
                Log out
              </Text>
              <Text style={[styles.arrow, { color: '#B91C1C' }]}>{'>'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topSafeArea: {
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderSoft,
  },
  backArrow: { fontSize: 24, color: COLORS.textDark, fontWeight: '300' },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 16,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: COLORS.textMuted,
  },

  // PROFILE CARD
  profileCard: {
    flexDirection: 'row',
    padding: 18,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    marginBottom: 20,

    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#CBD5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 34,
    color: '#1E1B4B',
    fontWeight: '800',
  },
  textSection: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  degree: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  emailText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  editButton: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // SETTINGS CARD
  settingsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 4,

    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },

  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderSoft,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  menuSubText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    maxWidth: 220,
  },
  arrow: {
    fontSize: 18,
    color: COLORS.textMuted,
    fontWeight: '300',
  },
});

export default ProfileScreen;