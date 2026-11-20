import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { tokenStore } from './src/services/api/tokenStore';
import { preferencesStore } from './src/services/preferencesStore';
import { pantryService } from './src/services/api/pantryService';
import { savedMealsService } from './src/services/api/savedMealsService';
import { subscriptionService } from './src/services/subscriptionService';
import { UserDataBankProvider } from './src/context/UserDataBankContext';
import { colors } from './src/theme/colors';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Restore JWT and active user's isolated data bank from local secure storage
    const initApp = async () => {
      try {
        await tokenStore.init();
        await Promise.all([
          preferencesStore.init(),
          pantryService.fetchAll(),
          savedMealsService.fetchAll(),
        ]);
        // Mama Plus billing (no-op until RevenueCat keys are added)
        subscriptionService.init(tokenStore.getUser()?.id).catch(() => {});
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
      <ErrorBoundary>
        <UserDataBankProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </UserDataBankProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
