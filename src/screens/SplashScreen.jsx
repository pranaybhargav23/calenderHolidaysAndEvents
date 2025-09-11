import { StyleSheet, Text, View } from 'react-native';
import React,{useEffect} from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const SplashScreen = ({navigation}) => {
useEffect(()=>{
    setTimeout(()=>{
        navigation.replace('LoginScreen')
    },2000)
},[])
  return (
    <View style={styles.container}>
      <MaterialIcons name="calendar-month" size={120} color="white" />
      <Text style={styles.text}>CALENDAR</Text>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  text: {
    fontSize: 34,
    color: 'white',
    fontFamily: 'LibertinusKeyboard-Regular',
  },
});
