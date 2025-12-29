import React, { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import {
  listenForContactIntent,
  normalizePhoneNumber,
} from './src/native/ContactIntent';

const App = () => {
  const navigationRef = useRef();

  useEffect(() => {
    const subscription = listenForContactIntent(phoneNumber => {
      console.log('Opening chat with:', phoneNumber);

      // Normalize the phone number
      const normalizedPhone = normalizePhoneNumber(phoneNumber);

      // Navigate to IndividualChat screen with the phone number
      // We'll wait a bit to ensure navigation is ready
      setTimeout(() => {
        if (navigationRef.current) {
          navigationRef.current.navigate('IndividualChat', {
            phoneNumber: normalizedPhone,
            chatName: normalizedPhone, // This matches the expected parameter
            fromContactIntent: true,
          });
        }
      }, 100);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppNavigator ref={navigationRef} />
    </GestureHandlerRootView>
  );
};

export default App;
