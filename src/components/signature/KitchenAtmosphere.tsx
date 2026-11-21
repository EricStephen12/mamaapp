import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Defs, Pattern, Path, Circle, Rect } from 'react-native-svg';
import { MealPeriod } from '../../screens/04_daily_edit/mealCatalog';

interface KitchenAtmosphereProps {
  period?: MealPeriod;
}

const PERIOD_AURA: Record<MealPeriod, { primary: string; secondary: string }> = {
  morning: {
    primary: 'rgba(218, 179, 108, 0.16)', // Sunlit honey
    secondary: 'rgba(102, 112, 74, 0.09)', // Soft morning sage
  },
  lunch: {
    primary: 'rgba(130, 150, 94, 0.13)', // Warm garden olive
    secondary: 'rgba(212, 184, 134, 0.12)', // Warm parchment
  },
  dinner: {
    primary: 'rgba(196, 118, 76, 0.14)', // Toasted ember terracotta
    secondary: 'rgba(102, 112, 74, 0.10)', // Deep olive
  },
  late_night: {
    primary: 'rgba(168, 128, 72, 0.15)', // Stove-light amber
    secondary: 'rgba(36, 40, 32, 0.08)', // Hearth charcoal
  },
};

/**
 * Signature Mama Kitchen Living Canvas:
 * 1. Faint woven heritage Adire / table-linen geometric motif (2.5-3.5% opacity)
 * 2. Slow-breathing time-of-day ambient kitchen aura (60 FPS native driver)
 */
export const KitchenAtmosphere: React.FC<KitchenAtmosphereProps> = ({
  period = 'dinner',
}) => {
  const breatheAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breatheAnim]);

  const aura = PERIOD_AURA[period] || PERIOD_AURA.dinner;

  const orb1Scale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.08],
  });
  const orb1TranslateY = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });
  const orb2Scale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.05, 0.94],
  });
  const orb2TranslateX = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });

  return (
    <View style={styles.root} pointerEvents="none">
      {/* 1. Slow-Breathing Time-of-Day Kitchen Aura */}
      <Animated.View
        style={[
          styles.primaryOrb,
          {
            backgroundColor: aura.primary,
            transform: [{ scale: orb1Scale }, { translateY: orb1TranslateY }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.secondaryOrb,
          {
            backgroundColor: aura.secondary,
            transform: [{ scale: orb2Scale }, { translateX: orb2TranslateX }],
          },
        ]}
      />

      {/* 2. Ultra-Subtle Heritage Woven Linen / Adire Motif */}
      <Svg width="100%" height="100%" style={styles.patternLayer}>
        <Defs>
          <Pattern
            id="mamaHeritageLinen"
            width="44"
            height="44"
            patternUnits="userSpaceOnUse"
          >
            {/* Delicate diamond weave */}
            <Path
              d="M22 2 L42 22 L22 42 L2 22 Z"
              fill="none"
              stroke="#66704A"
              strokeWidth="0.65"
              strokeOpacity="0.065"
            />
            {/* Tiny artisan stitch dot at intersection */}
            <Circle cx="22" cy="22" r="1.2" fill="#242820" fillOpacity="0.05" />
            <Circle cx="2" cy="2" r="0.85" fill="#66704A" fillOpacity="0.055" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#mamaHeritageLinen)" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  primaryOrb: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  secondaryOrb: {
    position: 'absolute',
    top: 260,
    left: -110,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  patternLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
