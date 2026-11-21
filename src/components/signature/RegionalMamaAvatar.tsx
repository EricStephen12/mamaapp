import React, { useEffect, useRef } from 'react';
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ImageSourcePropType,
  StyleProp,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';

const MAMA_AFRICA = require('../../../assets/mamas/mama-africa.png');
const MAMA_ASIA = require('../../../assets/mamas/mama-asia.png');
const MAMA_ISLAND = require('../../../assets/mamas/mama-island.png');
const MAMA_EUROPE = require('../../../assets/mamas/mama-europe.png');
const MAMA_AMERICAS = require('../../../assets/mamas/mama-americas.png');

export type MamaRegionKey = 'africa' | 'asia' | 'island' | 'europe' | 'americas';

const REGION_BY_COUNTRY: Record<string, MamaRegionKey> = {
  // Africa
  NG: 'africa',
  GH: 'africa',
  KE: 'africa',
  ZA: 'africa',
  SN: 'africa',
  CM: 'africa',
  CI: 'africa',
  ET: 'africa',
  UG: 'africa',
  TZ: 'africa',
  RW: 'africa',
  ZW: 'africa',
  BJ: 'africa',
  TG: 'africa',
  SL: 'africa',
  LR: 'africa',
  EG: 'africa',
  MA: 'africa',

  // North America
  US: 'americas',
  CA: 'americas',

  // Europe & UK
  GB: 'europe',
  UK: 'europe',
  EU: 'europe',
  FR: 'europe',
  IT: 'europe',
  DE: 'europe',
  ES: 'europe',
  NL: 'europe',
  IE: 'europe',
  PT: 'europe',
  BE: 'europe',
  CH: 'europe',
  AT: 'europe',
  SE: 'europe',
  NO: 'europe',
  DK: 'europe',
  PL: 'europe',
  GR: 'europe',

  // Australia, Pacific, Caribbean & Latin America
  AU: 'island',
  NZ: 'island',
  JM: 'island',
  TT: 'island',
  BB: 'island',
  BS: 'island',
  GD: 'island',
  LC: 'island',
  PR: 'island',
  DO: 'island',
  HT: 'island',
  BR: 'island',
  MX: 'island',
  CO: 'island',
  PE: 'island',
  AR: 'island',
  CL: 'island',
  FJ: 'island',

  // Asia & Middle East
  CN: 'asia',
  JP: 'asia',
  KR: 'asia',
  IN: 'asia',
  PH: 'asia',
  SG: 'asia',
  MY: 'asia',
  TH: 'asia',
  VN: 'asia',
  ID: 'asia',
  PK: 'asia',
  BD: 'asia',
  LK: 'asia',
  TW: 'asia',
  HK: 'asia',
  AE: 'asia',
  SA: 'asia',
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
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Country-matched illustrated Mama medallion displayed beside the "Mama" brand header.
 * Automatically updates with a gentle pop whenever the user switches countries.
 */
export const RegionalMamaAvatar: React.FC<RegionalMamaAvatarProps> = ({
  countryCode,
  cuisineAnchor,
  size = 38,
  onPress,
  style,
}) => {
  const region = resolveMamaRegion(countryCode, cuisineAnchor);
  const source = MAMA_IMAGE_BY_REGION[region];
  const popScale = useRef(new Animated.Value(1)).current;
  const prevRegionRef = useRef<MamaRegionKey>(region);

  // Tactile pop whenever the user switches to a country with a different regional Mama
  useEffect(() => {
    if (prevRegionRef.current === region) return;
    prevRegionRef.current = region;
    popScale.setValue(0.82);
    Animated.spring(popScale, {
      toValue: 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  }, [region, popScale]);

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    Animated.sequence([
      Animated.timing(popScale, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.spring(popScale, { toValue: 1, friction: 5, tension: 160, useNativeDriver: true }),
    ]).start();
    onPress?.();
  };

  const content = (
    <Animated.View
      style={[
        styles.shadowWrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ scale: popScale }],
        },
        style,
      ]}
    >
      <Image
        source={source}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    </Animated.View>
  );

  if (!onPress) return content;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.88}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel="Switch country and regional Mama"
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  shadowWrap: {
    shadowColor: '#242820',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 4,
  },
});

