import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  GoogleAuthProvider,
  getAuth,
  signInWithCredential,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const { height, width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      // Get the users ID token
      const signInResult = await GoogleSignin.signIn();
      console.log(
        'Google Sign-In Result:------------------->',
        signInResult.data.user,
      );
      await AsyncStorage.setItem(
        'userInfo',
        JSON.stringify(signInResult.data.user),
      );
      console.log(signInResult, 'signInResult----->');

      let idToken;

      // Try the new style of google-sign in result, from v13+ of that module
      idToken = signInResult.data?.idToken;

      if (!idToken) {
        // if you are using older versions of google-signin, try old style result
        idToken = signInResult.idToken;
      }
      if (!idToken) {
        throw new Error('No ID token found');
      }

      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(
        signInResult.data.idToken,
      );
      const tokens = await GoogleSignin.getTokens();
      console.log(tokens, 'tokens----->>>>>');
      await AsyncStorage.setItem('accessToken', tokens.accessToken);
      navigation.replace('HomeScreen');
      // Sign-in the user with the credential
      return signInWithCredential(getAuth(), googleCredential);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WELCOME </Text>
      <Text style={styles.subtitle}>It's Time to Organise your Events</Text>
      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
        <View style={styles.googleButtonContent}>
          <Image
            source={{
              uri: 'https://developers.google.com/identity/images/g-logo.png',
            }}
            style={styles.googleIcon}
          />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 50,
    fontWeight: '300',
  },

  googleButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 300,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  googleButtonText: {
    color: '#000',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
