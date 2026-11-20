import React, { useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { BottomNavigation } from '../components/navigation/BottomNavigation';
import { TabNavigationProvider, useTabNavigation } from '../context/TabNavigationContext';
import { colors } from '../theme/colors';

// Tab Screens
import { YourDailyEdit } from '../screens/04_daily_edit';
import { WhatsInYourKitchen } from '../screens/06_kitchen_scan';
import { DiscoverYourNextMeal } from '../screens/05_discover';
import { YourCollection } from '../screens/10_collection';

type Props = NativeStackScreenProps<RootStackParamList, 'YourDailyEdit'>;

const MainTabsContent: React.FC<Props> = (props) => {
  const { activeTab, setActiveTab } = useTabNavigation();

  // Android Back Handler: Return to 'edit' (Home) tab before exiting app
  useEffect(() => {
    const onBackPress = () => {
      if (activeTab !== 'edit') {
        setActiveTab('edit');
        return true; // Handled! Don't exit
      }
      return false; // Exit from Home
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [activeTab, setActiveTab]);

  return (
    <View style={styles.container}>
      {/* Tab Screen Body: All screens stay mounted to preserve state & prevent re-renders */}
      <View style={styles.screenContainer}>
        <View style={[styles.tabPane, activeTab !== 'edit' && styles.tabPaneHidden]}>
          <YourDailyEdit {...props} />
        </View>

        <View style={[styles.tabPane, activeTab !== 'kitchen' && styles.tabPaneHidden]}>
          <WhatsInYourKitchen {...(props as any)} />
        </View>

        <View style={[styles.tabPane, activeTab !== 'discover' && styles.tabPaneHidden]}>
          <DiscoverYourNextMeal {...(props as any)} />
        </View>

        <View style={[styles.tabPane, activeTab !== 'collection' && styles.tabPaneHidden]}>
          <YourCollection {...(props as any)} />
        </View>
      </View>

      {/* ONE SINGLE PERSISTENT, FIXED LIQUID BOTTOM TAB BAR */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={(nextTab) => setActiveTab(nextTab)}
      />
    </View>
  );
};

export const MainTabsScreen: React.FC<Props> = (props) => {
  return (
    <TabNavigationProvider initialTab="edit">
      <MainTabsContent {...props} />
    </TabNavigationProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContainer: {
    flex: 1,
    position: 'relative',
  },
  tabPane: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabPaneHidden: {
    display: 'none',
  },
});

export default MainTabsScreen;
