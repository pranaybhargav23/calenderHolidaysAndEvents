import React from 'react'
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import EventList from '../screens/EventList';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

const StackNavigation = () => {

  return (
    <Stack.Navigator screenOptions={{headerShown:false}} initialRouteName='SplashScreen'>
        <Stack.Screen name="SplashScreen" component={SplashScreen}/>
        <Stack.Screen name="LoginScreen" component={LoginScreen}/>
        <Stack.Screen name="HomeScreen" component={HomeScreen}/>
        <Stack.Screen name="EventList" component={EventList}/>
    </Stack.Navigator>
  )
}

export default StackNavigation
