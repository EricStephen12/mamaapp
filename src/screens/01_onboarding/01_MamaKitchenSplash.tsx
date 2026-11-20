import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, Animated, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { MamaKitchenLogo } from '../../components/common/MamaKitchenLogo';
import { preferencesStore } from '../../services/preferencesStore';

type Props = NativeStackScreenProps<RootStackParamList, 'MamaKitchenSplash'>;

export const MamaKitchenSplash: React.FC<Props> = ({ navigation }) => {
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(10)).current;
  const hasNavigated = useRef(false);

  const navigateNext = useCallback(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    const pass = preferencesStore.getKitchenPass();
    if (pass.hasCompletedOnboarding) {
      navigation.replace('YourDailyEdit');
    } else {
      navigation.replace('MakeItYours');
    }
  }, [navigation]);

  const handleAnimationEnd = () => {
    // Fade in the tagline once logo sequence is complete
    Animated.parallel([
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(taglineTranslateY, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    // Smoothly route to appropriate screen
    const advanceTimer = setTimeout(() => {
      navigateNext();
    }, 650);

    return () => clearTimeout(advanceTimer);
  };

  return (
    <TouchableWithoutFeedback onPress={navigateNext}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar style="dark" />

        {/* Main Centered Content */}
        <View style={styles.content}>
          <MamaKitchenLogo
            width={280}
            height={210}
            animated={true}
            onAnimationEnd={handleAnimationEnd}
          />

          {/* Animated Tagline */}
          <Animated.Text
            style={[
              styles.tagline,
              {
                opacity: taglineOpacity,
                transform: [{ translateY: taglineTranslateY }],
              },
            ]}
          >
            Good food. Your taste. Your budget.
          </Animated.Text>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  tagline: {
    marginTop: 28,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

export default MamaKitchenSplash;
