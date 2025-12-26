import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppState } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import fileCleanupManager from './src/utils/FileCleanupManager';

const App = () => {
  useEffect(() => {
    // Handle app state changes for cleanup
    const handleAppStateChange = nextAppState => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Clean up old temporary files when app goes to background
        fileCleanupManager.cleanupOldTempFiles();
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    // Cleanup on component unmount (app termination)
    return () => {
      subscription?.remove();
      fileCleanupManager.destroy();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppNavigator />
    </GestureHandlerRootView>
  );
};

export default App;
