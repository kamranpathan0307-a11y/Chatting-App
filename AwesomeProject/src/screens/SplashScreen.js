import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, typography } from '../theme';
import API from '../utils/api';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    checkAuth();
  }, [navigation]);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const user = await AsyncStorage.getItem('user');
      
      if (token && user) {
        // Set auth header
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Initialize socket connection if token exists
        const { initializeSocket } = require('../utils/socket');
        try {
          await initializeSocket();
        } catch (error) {
          console.error('Failed to initialize socket:', error);
          // Continue anyway, socket will retry
        }
        
        // Navigate to main app
        setTimeout(() => {
          navigation.replace('MainTabs');
        }, 1500);
      } else {
        setTimeout(() => {
          navigation.replace('Login');
        }, 1500);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setTimeout(() => {
        navigation.replace('Login');
      }, 1500);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>💬</Text>
        </View>
        <Text style={styles.title}>WhatsApp Clone</Text>
        <ActivityIndicator 
          size="large" 
          color={colors.primary} 
          style={styles.loader}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    fontSize: 64,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xxl,
  },
  loader: {
    marginTop: spacing.xl,
  },
});

export default SplashScreen;

