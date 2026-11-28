import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  StyleProp,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MamaCharacter, MamaPose } from '../common/MamaCharacter';

const MAMA_AFRICA = require('../../../assets/mamas/mama-africa.png');
const MAMA_ASIA = require('../../../assets/mamas/mama-asia.png');
const MAMA_ISLAND = require('../../../assets/mamas/mama-island.png');
const MAMA_EUROPE = require('../../../assets/mamas/mama-europe.png');
const MAMA_AMERICAS = require('../../../assets/mamas/mama-americas.png');

export type MamaRegionKey = 'africa' | 'asia' | 'island' | 'europe' | 'americas';

const REGION_BY_COUNTRY: Record<string, MamaRegionKey> = {
  NG: 'africa', GH: 'africa', KE: 'africa', ZA: 'africa', SN: 'africa', CM: 'africa',
  CI: 'africa', ET: 'africa', UG: 'africa', TZ: 'africa', RW: 'africa', ZW: 'africa',
  BJ: 'africa', TG: 'africa', SL: 'africa', LR: 'africa', EG: 'africa', MA: 'africa',
  US: 'americas', CA: 'americas',
  GB: 'europe', UK: 'europe', EU: 'europe', FR: 'europe', IT: 'europe', DE: 'europe',
  ES: 'europe', NL: 'europe', IE: 'europe', PT: 'europe', BE: 'europe', CH: 'europe',
  AT: 'europe', SE: 'europe', NO: 'europe', DK: 'europe', PL: 'europe', GR: 'europe',
  AU: 'island', NZ: 'island', JM: 'island', TT: 'island', BB: 'island', BS: 'island',
  GD: 'island', LC: 'island', PR: 'island', DO: 'island', HT: 'island', BR: 'island',
  MX: 'island', CO: 'island', PE: 'island', AR: 'island', CL: 'island', FJ: 'island',
  CN: 'asia', JP: 'asia', KR: 'asia', IN: 'asia', PH: 'asia', SG: 'asia', MY: 'asia',
  TH: 'asia', VN: 'asia', ID: 'asia', PK: 'asia', BD: 'asia', LK: 'asia', TW: 'asia',
  HK: 'asia', AE: 'asia', SA: 'asia',
};

const MAMA_IMAGE_BY_REGION: Record<MamaRegionKey, ImageSourcePropType> = {
  africa: MAMA_AFRICA,
  asia: MAMA_ASIA,
  island: MAMA_ISLAND,
  europe: MAMA_EUROPE,
  americas: MAMA_AMERICAS,
};

export function resolveMamaRegion(countryCode?: string, cuisineAnchor?: string): MamaRegionKey {
  const code = (countryCode || '').trim().toUpperCase();
  if (code && REGION_BY_COUNTRY[code]) {
    return REGION_BY_COUNTRY[code];
  }
  const cuisine = (cuisineAnchor || '').toLowerCase();
  if (cuisine.includes('asian')) return 'asia';
  if (cuisine.includes('caribbean') || cuisine.includes('latin')) return 'island';
  if (cuisine.includes('europe') || cuisine.includes('mediterranean')) return 'europe';
  if (cuisine.includes('american')) return 'americas';
  return 'africa';
}

export function getRegionalMamaImage(
  countryCode?: string,
  cuisineAnchor?: string,
): ImageSourcePropType {
  const region = resolveMamaRegion(countryCode, cuisineAnchor);
  return MAMA_IMAGE_BY_REGION[region];
}

interface RegionalMamaAvatarProps {
  countryCode?: string;
  cuisineAnchor?: string;
  size?: number;
  pose?: MamaPose;
  /** Smoothly coin-flips to the Living Mama Bowl mascot every few seconds, then back */
  alternateWithMascot?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Header Medallion: shows the real Country Mama portrait matching the user's selected
 * country, and occasionally coin-flips to the Living Mama Bowl mascot before flipping back.
 */
export const RegionalMamaAvatar: React.FC<RegionalMamaAvatarProps> = ({
  countryCode,
  cuisineAnchor,
  size = 40,
  pose = 'welcoming',
  alternateWithMascot = true,
  onPress,
  style,
}) => {
  const region = resolveMamaRegion(countryCode, cuisineAnchor);
  const mamaImage = MAMA_IMAGE_BY_REGION[region];

  const [showingMascot, setShowingMascot] = useState(false);
  const flipDeg = useRef(new Animated.Value(0)).current;
  const popScale = useRef(new Animated.Value(1)).current;
  const prevRegionRef = useRef<MamaRegionKey>(region);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const runCoinFlip = useRef((toMascot: boolean) => {
    Animated.parallel([
      Animated.timing(flipDeg, {
        toValue: 90,
        duration: 190,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(popScale, {
        toValue: 0.9,
        duration: 190,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished || !isMountedRef.current) return;
      setShowingMascot(toMascot);
      flipDeg.setValue(-90);
      Animated.parallel([
        Animated.timing(flipDeg, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.back(1.35)),
          useNativeDriver: true,
        }),
        Animated.spring(popScale, {
          toValue: 1,
          friction: 5.5,
          tension: 140,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }).current;

  // When user changes country, immediately coin-flip to reveal the new country's Mama
  useEffect(() => {
    if (prevRegionRef.current === region) return;
    prevRegionRef.current = region;
    runCoinFlip(false);
  }, [region, runCoinFlip]);

  // Occasional gentle coin-flip: Country Mama (~8.5s) -> Living Mama Bowl (~3.2s) -> Country Mama
  useEffect(() => {
    if (!alternateWithMascot) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let nextShowMascot = true;

    const scheduleNext = () => {
      const waitMs = nextShowMascot ? 8500 : 3200;
      timer = setTimeout(() => {
        if (!isMountedRef.current) return;
        const target = nextShowMascot;
        nextShowMascot = !nextShowMascot;
        runCoinFlip(target);
        scheduleNext();
      }, waitMs);
    };

    scheduleNext();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [alternateWithMascot, region, runCoinFlip]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.sequence([
      Animated.timing(popScale, { toValue: 0.9, duration: 75, useNativeDriver: true }),
      Animated.spring(popScale, { toValue: 1, friction: 5, tension: 160, useNativeDriver: true }),
    ]).start();
    onPress?.();
  };

  const rotateY = flipDeg.interpolate({
    inputRange: [-90, 0, 90],
    outputRange: ['-90deg', '0deg', '90deg'],
  });

  const innerSize = Math.round(size * 0.96);

  const badge = (
    <Animated.View
      style={[
        styles.badgeWrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: showingMascot ? '#58673A' : '#F3EDE2',
          transform: [{ perspective: 600 }, { rotateY }, { scale: popScale }],
        },
        style,
      ]}
    >
      {showingMascot ? (
        <MamaCharacter pose={pose} size={innerSize} isSpeaking={false} hideArms />
      ) : (
        <Image source={mamaImage} style={styles.mamaPhoto} resizeMode="cover" />
      )}
    </Animated.View>
  );

  if (!onPress) return badge;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.88}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel="Open Mama Dish settings"
    >
      {badge}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badgeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(205, 162, 88, 0.72)',
    shadowColor: '#242820',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 3,
  },
  mamaPhoto: {
    width: '100%',
    height: '100%',
  },
});
