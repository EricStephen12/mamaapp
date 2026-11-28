import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import Svg, {
  Circle,
  Ellipse,
  G,
  Path,
  Rect,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';

export type MamaPose =
  | 'welcoming'
  | 'thinking'
  | 'writing'
  | 'delighted'
  | 'cooking'
  | 'judging'
  | 'hungry'
  | 'shaking';

interface MamaCharacterProps {
  pose?: MamaPose;
  size?: number;
  style?: ViewStyle;
  isSpeaking?: boolean;
  reactionKey?: string | number;
  hideStaticDice?: boolean;
  hideArms?: boolean;
  onPress?: () => void;
}

/**
 * The Living Mama Bowl — faithful 60fps React Native port of our approved
 * Pixar/Duolingo mascot rig:
 * - Warm 3D-shaded cream ceramic bowl + matte-gold foot + floating golden "M" steam
 * - Independently articulated stubby ceramic arms (flailing in Shake, waving in Happy,
 *   shaking the wooden spoon in Judge side-eye, cheering in Cooked/Delighted!)
 * - Grounded contact shadow that shrinks as Mama leaps into the air
 * - Jelly squash-and-stretch + fast comedy shimmy + organic blinking + tap-to-poke squish
 */
export const MamaCharacter: React.FC<MamaCharacterProps> = ({
  pose = 'welcoming',
  size = 110,
  style,
  isSpeaking = true,
  reactionKey,
  hideStaticDice = false,
  hideArms = false,
  onPress,
}) => {
  // Independent native-driver motion channels for fluid cartoon physics
  const breathAnim = useRef(new Animated.Value(0)).current;
  const steamAnim = useRef(new Animated.Value(0)).current;
  const shimmyX = useRef(new Animated.Value(0)).current;
  const hopY = useRef(new Animated.Value(0)).current;
  const rockRot = useRef(new Animated.Value(0)).current;
  const jellySquash = useRef(new Animated.Value(0)).current;
  const leftArmAnim = useRef(new Animated.Value(0)).current;
  const rightArmAnim = useRef(new Animated.Value(0)).current;
  const tapSquish = useRef(new Animated.Value(1)).current;
  const reactTilt = useRef(new Animated.Value(0)).current;

  const isFirstReactionRef = useRef(true);
  const [isBlinking, setIsBlinking] = useState(false);

  const isShaking = pose === 'shaking';
  const isJudging = pose === 'judging';
  const isDelighted = pose === 'delighted';
  const isHungry = pose === 'hungry';
  const isHappyIdle = !isShaking && !isJudging && !isDelighted && !isHungry;

  // 1. Natural organic eye blink timer
  useEffect(() => {
    let blinkTimeout: ReturnType<typeof setTimeout> | null = null;
    let unblinkTimeout: ReturnType<typeof setTimeout> | null = null;

    const scheduleBlink = () => {
      const waitMs = 2400 + Math.floor(Math.random() * 2600);
      blinkTimeout = setTimeout(() => {
        setIsBlinking(true);
        unblinkTimeout = setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 135);
      }, waitMs);
    };

    scheduleBlink();
    return () => {
      if (blinkTimeout) clearTimeout(blinkTimeout);
      if (unblinkTimeout) clearTimeout(unblinkTimeout);
    };
  }, []);

  // 2. Mood-driven 60fps multi-channel cartoon kinematics (matches mama_bowl_mascot_demo.html!)
  useEffect(() => {
    breathAnim.setValue(0);
    steamAnim.setValue(0);
    shimmyX.setValue(0);
    hopY.setValue(0);
    rockRot.setValue(0);
    jellySquash.setValue(0);
    leftArmAnim.setValue(0);
    rightArmAnim.setValue(0);

    const loops: Animated.CompositeAnimation[] = [];

    const startLoop = (anim: Animated.CompositeAnimation) => {
      const l = Animated.loop(anim);
      loops.push(l);
      l.start();
    };

    if (isShaking) {
      // EXACT DEMO SHAKE: fast hilarious side-to-side shimmy + bouncing air hops + ±15° rock + jelly squash + wildly flailing arms!
      startLoop(
        Animated.sequence([
          Animated.timing(shimmyX, { toValue: 1, duration: 75, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(shimmyX, { toValue: -1, duration: 75, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      startLoop(
        Animated.sequence([
          Animated.timing(hopY, { toValue: 1, duration: 155, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(hopY, { toValue: 0, duration: 155, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ])
      );
      startLoop(
        Animated.sequence([
          Animated.timing(rockRot, { toValue: 1, duration: 95, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(rockRot, { toValue: -1, duration: 95, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      startLoop(
        Animated.sequence([
          Animated.timing(jellySquash, { toValue: 1, duration: 120, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(jellySquash, { toValue: -1, duration: 120, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      startLoop(
        Animated.sequence([
          Animated.timing(steamAnim, { toValue: 1, duration: 125, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(steamAnim, { toValue: -1, duration: 125, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      startLoop(
        Animated.sequence([
          Animated.timing(leftArmAnim, { toValue: 1, duration: 110, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(leftArmAnim, { toValue: -1, duration: 110, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      startLoop(
        Animated.sequence([
          Animated.timing(rightArmAnim, { toValue: -1, duration: 110, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(rightArmAnim, { toValue: 1, duration: 110, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
    } else if (isDelighted) {
      // EXACT DEMO COOKED!: Joyful bouncing celebration hop + arms cheering + golden steam glow!
      startLoop(
        Animated.sequence([
          Animated.timing(hopY, { toValue: 1, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(hopY, { toValue: 0, duration: 240, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ])
      );
      startLoop(
        Animated.sequence([
          Animated.timing(jellySquash, { toValue: -1, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(jellySquash, { toValue: 1, duration: 240, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ])
      );
      startLoop(
        Animated.sequence([
          Animated.timing(steamAnim, { toValue: 1, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(steamAnim, { toValue: 0, duration: 240, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ])
      );
      startLoop(
        Animated.sequence([
          Animated.timing(leftArmAnim, { toValue: 1, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(leftArmAnim, { toValue: 0, duration: 240, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ])
      );
      startLoop(
        Animated.sequence([
          Animated.timing(rightArmAnim, { toValue: 1, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(rightArmAnim, { toValue: 0, duration: 240, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ])
      );
    } else if (isJudging) {
      // EXACT DEMO JUDGE: Subtle breathing, tilted -4deg, right arm rapidly shaking the wooden spoon!
      startLoop(
        Animated.sequence([
          Animated.timing(breathAnim, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(breathAnim, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      startLoop(
        Animated.sequence([
          Animated.timing(steamAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(steamAnim, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      // Shaking wooden spoon rhythm!
      startLoop(
        Animated.sequence([
          Animated.timing(rightArmAnim, { toValue: 1, duration: 150, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(rightArmAnim, { toValue: -1, duration: 150, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
    } else if (isHungry) {
      // EXACT DEMO HUNGRY: Dramatic 7 PM starving melt + gentle sad wobble
      startLoop(
        Animated.sequence([
          Animated.timing(breathAnim, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(breathAnim, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      startLoop(
        Animated.sequence([
          Animated.timing(rockRot, { toValue: 1, duration: 820, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(rockRot, { toValue: -1, duration: 820, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      startLoop(
        Animated.sequence([
          Animated.timing(steamAnim, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(steamAnim, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
    } else {
      // EXACT DEMO HAPPY IDLE: Soft joyful breathing bounce + gentle jelly squash + friendly left-arm wave!
      startLoop(
        Animated.sequence([
          Animated.timing(breathAnim, { toValue: 1, duration: 950, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(breathAnim, { toValue: 0, duration: 950, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      startLoop(
        Animated.sequence([
          Animated.timing(steamAnim, { toValue: 1, duration: 750, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(steamAnim, { toValue: 0, duration: 750, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      startLoop(
        Animated.sequence([
          Animated.timing(leftArmAnim, { toValue: 1, duration: 480, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(leftArmAnim, { toValue: -1, duration: 480, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
    }

    return () => {
      loops.forEach((l) => l.stop());
    };
  }, [
    isShaking,
    isDelighted,
    isJudging,
    isHungry,
    breathAnim,
    steamAnim,
    shimmyX,
    hopY,
    rockRot,
    jellySquash,
    leftArmAnim,
    rightArmAnim,
  ]);

  // 3. Cute tactile tilt bounce whenever reactionKey changes
  useEffect(() => {
    if (isFirstReactionRef.current) {
      isFirstReactionRef.current = false;
      return;
    }
    Animated.sequence([
      Animated.timing(reactTilt, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(reactTilt, { toValue: -0.7, duration: 110, useNativeDriver: true }),
      Animated.spring(reactTilt, { toValue: 0, friction: 5, tension: 140, useNativeDriver: true }),
    ]).start();
  }, [reactionKey, reactTilt]);

  // 4. Tap-to-poke rubbery spring squish + haptic feedback
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.sequence([
      Animated.timing(tapSquish, { toValue: 0.84, duration: 75, useNativeDriver: true }),
      Animated.spring(tapSquish, {
        toValue: 1.09,
        friction: 4,
        tension: 220,
        useNativeDriver: true,
      }),
      Animated.spring(tapSquish, {
        toValue: 1,
        friction: 5,
        tension: 160,
        useNativeDriver: true,
      }),
    ]).start();
    onPress?.();
  };

  // Scale-proportional displacements so 44px badges & 210px hero stages both look perfect!
  const k = size / 260;

  const bodyTranslateX = isShaking
    ? shimmyX.interpolate({ inputRange: [-1, 1], outputRange: [-13 * k, 13 * k] })
    : 0;

  const bodyTranslateY = isShaking
    ? hopY.interpolate({ inputRange: [0, 1], outputRange: [2 * k, -19 * k] })
    : isDelighted
      ? hopY.interpolate({ inputRange: [0, 1], outputRange: [2 * k, -22 * k] })
      : isHungry
        ? breathAnim.interpolate({ inputRange: [0, 1], outputRange: [8 * k, 11 * k] })
        : isJudging
          ? breathAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 2.5 * k] })
          : breathAnim.interpolate({ inputRange: [0, 1], outputRange: [1 * k, -6 * k] });

  const bodyRotate = isShaking
    ? rockRot.interpolate({ inputRange: [-1, 1], outputRange: ['-15deg', '15deg'] })
    : isHungry
      ? rockRot.interpolate({ inputRange: [-1, 1], outputRange: ['-16deg', '-8deg'] })
      : isJudging
        ? '-4deg'
        : reactTilt.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-8deg', '0deg', '8deg'] });

  const bodyScaleX = isShaking
    ? jellySquash.interpolate({ inputRange: [-1, 1], outputRange: [0.92, 1.09] })
    : isDelighted
      ? jellySquash.interpolate({ inputRange: [-1, 1], outputRange: [0.94, 1.06] })
      : isHungry
        ? 1.09
        : isHappyIdle
          ? breathAnim.interpolate({ inputRange: [0, 1], outputRange: [1.03, 0.97] })
          : 1;

  const bodyScaleY = isShaking
    ? jellySquash.interpolate({ inputRange: [-1, 1], outputRange: [1.09, 0.92] })
    : isDelighted
      ? jellySquash.interpolate({ inputRange: [-1, 1], outputRange: [1.07, 0.94] })
      : isHungry
        ? 0.89
        : isHappyIdle
          ? breathAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.03] })
          : 1;

  // Ground contact shadow stays anchored on the floor and shrinks as Mama jumps!
  const shadowScaleX =
    isShaking || isDelighted
      ? hopY.interpolate({ inputRange: [0, 1], outputRange: [1, 0.62] })
      : isHappyIdle
        ? breathAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.88] })
        : 1;

  // Independently floating & scaling golden "M" steam hair
  const steamTranslateY = isShaking
    ? steamAnim.interpolate({ inputRange: [-1, 1], outputRange: [-12 * k, 4 * k] })
    : isDelighted
      ? steamAnim.interpolate({ inputRange: [0, 1], outputRange: [-4 * k, -14 * k] })
      : isHungry
        ? steamAnim.interpolate({ inputRange: [0, 1], outputRange: [8 * k, 11 * k] })
        : steamAnim.interpolate({ inputRange: [0, 1], outputRange: [2 * k, -6 * k] });

  const steamRotate = isHungry
    ? '-18deg'
    : isHappyIdle
      ? steamAnim.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '5deg'] })
      : '0deg';

  const steamScale = isShaking ? 1.15 : isDelighted ? 1.12 : isHungry ? 0.85 : 1;

  // Independent arm rotation around shoulder sockets (exact HTML demo angles!)
  const leftArmRotate = isShaking
    ? leftArmAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-58deg', '-8deg'] })
    : isDelighted
      ? leftArmAnim.interpolate({ inputRange: [0, 1], outputRange: ['-22deg', '-44deg'] })
      : isJudging
        ? '24deg'
        : isHungry
          ? '44deg'
          : leftArmAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-28deg', '8deg'] });

  const rightArmRotate = isShaking
    ? rightArmAnim.interpolate({ inputRange: [-1, 1], outputRange: ['8deg', '58deg'] })
    : isDelighted
      ? rightArmAnim.interpolate({ inputRange: [0, 1], outputRange: ['22deg', '44deg'] })
      : isJudging
        ? rightArmAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-34deg', '-14deg'] })
        : isHungry
          ? '-44deg'
          : '8deg';

  // Exact arm layer geometry pinned to left & right shoulder sockets
  const armBoxPx = size * (150 / 260);
  const leftShoulderX = size * (62 / 260);
  const rightShoulderX = size * (198 / 260);
  const shoulderY = size * (146 / 260);

  const showSpoon = isJudging || isDelighted || pose === 'cooking';
  const showAura = isDelighted || isShaking;
  const showStaticDice = isShaking && !hideStaticDice;

  const content = (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      {/* Layer 1: Golden Aura Glow */}
      {showAura ? (
        <View style={styles.layerFill} pointerEvents="none">
          <Svg width={size} height={size} viewBox="0 0 260 260">
            <Defs>
              <RadialGradient id="mamaHaloGrad" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#F4C95D" stopOpacity={isDelighted ? '0.62' : '0.52'} />
                <Stop offset="100%" stopColor="#F4C95D" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx="130" cy="142" r="106" fill="url(#mamaHaloGrad)" />
          </Svg>
        </View>
      ) : null}

      {/* Layer 2: Grounded Contact Shadow (stays on floor & shrinks as Mama jumps!) */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.layerFill,
          {
            transform: [{ scaleX: shadowScaleX }],
          },
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 260 260">
          <Ellipse cx="130" cy="224" rx="60" ry="10.5" fill="#242820" fillOpacity="0.16" />
        </Svg>
      </Animated.View>

      {/* Layer 3: Full Living Mama Bowl Rig (shimmy + air hops + jelly squash + poke squish!) */}
      <Animated.View
        style={[
          styles.layerFill,
          {
            transform: [
              { translateX: bodyTranslateX },
              { translateY: bodyTranslateY },
              { rotate: bodyRotate },
              { scaleX: bodyScaleX },
              { scaleY: bodyScaleY },
              { scale: tapSquish },
            ],
          },
        ]}
      >
        {/* 3A. Left Stubby Ceramic Arm (pivots cleanly at left shoulder behind bowl!) */}
        {!hideArms ? (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: armBoxPx,
              height: armBoxPx,
              left: leftShoulderX - armBoxPx / 2,
              top: shoulderY - armBoxPx / 2,
              zIndex: 1,
              transform: [{ rotate: leftArmRotate }],
            }}
          >
            <Svg width={armBoxPx} height={armBoxPx} viewBox="0 0 150 150">
              <Path
                d="M 79 75 Q 51 63 47 47"
                fill="none"
                stroke="#F4EFE4"
                strokeWidth="17"
                strokeLinecap="round"
              />
              <Path
                d="M 79 75 Q 51 63 47 47"
                fill="none"
                stroke="#CEC6B6"
                strokeWidth="17"
                strokeOpacity="0.22"
                strokeLinecap="round"
              />
            </Svg>
          </Animated.View>
        ) : null}

        {/* 3B. Right Stubby Ceramic Arm + Shaking Wooden Spoon (pivots cleanly at right shoulder!) */}
        {!hideArms ? (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: armBoxPx,
              height: armBoxPx,
              left: rightShoulderX - armBoxPx / 2,
              top: shoulderY - armBoxPx / 2,
              zIndex: 1,
              transform: [{ rotate: rightArmRotate }],
            }}
          >
            <Svg width={armBoxPx} height={armBoxPx} viewBox="0 0 150 150">
              {showSpoon ? (
                <G transform="translate(99, 49) rotate(12)">
                  <Rect
                    x="-3.5"
                    y="-32"
                    width="7"
                    height="56"
                    rx="3.5"
                    fill="#B57B44"
                    stroke="#6E441E"
                    strokeWidth="1.6"
                  />
                  <Ellipse
                    cx="0"
                    cy="-40"
                    rx="11.5"
                    ry="15.5"
                    fill="#C98D54"
                    stroke="#6E441E"
                    strokeWidth="1.8"
                  />
                  <Ellipse cx="-2" cy="-42" rx="4.8" ry="7.5" fill="#DFAA74" fillOpacity="0.55" />
                </G>
              ) : null}
              <Path
                d="M 71 75 Q 99 65 103 49"
                fill="none"
                stroke="#F4EFE4"
                strokeWidth="17"
                strokeLinecap="round"
              />
              <Path
                d="M 71 75 Q 99 65 103 49"
                fill="none"
                stroke="#CEC6B6"
                strokeWidth="17"
                strokeOpacity="0.22"
                strokeLinecap="round"
              />
            </Svg>
          </Animated.View>
        ) : null}

        {/* 3C. Independently Bouncing Golden "M" Steam Hair */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.layerFill,
            {
              zIndex: 2,
              transform: [
                { translateY: steamTranslateY },
                { rotate: steamRotate },
                { scale: steamScale },
              ],
            },
          ]}
        >
          <Svg width={size} height={size} viewBox="0 0 260 260">
            <Defs>
              <LinearGradient id="mamaSteamHairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FFE699" />
                <Stop offset="55%" stopColor="#F2BD4B" />
                <Stop offset="100%" stopColor="#D99426" />
              </LinearGradient>
            </Defs>
            <G transform="translate(130, 82)">
              <Path
                d="M -32 10 L -32 -12 C -32 -29 -13 -31 -7 -14 L 0 4 L 7 -14 C 13 -31 32 -29 32 -12 L 32 10"
                fill="none"
                stroke="url(#mamaSteamHairGrad)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M -32 10 L -32 -12 C -32 -29 -13 -31 -7 -14 L 0 4 L 7 -14 C 13 -31 32 -29 32 -12 L 32 10"
                fill="none"
                stroke="#FFF6D6"
                strokeWidth="4"
                strokeOpacity="0.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </G>
          </Svg>
        </Animated.View>

        {/* 3D. Main Chubby Cream Ceramic Bowl + Golden Foot + Exact Demo Face */}
        <View style={[styles.layerFill, { zIndex: 3 }]} pointerEvents="none">
          <Svg width={size} height={size} viewBox="0 0 260 260">
            <Defs>
              <RadialGradient id="mamaCeramicGrad" cx="38%" cy="28%" r="72%">
                <Stop offset="0%" stopColor="#FFFFFF" />
                <Stop offset="68%" stopColor="#F7F2E7" />
                <Stop offset="100%" stopColor="#DDD5C5" />
              </RadialGradient>
              <LinearGradient id="mamaBaseGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FFE699" />
                <Stop offset="55%" stopColor="#F2BD4B" />
                <Stop offset="100%" stopColor="#D99426" />
              </LinearGradient>
            </Defs>

            {/* Optional small die if MamaCharacter(pose='shaking') is rendered standalone */}
            {showStaticDice ? (
              <G transform="translate(226, 98) rotate(18)">
                <Rect
                  x="-16"
                  y="-16"
                  width="32"
                  height="32"
                  rx="8"
                  fill="#F2C14E"
                  stroke="#9C6B16"
                  strokeWidth="2.5"
                />
                <Circle cx="-6" cy="-6" r="2.8" fill="#5A3C08" />
                <Circle cx="6" cy="6" r="2.8" fill="#5A3C08" />
                <Circle cx="6" cy="-6" r="2.8" fill="#5A3C08" />
                <Circle cx="-6" cy="6" r="2.8" fill="#5A3C08" />
                <Circle cx="0" cy="0" r="2.8" fill="#5A3C08" />
              </G>
            ) : null}

            {/* Golden Ceramic Base Foot */}
            <Rect x="102" y="201" width="56" height="12" rx="6" fill="url(#mamaBaseGold)" />

            {/* Chubby Warm Cream Ceramic Bowl Body (exact demo silhouette!) */}
            <Path
              d="M 52 118 L 208 118 C 208 176 176 204 130 204 C 84 204 52 176 52 118 Z"
              fill="url(#mamaCeramicGrad)"
              stroke="#D4CCB9"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Soft ceramic rim lip + warm inner shadow */}
            <Ellipse cx="130" cy="118" rx="78" ry="12" fill="#EDE5D4" stroke="#D4CCB9" strokeWidth="2" />
            <Ellipse cx="130" cy="117" rx="66" ry="7" fill="#D5C8AF" fillOpacity="0.65" />

            {/* EXPRESSIVE FACE LAYER (exact mama_bowl_mascot_demo.html coordinates!) */}
            <G transform="translate(130, 156)">
              {/* Rosy warm cheeks */}
              <Ellipse cx="-42" cy="8" rx="11" ry="6.5" fill="#F29B7E" fillOpacity="0.52" />
              <Ellipse cx="42" cy="8" rx="11" ry="6.5" fill="#F29B7E" fillOpacity="0.52" />

              {isDelighted ? (
                /* Happy closed crescent eyes (Cooked! celebration) */
                <G>
                  <Path
                    d="M -37 -4 Q -26 -17 -15 -4"
                    fill="none"
                    stroke="#1E2219"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  <Path
                    d="M 15 -4 Q 26 -17 37 -4"
                    fill="none"
                    stroke="#1E2219"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </G>
              ) : isBlinking && !isShaking ? (
                /* Natural organic blink */
                <G>
                  <Ellipse cx="-26" cy="-6" rx="12.5" ry="2" fill="#1E2219" />
                  <Ellipse cx="26" cy="-6" rx="12.5" ry="2" fill="#1E2219" />
                </G>
              ) : (
                /* Big glossy adorable Duolingo-style eyes (for Happy, Shake, Judge, Hungry!) */
                <G>
                  {/* Left Eye */}
                  <G transform="translate(-26, -6)">
                    <Ellipse cx="0" cy="0" rx="12.5" ry="14" fill="#1E2219" />
                    <Circle cx={isJudging ? 3 : -3.5} cy={isJudging ? -5 : -4.5} r="4.5" fill="#FFFFFF" />
                    <Circle cx={isJudging ? 7.5 : 4} cy={isJudging ? 3 : 4} r="2" fill="#FFFFFF" fillOpacity="0.85" />
                    {isJudging ? (
                      <Rect x="-15" y="-17" width="30" height="11" rx="3" fill="#F7F2E7" />
                    ) : null}
                  </G>

                  {/* Right Eye */}
                  <G transform="translate(26, -6)">
                    <Ellipse cx="0" cy="0" rx="12.5" ry="14" fill="#1E2219" />
                    <Circle cx={isJudging ? 3 : -3.5} cy={isJudging ? -5 : -4.5} r="4.5" fill="#FFFFFF" />
                    <Circle cx={isJudging ? 7.5 : 4} cy={isJudging ? 3 : 4} r="2" fill="#FFFFFF" fillOpacity="0.85" />
                    {isJudging ? (
                      <Rect x="-15" y="-17" width="30" height="11" rx="3" fill="#F7F2E7" />
                    ) : null}
                  </G>

                  {/* Expressive Eyebrows */}
                  {isJudging ? (
                    <>
                      <Path d="M -39 -22 L -14 -20" fill="none" stroke="#58673A" strokeWidth="4" strokeLinecap="round" />
                      <Path d="M 14 -25 Q 26 -35 38 -24" fill="none" stroke="#58673A" strokeWidth="4" strokeLinecap="round" />
                    </>
                  ) : isHungry ? (
                    <>
                      <Path d="M -38 -20 L -15 -28" fill="none" stroke="#58673A" strokeWidth="4" strokeLinecap="round" />
                      <Path d="M 15 -28 L 38 -20" fill="none" stroke="#58673A" strokeWidth="4" strokeLinecap="round" />
                    </>
                  ) : pose === 'thinking' ? (
                    <Path d="M 14 -25 Q 26 -32 38 -24" fill="none" stroke="#58673A" strokeWidth="3.8" strokeLinecap="round" />
                  ) : null}
                </G>
              )}

              {/* Dynamic Mouth (exact HTML demo shapes!) */}
              {isShaking ? (
                <Path
                  d="M -15 8 Q 0 28 15 8 Z"
                  fill="#8C2D23"
                  stroke="#1E2219"
                  strokeWidth="3.2"
                  strokeLinejoin="round"
                />
              ) : isJudging ? (
                <Path d="M -12 14 Q 2 12 14 15" fill="none" stroke="#1E2219" strokeWidth="4.5" strokeLinecap="round" />
              ) : isHungry ? (
                <Path
                  d="M -13 18 Q -6 12 0 18 Q 6 24 13 16"
                  fill="none"
                  stroke="#1E2219"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
              ) : isDelighted ? (
                <Path d="M -14 10 Q 0 26 14 10" fill="none" stroke="#1E2219" strokeWidth="4.5" strokeLinecap="round" />
              ) : isSpeaking && (pose === 'welcoming' || pose === 'cooking') ? (
                <Path d="M -12 10 Q 0 24 12 10" fill="none" stroke="#1E2219" strokeWidth="4.5" strokeLinecap="round" />
              ) : (
                <Path d="M -12 10 Q 0 22 12 10" fill="none" stroke="#1E2219" strokeWidth="4.5" strokeLinecap="round" />
              )}
            </G>
          </Svg>
        </View>
      </Animated.View>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.92}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel="Poke Mama Dish mascot"
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  layerFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
