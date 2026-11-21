import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, Animated, TouchableWithoutFeedback, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { MamaKitchenLogo } from '../../components/common/MamaKitchenLogo';
import { preferencesStore } from '../../services/preferencesStore';
import { getCurrentTimeOfDay } from '../../services/api/rollService';
import { KitchenAtmosphere } from '../../components/signature/KitchenAtmosphere';
import { SteamWisps } from '../../components/signature/SteamWisps';
import { getRegionalMamaImage } from '../../components/signature/RegionalMamaAvatar';

type Props = NativeStackScreenProps<RootStackParamList, 'MamaKitchenSplash'>;

const SPLASH_MAMAS = [
  { id: 'africa', source: getRegionalMamaImage('NG') },
  { id: 'europe', source: getRegionalMamaImage('GB') },
  { id: 'americas', source: getRegionalMamaImage('US') },
  { id: 'island', source: getRegionalMamaImage('AU') },
  { id: 'asia', source: getRegionalMamaImage('JP') },
];

export const MamaKitchenSplash: React.FC<Props> = ({ navigation, route }) => {
  const previewOnboarding = Boolean(route.params?.previewOnboarding);
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(10)).current;
  const mamasOpacity = useRef(new Animated.Value(0)).current;
  const mamasTranslateY = useRef(new Animated.Value(14)).current;
  const hasNavigated = useRef(false);

  const navigateNext = useCallback(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    const pass = preferencesStore.getKitchenPass();
    if (!previewOnboarding && pass.hasCompletedOnboarding) {
      navigation.replace('YourDailyEdit');
    } else {
      navigation.replace('MakeItYours');
    }
  }, [navigation, previewOnboarding]);

  const handleAnimationEnd = () => {
    // Fade in tagline + 5 regional Mama medallions once logo sequence lands
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
      Animated.sequence([
        Animated.delay(140),
        Animated.parallel([
          Animated.timing(mamasOpacity, {
            toValue: 1,
            duration: 380,
            useNativeDriver: true,
          }),
          Animated.timing(mamasTranslateY, {
            toValue: 0,
            duration: 380,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    // Smoothly route to next screen (slightly longer dwell in preview mode so user can admire it)
    const advanceTimer = setTimeout(() => {
      navigateNext();
    }, previewOnboarding ? 1200 : 850);

    return () => clearTimeout(advanceTimer);
  };

  return (
    <TouchableWithoutFeedback onPress={navigateNext}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar style="dark" />
        <KitchenAtmosphere period={getCurrentTimeOfDay()} />

        {/* Main Centered Content */}
        <View style={styles.content}>
          {/* Delicate signature rising steam wisps above logo */}
          <SteamWisps triggerKey="splash-steam" tint={colors.primary} style={styles.splashSteam} />

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

          {/* Signature 5 Cultural Mama Medallions Row */}
          <Animated.View
            style={[
              styles.mamasRow,
              {
                opacity: mamasOpacity,
                transform: [{ translateY: mamasTranslateY }],
              },
            ]}
          >
            {SPLASH_MAMAS.map((item, idx) => (
              <View
                key={item.id}
                style={[styles.mamaThumbWrap, idx > 0 && styles.mamaThumbOverlap]}
              >
                <Image source={item.source} style={styles.mamaThumb} resizeMode="cover" />
              </View>
            ))}
          </Animated.View>
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
  splashSteam: {
    marginBottom: -14,
    opacity: 0.55,
  },
  tagline: {
    marginTop: 24,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
    letterSpacing: 0.25,
  },
  mamasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  mamaThumbWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: colors.background,
    shadowColor: '#242820',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 3,
  },
  mamaThumbOverlap: {
    marginLeft: -8,
  },
  mamaThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
  },
});

export default MamaKitchenSplash;
