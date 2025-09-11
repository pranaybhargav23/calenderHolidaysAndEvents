import { StyleSheet, Text, TouchableOpacity, View, Modal, Alert } from 'react-native'
import React, { useState } from 'react'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

const Header = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const onHandlePress = () => {
    setModalVisible(true);
  };

  const handleLogout = () => {
    setModalVisible(false);
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // Add your logout logic here
            console.log('User logged out');
            // You can add navigation to login screen or clear tokens here
          },
        },
      ]
    );
  };

  const closeModal = () => {
    setModalVisible(false);
  };
  return (
    <SafeAreaView>
        <View style={styles.headerContainer}>
      <Text style={styles.header}>My CALENDAR</Text>
      <TouchableOpacity onPress={onHandlePress}>
        <MaterialIcons name="account-circle" size={60} color="dark" />
      </TouchableOpacity>

      
    </View>
    <View style={styles.line} />
    
    {/* Modal for user options */}
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={closeModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Account Options</Text>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </SafeAreaView>
    
  )
}

export default Header

const styles = StyleSheet.create({
  headerContainer:{
    flexDirection:'row',
    justifyContent:'space-between',
   
    padding:10,
    borderRadius:10
  },
  header:{
    fontSize:24,
    color:'dark',
    paddingVertical:10,
    marginLeft:10
  },
  line: {
    height: 1,
    backgroundColor: '#eb6565ff',
    marginHorizontal: 10,
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 250,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#eb6565ff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    minWidth: 150,
    justifyContent: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
  },
})