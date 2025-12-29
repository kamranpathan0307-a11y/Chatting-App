import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../theme';

// Screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ChatsListScreen from '../screens/ChatsListScreen';
import CallsScreen from '../screens/CallsScreen';
import CommunitiesScreen from '../screens/CommunitiesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import IndividualChatScreen from '../screens/IndividualChatScreen';
import MediaPreviewScreen from '../screens/MediaPreviewScreen';
import ContactsScreen from '../screens/ContactsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Chats"
        component={ChatsListScreen}
        options={{
          tabBarLabel: 'Chats',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>💬</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Calls"
        component={CallsScreen}
        options={{
          tabBarLabel: 'Calls',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>📞</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Communities"
        component={CommunitiesScreen}
        options={{
          tabBarLabel: 'Communities',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>👥</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = React.forwardRef((props, ref) => {
  return (
    <NavigationContainer ref={ref}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.background,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Signup"
          component={SignupScreen}
          options={{
            headerShown: true,
            title: 'Create Account',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{
            headerShown: true,
            title: 'Reset Password',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="IndividualChat"
          component={IndividualChatScreen}
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: colors.background,
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          name="MediaPreview"
          component={MediaPreviewScreen}
          options={{
            headerShown: true,
            title: 'Media',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <Stack.Screen
          name="Contacts"
          component={ContactsScreen}
          options={{
            headerShown: true,
            title: 'Contacts',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: colors.background,
            headerBackTitleVisible: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
});

export default AppNavigator;
