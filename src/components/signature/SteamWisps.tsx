import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MealPeriod } from '../../screens/04_daily_edit/mealCatalog';

interface SteamWispsProps {
  /** Change this key whenever a new meal snaps in or reveals to replay the delicate steam rise */
  triggerKey: string | number;
  style?: StyleProp<ViewStyle>;
  tint?: string;
}

/**
 * Signature Movement: "The Steam & Simmer"
 * 3 ultra-delicate translucent steam curls gently drift upward when a dish lands.
 * Runs 100% on the native animation thread (60 FPS).
 */
export const SteamWisps: React.FC<SteamWispsProps> = ({
  triggerKey,
  style,
  tint = '#FFFCF7',
}) => {
  const wisp1 = useRef(new Animated.Value(0)).current;
  const wisp2 = useRef(new Animated.Value(0)).current;
  const wisp3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    wisp1.setValue(0);
    wisp2.setValue(0);
    wisp3.setValue(0);

    const makeRise = (val: Animated.Value, delay: number, duration: number) =>
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(val, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);

    const anim = Animated.parallel([
      makeRise(wisp1, 40, 1950),
      makeRise(wisp2, 240, 2150),
      makeRise(wisp3, 460, 1850),
    ]);

    anim.start();
    return () => anim.stop();
  }, [triggerKey, wisp1, wisp2, wisp3]);

  const buildStyle = (val: Animated.Value, driftX: number) => ({
    opacity: val.interpolate({
      inputRange: [0, 0.22, 0.72, 1],
      outputRange: [0, 0.62, 0.34, 0],
    }),
    transform: [
      {
        translateY: val.interpolate({
          inputRange: [0, 1],
          outputRange: [12, -34],
        }),
      },
      {
        translateX: val.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, driftX, driftX * 0.4],
        }),
      },
      {
        scale: val.interpolate({
          inputRange: [0, 1],
          outputRange: [0.85, 1.18],
        }),
      },
    ],
  });

  return (
    <View style={[styles.steamContainer, style]} pointerEvents="none">
      <Animated.View style={[styles.wispWrap, buildStyle(wisp1, -6)]}>
        <Svg width={18} height={36} viewBox="0 0 18 36">
          <Path
            d="M9 34 C4 26, 14 19, 8 10 C6 6, 9 3, 10 1"
            fill="none"
            stroke={tint}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.wispWrap, styles.centerWisp, buildStyle(wisp2, 5)]}>
        <Svg width={20} height={42} viewBox="0 0 20 42">
          <Path
            d="M10 40 C15 30, 5 22, 11 11 C13 7, 10 3, 9 1"
            fill="none"
            stroke={tint}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.wispWrap, buildStyle(wisp3, 7)]}>
        <Svg width={16} height={32} viewBox="0 0 16 32">
          <Path
            d="M8 30 C12 23, 4 16, 9 8 C11 5, 8 2, 7 1"
            fill="none"
            stroke={tint}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

interface SimmerDotProps {
  period?: MealPeriod;
}

const DOT_COLOR: Record<MealPeriod, string> = {
  morning: '#D4A34A',
  lunch: '#66704A',
  dinner: '#C8643C',
  late_night: '#B88948',
};

/**
 * Tiny living stove-pilot breathing dot beside the active meal period label.
 */
export const SimmerDot: React.FC<SimmerDotProps> = ({ period = 'dinner' }) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(500),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const color = DOT_COLOR[period] || '#66704A';

  return (
    <View style={styles.dotWrap} pointerEvents="none">
      <Animated.View
        style={[
          styles.dotRing,
          {
            borderColor: color,
            opacity: pulse.interpolate({
              inputRange: [0, 0.3, 1],
              outputRange: [0.55, 0.35, 0],
            }),
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 2.2],
                }),
              },
            ],
          },
        ]}
      />
      <View style={[styles.dotCore, { backgroundColor: color }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  steamContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 10,
    height: 44,
  },
  wispWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerWisp: {
    marginBottom: 4,
  },
  dotWrap: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotRing: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.2,
  },
  dotCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
