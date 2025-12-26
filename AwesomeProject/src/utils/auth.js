import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import API from './api';

export const logout = async (navigation) => {
  try {
    // Clear stored authentication data
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    
    // Clear API authorization header
    delete API.defaults.headers.common['Authorization'];
    
    // Disconnect socket if connected
    const { disconnectSocket } = require('./socket');
    try {
      disconnectSocket();
    } catch (error) {
      console.error('Error disconnecting socket:', error);
    }
    
    // Navigate to login screen and reset navigation stack
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
    
    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    Alert.alert('Error', 'Failed to logout. Please try again.');
    return false;
  }
};

export const confirmLogout = (navigation) => {
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
        onPress: () => logout(navigation),
      },
    ],
    { cancelable: true }
  );
};