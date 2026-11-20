import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import Svg, {
  Polygon,
  Ellipse,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';

export interface RollingDiceProps {
  size?: number;
  isRolling?: boolean;
  onPress?: () => void;
  onRollComplete?: () => void;
}

// Authentic 3D dice orientations (Opposite sides strictly sum to 7)
const VALID_DICE_CONFIGS = [
  { top: 1, left: 2, right: 3 },
  { top: 2, left: 6, right: 3 },
  { top: 3, left: 1, right: 2 },
  { top: 4, left: 6, right: 2 },
  { top: 5, left: 1, right: 4 },
  { top: 6, left: 3, right: 5 },
  { top: 1, left: 3, right: 5 },
  { top: 2, left: 4, right: 1 },
  { top: 3, left: 5, right: 6 },
  { top: 4, left: 1, right: 5 },
  { top: 5, left: 4, right: 6 },
  { top: 6, left: 2, right: 4 },
];

interface PipCoords {
  s: number;
  t: number;
}

function getPipsForFace(val: number): PipCoords[] {
  const c = 0.52; // Offset distance from center
  switch (val) {
    case 1:
      return [{ s: 0, t: 0 }];
    case 2:
      return [
        { s: -c, t: -c },
        { s: c, t: c },
      ];
    case 3:
      return [
        { s: -c, t: -c },
        { s: 0, t: 0 },
        { s: c, t: c },
      ];
    case 4:
      return [
        { s: -c, t: -c },
        { s: c, t: -c },
        { s: -c, t: c },
        { s: c, t: c },
      ];
    case 5:
      return [
        { s: -c, t: -c },
        { s: c, t: -c },
        { s: 0, t: 0 },
        { s: -c, t: c },
        { s: c, t: c },
      ];
    case 6:
    default:
      return [
        { s: -c, t: -c },
        { s: c, t: -c },
        { s: -c, t: 0 },
        { s: c, t: 0 },
        { s: -c, t: c },
        { s: c, t: c },
      ];
  }
}

export const RollingDice: React.FC<RollingDiceProps> = ({
  size = 130,
  isRolling = false,
  onPress,
  onRollComplete,
}) => {
  // Current orientation of the 3D dice
  const [config, setConfig] = useState(VALID_DICE_CONFIGS[0]);

  // Animation values
  const translateY = useRef(new Animated.Value(0)).current;
  const rotateZ = useRef(new Animated.Value(0)).current;
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;
  const squashX = useRef(new Animated.Value(1)).current;
  const squashY = useRef(new Animated.Value(1)).current;
  const shadowScale = useRef(new Animated.Value(1)).current;
  const shadowOpacity = useRef(new Animated.Value(0.35)).current;

  // Luxury idle floating & tactile press values
  const hoverAnim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const hoverLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Gentle harmonic idle floating when resting (gives high-end weightless physics)
  useEffect(() => {
    if (!isRolling) {
      hoverLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(hoverAnim, {
            toValue: 1,
            duration: 2100,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(hoverAnim, {
            toValue: 0,
            duration: 2100,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      hoverLoopRef.current.start();
    } else {
      if (hoverLoopRef.current) hoverLoopRef.current.stop();
      hoverAnim.setValue(0);
    }

    return () => {
      if (hoverLoopRef.current) hoverLoopRef.current.stop();
    };
  }, [isRolling, hoverAnim]);

  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startRollAnimation = useCallback(() => {
    // 1. Crisp, well-timed face shifts at jump apexes (avoids 60ms SVG re-render thrashing)
    let rollTicks = 0;
    const maxTicks = 4;
    if (cycleTimerRef.current) clearInterval(cycleTimerRef.current);

    cycleTimerRef.current = setInterval(() => {
      rollTicks += 1;
      const nextIdx = Math.floor(Math.random() * VALID_DICE_CONFIGS.length);
      setConfig(VALID_DICE_CONFIGS[nextIdx]);

      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Haptics optional
      }

      if (rollTicks >= maxTicks) {
        if (cycleTimerRef.current) clearInterval(cycleTimerRef.current);
      }
    }, 170);

    // 2. Luxury double-tumble physics — ALWAYS finishes upright at exact 720deg
    const jumpDistance = -Math.round(size * 0.46);
    rotateZ.setValue(0);
    tiltX.setValue(0);
    tiltY.setValue(0);
    translateY.setValue(0);
    squashX.setValue(1);
    squashY.setValue(1);
    shadowScale.setValue(1);
    shadowOpacity.setValue(0.35);

    Animated.parallel([
      // Silky 720-degree double-spin so it ALWAYS finishes upright
      Animated.timing(rotateZ, {
        toValue: 1,
        duration: 740,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }),
      Animated.timing(tiltX, {
        toValue: 1,
        duration: 740,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }),
      Animated.timing(tiltY, {
        toValue: 1,
        duration: 740,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }),

      // Airborne jump, landing squash, and elastic spring settle
      Animated.sequence([
        // Jump apex
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: jumpDistance,
            duration: 310,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(squashX, {
            toValue: 0.93,
            duration: 310,
            useNativeDriver: true,
          }),
          Animated.timing(squashY, {
            toValue: 1.1,
            duration: 310,
            useNativeDriver: true,
          }),
          Animated.timing(shadowScale, {
            toValue: 0.45,
            duration: 310,
            useNativeDriver: true,
          }),
          Animated.timing(shadowOpacity, {
            toValue: 0.12,
            duration: 310,
            useNativeDriver: true,
          }),
        ]),

        // Ground landing (impact squash)
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 240,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(squashX, {
            toValue: 1.18,
            duration: 90,
            useNativeDriver: true,
          }),
          Animated.timing(squashY, {
            toValue: 0.85,
            duration: 90,
            useNativeDriver: true,
          }),
          Animated.timing(shadowScale, {
            toValue: 1.22,
            duration: 90,
            useNativeDriver: true,
          }),
          Animated.timing(shadowOpacity, {
            toValue: 0.48,
            duration: 90,
            useNativeDriver: true,
          }),
        ]),

        // Elastic settle back to resting state
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            friction: 5,
            tension: 90,
            useNativeDriver: true,
          }),
          Animated.spring(squashX, {
            toValue: 1,
            friction: 5,
            tension: 90,
            useNativeDriver: true,
          }),
          Animated.spring(squashY, {
            toValue: 1,
            friction: 5,
            tension: 90,
            useNativeDriver: true,
          }),
          Animated.spring(shadowScale, {
            toValue: 1,
            friction: 5,
            tension: 90,
            useNativeDriver: true,
          }),
          Animated.spring(shadowOpacity, {
            toValue: 0.35,
            friction: 5,
            tension: 90,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        // Haptics optional
      }
      if (onRollComplete) onRollComplete();
    });
  }, [size, rotateZ, tiltX, tiltY, translateY, squashX, squashY, shadowScale, shadowOpacity, onRollComplete]);

  // Roll trigger on prop change
  useEffect(() => {
    if (isRolling) {
      startRollAnimation();
    }
  }, [isRolling, startRollAnimation]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (cycleTimerRef.current) clearInterval(cycleTimerRef.current);
    };
  }, []);

  const spinZ = rotateZ.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  const tiltXInterpolated = tiltX.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '22deg', '0deg'],
  });

  const tiltYInterpolated = tiltY.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '-22deg', '0deg'],
  });

  // Floating micro-motion interpolations for weightless physics
  const floatY = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const floatShadowScale = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.88],
  });

  const floatShadowOpacity = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.72],
  });

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.93,
      useNativeDriver: true,
      tension: 250,
      friction: 12,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 180,
      friction: 8,
    }).start();
  };

  // Render Top Face Pips (Isometric projection from local s, t)
  const renderTopPips = () => {
    const pips = getPipsForFace(config.top);
    return pips.map((pip, idx) => {
      // Basis vector transform for 3D top diamond: center=(60, 36)
      const cx = 60 + 21 * pip.s + 21 * pip.t;
      const cy = 36 - 12 * pip.s + 12 * pip.t;
      const isCenterOne = config.top === 1 && pip.s === 0 && pip.t === 0;

      return (
        <Ellipse
          key={`top-${idx}`}
          cx={cx}
          cy={cy}
          rx={isCenterOne ? 8.5 : 5.6}
          ry={isCenterOne ? 4.8 : 3.2}
          fill={isCenterOne ? '#C85A32' : colors.primary}
        />
      );
    });
  };

  // Render Left Face Pips (Isometric projection from local s, t)
  const renderLeftPips = () => {
    const pips = getPipsForFace(config.left);
    return pips.map((pip, idx) => {
      // Basis vector transform for 3D left face: center=(39, 73)
      const cx = 39 + 21 * pip.s;
      const cy = 73 + 10 * pip.s + 25 * pip.t;

      return (
        <Ellipse
          key={`left-${idx}`}
          cx={cx}
          cy={cy}
          rx={4.4}
          ry={6.4}
          transform={`rotate(-15, ${cx}, ${cy})`}
          fill="rgba(46, 61, 43, 0.9)"
        />
      );
    });
  };

  // Render Right Face Pips (Isometric projection from local s, t)
  const renderRightPips = () => {
    const pips = getPipsForFace(config.right);
    return pips.map((pip, idx) => {
      // Basis vector transform for 3D right face: center=(81, 73)
      const cx = 81 + 21 * pip.s;
      const cy = 73 - 10 * pip.s + 25 * pip.t;

      return (
        <Ellipse
          key={`right-${idx}`}
          cx={cx}
          cy={cy}
          rx={4.4}
          ry={6.4}
          transform={`rotate(15, ${cx}, ${cy})`}
          fill="rgba(46, 61, 43, 0.85)"
        />
      );
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, { width: size + 20, height: size + 24 }]}
    >
      {/* 3D Floor Shadow with float tracking */}
      <Animated.View
        style={[
          styles.shadowContainer,
          {
            transform: [{ scale: floatShadowScale }],
            opacity: floatShadowOpacity,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.shadow,
            {
              width: size * 0.86,
              height: size * 0.22,
              borderRadius: (size * 0.22) / 2,
              transform: [{ scaleX: shadowScale }, { scaleY: shadowScale }],
              opacity: shadowOpacity,
            },
          ]}
        />
      </Animated.View>

      {/* 3D Tumbling Cube with Perspective & Luxury Micro-Float */}
      <Animated.View
        style={[
          styles.floatContainer,
          {
            transform: [{ translateY: floatY }, { scale: pressScale }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.cubeWrapper,
            {
              width: size,
              height: size,
              transform: [
                { perspective: 900 },
                { translateY },
                { rotateZ: spinZ },
                { rotateX: tiltXInterpolated },
                { rotateY: tiltYInterpolated },
                { scaleX: squashX },
                { scaleY: squashY },
              ],
            },
          ]}
        >
        <Svg width={size} height={size} viewBox="0 0 120 120">
          <Defs>
            {/* Top Face Light Gradient */}
            <LinearGradient id="topFaceGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="100%" stopColor="#F8F5EE" />
            </LinearGradient>

            {/* Left Face Ambient Shadow Gradient */}
            <LinearGradient id="leftFaceGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#EDE6D6" />
              <Stop offset="100%" stopColor="#DDD4C2" />
            </LinearGradient>

            {/* Right Face Depth Shadow Gradient */}
            <LinearGradient id="rightFaceGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#D8CEBC" />
              <Stop offset="100%" stopColor="#C2B6A2" />
            </LinearGradient>

            {/* Beveled Edge Stroke Gradient */}
            <LinearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#D5CDBC" />
              <Stop offset="100%" stopColor="#B3A792" />
            </LinearGradient>
          </Defs>

          {/* 1. Left Face of 3D Cube */}
          <Polygon
            points="18,38 60,58 60,108 18,84"
            fill="url(#leftFaceGrad)"
            stroke="url(#edgeGrad)"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* 2. Right Face of 3D Cube */}
          <Polygon
            points="60,58 102,38 102,84 60,108"
            fill="url(#rightFaceGrad)"
            stroke="url(#edgeGrad)"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* 3. Top Face of 3D Cube */}
          <Polygon
            points="60,14 102,38 60,58 18,38"
            fill="url(#topFaceGrad)"
            stroke="url(#edgeGrad)"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Real Math-Aligned Isometric Pips */}
          {renderTopPips()}
          {renderLeftPips()}
          {renderRightPips()}
        </Svg>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadowContainer: {
    position: 'absolute',
    bottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    backgroundColor: 'rgba(36, 40, 32, 0.32)',
  },
  floatContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cubeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 6,
  },
});
