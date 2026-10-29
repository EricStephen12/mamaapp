import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

// Group 01 - Onboarding
import { MamaKitchenSplash } from '../screens/01_onboarding';

// Group 02 - Auth
import { MamaKitchenSignIn, MamaKitchenSignUp } from '../screens/02_auth';

// Group 03 - Personalization & Preferences
import { MakeItYours } from '../screens/03_preferences';

// Group 04 - Daily Edit (Home Feed)
import { YourDailyEdit } from '../screens/04_daily_edit';

// Group 05 - Discover
import { DiscoverYourNextMeal } from '../screens/05_discover';

// Group 06 - Kitchen Scan
import { WhatsInYourKitchen } from '../screens/06_kitchen_scan';

// Group 07 - Pantry Review
import { ConfirmYourPantry } from '../screens/07_pantry_review';

// Group 08 - Kitchen Recipes
import { AlreadyInYourKitchen } from '../screens/08_kitchen_recipes';

// Group 09 - Meal Details
import {
  AtHomeMealDetails,
  EatingOutMealDetails,
} from '../screens/09_meal_details';

// Group 10 - Collection
import { YourCollection } from '../screens/10_collection';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="MamaKitchenSplash"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
    >
      {/* 01 - Onboarding Group */}
      <Stack.Screen
        name="MamaKitchenSplash"
        component={MamaKitchenSplash}
        options={{ animation: 'fade' }}
      />

      {/* 02 - Auth Group */}
      <Stack.Screen
        name="MamaKitchenSignIn"
        component={MamaKitchenSignIn}
      />
      <Stack.Screen
        name="MamaKitchenSignUp"
        component={MamaKitchenSignUp}
      />

      {/* 03 - Personalization & Preferences Group */}
      <Stack.Screen
        name="MakeItYours"
        component={MakeItYours}
      />

      {/* 04 - Daily Edit (Home Feed) Group - Primary Tab */}
      <Stack.Screen
        name="YourDailyEdit"
        component={YourDailyEdit}
        options={{ animation: 'fade' }}
      />

      {/* 05 - Discover Group - Primary Tab */}
      <Stack.Screen
        name="DiscoverYourNextMeal"
        component={DiscoverYourNextMeal}
        options={{ animation: 'fade' }}
      />

      {/* 06 - Kitchen Scan Group */}
      <Stack.Screen
        name="WhatsInYourKitchen"
        component={WhatsInYourKitchen}
      />

      {/* 07 - Pantry Review Group */}
      <Stack.Screen
        name="ConfirmYourPantry"
        component={ConfirmYourPantry}
      />

      {/* 08 - Kitchen Recipes Group */}
      <Stack.Screen
        name="AlreadyInYourKitchen"
        component={AlreadyInYourKitchen}
      />

      {/* 09 - Meal Details Group */}
      <Stack.Screen
        name="AtHomeMealDetails"
        component={AtHomeMealDetails}
      />
      <Stack.Screen
        name="EatingOutMealDetails"
        component={EatingOutMealDetails}
      />

      {/* 10 - Collection Group - Primary Tab */}
      <Stack.Screen
        name="YourCollection"
        component={YourCollection}
        options={{ animation: 'fade' }}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;
