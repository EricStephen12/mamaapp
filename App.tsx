import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation';
import { tokenStore } from './src/services/api/tokenStore';
import { preferencesStore } from './src/services/preferencesStore';
import { colors } from './src/theme/colors';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Restore JWT first; only fetch DB preferences if an active session exists
    const initApp = async () => {
      try {
        await tokenStore.init();
        if (tokenStore.isLoggedIn()) {
          await preferencesStore.initFromDb();
        }
      } catch (err) {
        console.warn('[App] Initialization warning:', err);
      } finally {
        setIsReady(true);
      }
    };
    initApp();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
