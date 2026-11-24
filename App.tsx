import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import { RootNavigator } from './src/navigation';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { wakeBackendServer } from './src/services/api/client';
import { tokenStore } from './src/services/api/tokenStore';
import { preferencesStore } from './src/services/preferencesStore';
import { pantryService } from './src/services/api/pantryService';
import { savedMealsService } from './src/services/api/savedMealsService';
import { subscriptionService } from './src/services/subscriptionService';
import { UserDataBankProvider } from './src/context/UserDataBankContext';
import { MamaAlertHost } from './src/components/common/MamaAlertHost';
import { colors } from './src/theme/colors';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const lastUpdateCheckRef = useRef<number>(0);

  useEffect(() => {
    // Wake Render backend immediately so AI calls don't stall on cold start
    wakeBackendServer();

    const checkAndApplyOtaUpdate = async () => {
      if (__DEV__ || !Updates.isEnabled) return;
      const now = Date.now();
      if (now - lastUpdateCheckRef.current < 60_000) return;
      lastUpdateCheckRef.current = now;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          const fetched = await Updates.fetchUpdateAsync();
          if (fetched.isNew) {
            await Updates.reloadAsync();
          }
        }
      } catch {
        // Ignore transient offline or update check errors
      }
    };

    // Restore JWT and local preferences before first screen renders;
    // sync remote pantry/saved meals/billing/OTA updates asynchronously so startup stays instant.
    const initApp = async () => {
      try {
        await Promise.all([tokenStore.init(), preferencesStore.init()]);
      } catch (err) {
        console.warn('[App] Initialization warning:', err);
      } finally {
        setIsReady(true);
      }

      checkAndApplyOtaUpdate();
      pantryService.fetchAll().catch(() => {});
      savedMealsService.fetchAll().catch(() => {});
      subscriptionService.init(tokenStore.getUser()?.id).catch(() => {});
    };
    initApp();

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkAndApplyOtaUpdate();
      }
    });
    return () => appStateSub.remove();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ErrorBoundary>
        <UserDataBankProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
          <MamaAlertHost />
        </UserDataBankProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
