// src/components/Header.jsx
import { StyleSheet, Text, TouchableOpacity, View, Modal, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useNavigation } from '@react-navigation/native';

const Header = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const storedUserInfo = await AsyncStorage.getItem('userInfo');
      if (storedUserInfo) {
        setUserInfo(JSON.parse(storedUserInfo));
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const onHandlePress = () => {
    setModalVisible(true);
  };

  const handleLogout = async () => {
    setModalVisible(false);
    try {
      // Sign out from Google
      await GoogleSignin.signOut();
      
      // Clear stored user data
      await AsyncStorage.multiRemove(['userInfo', 'accessToken']);
      
      // Navigate to login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  return (
    <SafeAreaView>
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <MaterialIcons name="calendar-month" size={28} color="#A16A4D" />
          <Text style={styles.header}>MY CALENDAR</Text>
        </View>
        
        <TouchableOpacity onPress={onHandlePress} style={styles.profileButton}>
          <MaterialIcons name="account-circle" size={32} color="#A16A4D" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.line} />
      
      {/* Modal for user options */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialIcons name="account-circle" size={60} color="#A16A4D" />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {userInfo?.name || 'User'}
                </Text>
                <Text style={styles.userEmail}>
                  {userInfo?.email || 'user@example.com'}
                </Text>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <MaterialIcons name="logout" size={20} color="#fff" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

export default Header

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1B1024',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  profileButton: {
    padding: 5,
  },
  line: {
    height: 2,
    backgroundColor: '#A16A4D',
    marginHorizontal: 20,
    opacity: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 5, 24, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1B1024',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    minWidth: 300,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  userInfo: {
    alignItems: 'center',
    marginTop: 15,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#3B373E',
  },
  modalButtons: {
    width: '100%',
    gap: 10,
  },
  logoutButton: {
    backgroundColor: '#A16A4D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    elevation: 2,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelButton: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
})