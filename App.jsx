import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import StackNavigation from './src/navigations/StackNavigation';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

function App() {
  GoogleSignin.configure({
  webClientId: '550098372106-it6t4meuoggpqsq6nov7be8fk3d0ch94.apps.googleusercontent.com',
  scopes: ['email','https://www.googleapis.com/auth/calendar'],
});
  return (
    <SafeAreaProvider style={styles.container}>
      <StatusBar barStyle={'light-content'} />
      <NavigationContainer>
        <StackNavigation />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});

export default App;
