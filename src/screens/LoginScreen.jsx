import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert, 
  Image, 
  Dimensions, 
} from 'react-native'; 
import React, { useState } from 'react'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
 
import { 
  GoogleAuthProvider, 
  getAuth, 
  signInWithCredential, 
} from '@react-native-firebase/auth'; 
import { GoogleSignin } from '@react-native-google-signin/google-signin'; 
 
const { height, width } = Dimensions.get('window'); 
 
const LoginScreen = ({ navigation }) => { 
  const [isLoading, setIsLoading] = useState(false);
 
  const handleGoogleLogin = async () => { 
    try { 
      setIsLoading(true);
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
      
      // Small delay for better UX
      setTimeout(() => {
        navigation.replace('HomeScreen');
      }, 1000);
      
      // Sign-in the user with the credential 
      return signInWithCredential(getAuth(), googleCredential); 
    } catch (error) { 
      console.error(error);
      Alert.alert('Sign In Failed', 'Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }; 
 
  return ( 
    <View style={styles.container}> 
      {/* App Icon */}
      <View style={styles.iconContainer}>
        <MaterialIcons name="calendar-month" size={80} color="#ffffff" />
      </View>

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.title}>WELCOME</Text> 
        <Text style={styles.subtitle}>It's Time to Organise your Events</Text> 
      </View>

      {/* Sign In Section */}
      <View style={styles.signInSection}>
        <Text style={styles.signInLabel}>Sign in with Google</Text>
        <Text style={styles.signInDescription}>
          Connect your Google account to sync your calendar events
        </Text>
        
        <TouchableOpacity 
          style={[styles.googleButton, isLoading && styles.buttonDisabled]} 
          onPress={handleGoogleLogin}
          disabled={isLoading}
        > 
          <View style={styles.googleButtonContent}> 
            {isLoading ? (
              <MaterialIcons name="hourglass-empty" size={20} color="#666" />
            ) : (
              <Image 
                source={{ 
                  uri: 'https://developers.google.com/identity/images/g-logo.png', 
                }} 
                style={styles.googleIcon} 
              />
            )}
            <Text style={styles.googleButtonText}>
              {isLoading ? 'Signing in...' : 'Continue with Google'}
            </Text> 
          </View> 
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By continuing, you agree to sync your calendar events
        </Text>
      </View>
    </View> 
  ); 
}; 
 
export default LoginScreen; 
 
const styles = StyleSheet.create({ 
  container: { 
    flex: 1, 
    backgroundColor: '#0F0518', 
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingVertical: 60,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  welcomeSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginTop: -80,
  },
  title: { 
    fontSize: 36, 
    fontWeight: 'bold', 
    color: '#ffffff', 
    textAlign: 'center', 
    marginBottom: 12, 
    letterSpacing: 2, 
  }, 
  subtitle: { 
    fontSize: 18, 
    color: '#cccccc', 
    textAlign: 'center', 
    fontWeight: '300', 
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  signInSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  signInLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  signInDescription: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  googleButton: { 
    backgroundColor: '#ffffff', 
    paddingVertical: 16, 
    paddingHorizontal: 24,
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#e0e0e0', 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  googleButtonContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    width: width - 60,
    maxWidth: 320,
  }, 
  googleIcon: { 
    width: 20, 
    height: 20, 
    marginRight: 12, 
  }, 
  googleButtonText: { 
    color: '#333333', 
    fontSize: 16, 
    fontWeight: '600', 
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 40,
  },
});