import { StyleSheet, View } from 'react-native';
import React,{useEffect} from 'react';
import LottieView from 'lottie-react-native';

const SplashScreen = ({navigation}) => {
useEffect(()=>{
    setTimeout(()=>{
        navigation.replace('LoginScreen')
    },3000)
},[])
  return (
    <View style={styles.container}>
      
       <LottieView source={require('../assets/animations/booked.json')} autoPlay loop style={{ width: 200, height: 200 }} />
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1B1024',
  },
  text: {
    fontSize: 34,
    color: 'white',
    fontFamily: 'LibertinusKeyboard-Regular',
  },
});
