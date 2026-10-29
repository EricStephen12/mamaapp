import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Animated,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import Svg, {
  Circle,
  Path,
  G,
  Rect,
  Ellipse,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

export type MamaPose = 'welcoming' | 'thinking' | 'writing' | 'delighted' | 'cooking';

interface MamaCharacterProps {
  pose?: MamaPose;
  size?: number;
  style?: ViewStyle;
  isSpeaking?: boolean;
  onPress?: () => void;
}

export const MamaCharacter: React.FC<MamaCharacterProps> = ({
  pose = 'welcoming',
  size = 140,
  style,
  isSpeaking = true,
  onPress,
}) => {
  // 1. Idle breathing
  const breathAnim = useRef(new Animated.Value(0)).current;

  // 2. Blinking eyes
  const blinkAnim = useRef(new Animated.Value(1)).current;

  // 3. Speaking mouth
  const mouthAnim = useRef(new Animated.Value(0)).current;

  // 4. Pose-specific distinct animations:
  // - Waving hand for 'welcoming'
  const waveAnim = useRef(new Animated.Value(0)).current;
  // - Tapping finger for 'thinking'
  const thinkTapAnim = useRef(new Animated.Value(0)).current;
  // - Scribbling pencil for 'writing'
  const writeScribbleAnim = useRef(new Animated.Value(0)).current;
  // - Clapping / heart pulse for 'delighted'
  const heartPulseAnim = useRef(new Animated.Value(1)).current;
  // - Stirring pan for 'cooking'
  const stirAnim = useRef(new Animated.Value(0)).current;
  const steamAnim = useRef(new Animated.Value(0)).current;

  // 5. Interactive tap bounce
  const tapScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Continuous gentle breath loop
    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(breathAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    );
    breathLoop.start();

    // Natural eye blink loop
    const blinkLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(2800),
        Animated.timing(blinkAnim, { toValue: 0.1, duration: 100, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.delay(150),
        Animated.timing(blinkAnim, { toValue: 0.1, duration: 80, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ])
    );
    blinkLoop.start();

    return () => {
      breathLoop.stop();
      blinkLoop.stop();
    };
  }, []);

  // Distinct Pose Animations triggered when pose changes
  useEffect(() => {
    let activeLoop: Animated.CompositeAnimation | null = null;

    if (pose === 'welcoming') {
      // Active hand waving loop back and forth
      activeLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
          Animated.timing(waveAnim, { toValue: -1, duration: 450, useNativeDriver: true }),
        ])
      );
      activeLoop.start();
    } else if (pose === 'thinking') {
      // Finger tapping chin
      activeLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(thinkTapAnim, { toValue: -4, duration: 320, useNativeDriver: true }),
          Animated.timing(thinkTapAnim, { toValue: 0, duration: 320, useNativeDriver: true }),
          Animated.delay(400),
        ])
      );
      activeLoop.start();
    } else if (pose === 'writing') {
      // Pencil rapid scribble across recipe book
      activeLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(writeScribbleAnim, { toValue: 6, duration: 180, useNativeDriver: true }),
          Animated.timing(writeScribbleAnim, { toValue: -6, duration: 180, useNativeDriver: true }),
          Animated.timing(writeScribbleAnim, { toValue: 4, duration: 150, useNativeDriver: true }),
          Animated.timing(writeScribbleAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.delay(350),
        ])
      );
      activeLoop.start();
    } else if (pose === 'delighted') {
      // Warm pulsing heart and clapping hands
      activeLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(heartPulseAnim, { toValue: 1.25, duration: 400, useNativeDriver: true }),
          Animated.timing(heartPulseAnim, { toValue: 0.95, duration: 350, useNativeDriver: true }),
          Animated.timing(heartPulseAnim, { toValue: 1.15, duration: 300, useNativeDriver: true }),
          Animated.timing(heartPulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );
      activeLoop.start();
    } else if (pose === 'cooking') {
      // Stirring pan loop
      const stirLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(stirAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(stirAnim, { toValue: -1, duration: 700, useNativeDriver: true }),
        ])
      );
      const steamLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(steamAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
          Animated.timing(steamAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
      activeLoop = Animated.parallel([stirLoop, steamLoop]);
      activeLoop.start();
    }

    return () => {
      if (activeLoop) activeLoop.stop();
    };
  }, [pose]);

  // Speaking mouth loop
  useEffect(() => {
    if (!isSpeaking) {
      mouthAnim.setValue(0);
      return;
    }
    const talkLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(mouthAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.timing(mouthAnim, { toValue: 0.2, duration: 160, useNativeDriver: true }),
        Animated.timing(mouthAnim, { toValue: 0.8, duration: 140, useNativeDriver: true }),
        Animated.timing(mouthAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.delay(400),
      ])
    );
    talkLoop.start();
    return () => talkLoop.stop();
  }, [isSpeaking, pose]);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(tapScale, { toValue: 1.12, friction: 3, tension: 160, useNativeDriver: true }),
      Animated.spring(tapScale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
    ]).start();
    onPress?.();
  };

  // Interpolations
  const breathY = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3],
  });

  const waveDeg = waveAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-18deg', '0deg', '22deg'],
  });

  const stirDeg = stirAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-12deg', '0deg', '15deg'],
  });

  const steamY = steamAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -22],
  });
  const steamOpacity = steamAnim.interpolate({
    inputRange: [0, 0.3, 0.8, 1],
    outputRange: [0, 0.8, 0.3, 0],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={[styles.touchWrap, { width: size, height: size }, style]}
    >
      <Animated.View
        style={[
          styles.innerWrap,
          {
            width: size,
            height: size,
            transform: [{ translateY: breathY }, { scale: tapScale }],
          },
        ]}
      >
        {/* Layer 1: Base Character Body, Apron, Halo */}
        <Svg viewBox="0 0 160 160" width={size} height={size} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="haloGrad2" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#F9F6EE" />
              <Stop offset="100%" stopColor="#EDE5D4" />
            </LinearGradient>
            <LinearGradient id="apronGrad2" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#4A5C38" />
              <Stop offset="100%" stopColor="#354425" />
            </LinearGradient>
          </Defs>

          {/* Halo Background */}
          <Circle cx="80" cy="80" r="76" fill="url(#haloGrad2)" />
          <Circle cx="80" cy="80" r="74" stroke="#E2D4BD" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Torso & Green Dress */}
          <Path d="M 34 150 Q 80 120 126 150 L 126 160 L 34 160 Z" fill="url(#apronGrad2)" />

          {/* Crispy Linen Apron */}
          <Path d="M 54 130 L 106 130 L 102 160 L 58 160 Z" fill="#FAF7EE" stroke="#DDD5C1" strokeWidth="1.5" />

          {/* Red Kitchen Towel in Apron */}
          <Path d="M 58 136 Q 64 150 62 160 L 56 160 Z" fill="#C45A45" />

          {/* Head & Hair Wrap Base */}
          <Ellipse cx="80" cy="42" rx="27" ry="24" fill="#3D2111" />
          <Circle cx="80" cy="22" r="13" fill="#4D2A16" />
          <Path d="M 64 30 Q 80 23 96 30 Q 80 34 64 30 Z" fill="#D47343" />
          <Circle cx="80" cy="27" r="2.5" fill="#F4D35E" />

          {/* Face */}
          <Ellipse cx="80" cy="66" rx="23" ry="24" fill="#E8C39E" />
          {/* Rosy Cheeks */}
          <Circle cx="66" cy="72" r="4.5" fill="#EAA18E" opacity={0.65} />
          <Circle cx="94" cy="72" r="4.5" fill="#EAA18E" opacity={0.65} />
          {/* Gold Earrings */}
          <Circle cx="56" cy="68" r="3" stroke="#D4AF37" strokeWidth="1.6" fill="none" />
          <Circle cx="104" cy="68" r="3" stroke="#D4AF37" strokeWidth="1.6" fill="none" />
          {/* Eyebrows */}
          <Path d="M 67 55 Q 72 52 77 55" stroke="#3D2111" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <Path d="M 83 55 Q 88 52 93 55" stroke="#3D2111" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </Svg>

        {/* Layer 2: Animated Blinking Eyes */}
        <Animated.View
          style={[
            styles.partLayer,
            { transform: [{ scaleY: blinkAnim }] },
          ]}
        >
          <Svg viewBox="0 0 160 160" width={size} height={size}>
            {pose === 'thinking' ? (
              // Thinking Eyes Looking Upward
              <G>
                <Circle cx="72" cy="59" r="3" fill="#242820" />
                <Circle cx="73" cy="58" r="1" fill="#FFFFFF" />
                <Circle cx="88" cy="59" r="3" fill="#242820" />
                <Circle cx="89" cy="58" r="1" fill="#FFFFFF" />
              </G>
            ) : (
              // Warm Smiling Crescent Eyes
              <G>
                <Path d="M 68 62 Q 72 58 76 62" stroke="#242820" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <Path d="M 84 62 Q 88 58 92 62" stroke="#242820" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </G>
            )}
          </Svg>
        </Animated.View>

        {/* Layer 3: Animated Speaking Mouth */}
        <Animated.View
          style={[
            styles.partLayer,
            {
              transform: [
                {
                  scaleY: mouthAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.7],
                  }),
                },
              ],
            },
          ]}
        >
          <Svg viewBox="0 0 160 160" width={size} height={size}>
            <Path d="M 73 74 Q 80 83 87 74" stroke="#68341D" strokeWidth="2.4" strokeLinecap="round" fill="#C45A45" />
            <Path d="M 75 75 Q 80 77 85 75" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </Svg>
        </Animated.View>

        {/* Layer 4: POSE 1 - WELCOMING: Articulated Waving Hand */}
        {pose === 'welcoming' && (
          <Animated.View
            style={[
              styles.partLayer,
              { transform: [{ rotate: waveDeg }] },
            ]}
          >
            <Svg viewBox="0 0 160 160" width={size} height={size}>
              {/* Left hand gently waving up high */}
              <Path d="M 42 128 Q 28 116 32 100" stroke="#E8C39E" strokeWidth="7" strokeLinecap="round" fill="none" />
              <Circle cx="32" cy="98" r="7" fill="#E8C39E" />
              {/* Fingers waving */}
              <Path d="M 28 94 Q 24 88 30 86 Q 34 90 32 96 Z" fill="#E8C39E" />
              <Path d="M 33 93 Q 32 85 37 85 Q 39 89 36 95 Z" fill="#E8C39E" />
              {/* Motion sparkles around waving hand */}
              <Path d="M 22 96 Q 18 94 22 92" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <Path d="M 38 82 Q 42 80 40 84" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              {/* Right Hand resting peacefully on hip */}
              <Circle cx="122" cy="132" r="7" fill="#E8C39E" />
            </Svg>
          </Animated.View>
        )}

        {/* Layer 5: POSE 2 - THINKING: Tapping Finger & Thought Bubbles */}
        {pose === 'thinking' && (
          <Animated.View
            style={[
              styles.partLayer,
              { transform: [{ translateY: thinkTapAnim }] },
            ]}
          >
            <Svg viewBox="0 0 160 160" width={size} height={size}>
              {/* Hand at chin tapping */}
              <Path d="M 44 130 Q 54 110 68 92" stroke="#E8C39E" strokeWidth="7" strokeLinecap="round" fill="none" />
              <Circle cx="70" cy="90" r="6.5" fill="#E8C39E" />
              {/* Index finger tapping chin */}
              <Path d="M 70 90 L 76 80" stroke="#E8C39E" strokeWidth="3.5" strokeLinecap="round" />
              {/* Animated thought bubbles */}
              <Circle cx="112" cy="40" r="3.5" fill="#D47343" opacity={0.7} />
              <Circle cx="122" cy="30" r="5.5" fill="#D47343" opacity={0.7} />
              <Circle cx="134" cy="18" r="8" fill="#F4D35E" opacity={0.8} />
              {/* Question mark in thought bubble */}
              <Path d="M 132 15 Q 134 13 136 15 Q 136 18 134 19 L 134 21" stroke="#3D2111" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <Circle cx="134" cy="23" r="0.8" fill="#3D2111" />
            </Svg>
          </Animated.View>
        )}

        {/* Layer 6: POSE 3 - WRITING: Scribbling Pencil & Recipe Pad */}
        {pose === 'writing' && (
          <Animated.View
            style={[
              styles.partLayer,
              { transform: [{ translateX: writeScribbleAnim }] },
            ]}
          >
            <Svg viewBox="0 0 160 160" width={size} height={size}>
              {/* Wooden Recipe Notebook */}
              <Rect x="42" y="112" width="40" height="30" rx="4" fill="#E0D2B4" stroke="#8C6D46" strokeWidth="1.5" />
              <Path d="M 48 118 L 76 118" stroke="#7A613E" strokeWidth="1.5" strokeLinecap="round" />
              <Path d="M 48 124 L 72 124" stroke="#7A613E" strokeWidth="1.5" strokeLinecap="round" />
              <Path d="M 48 130 L 66 130" stroke="#7A613E" strokeWidth="1.5" strokeLinecap="round" />
              {/* Hand Scribbling with Wooden Pencil */}
              <Circle cx="84" cy="118" r="6" fill="#E8C39E" />
              <Path d="M 86 110 L 92 122 L 82 120 Z" fill="#D47343" />
              <Path d="M 92 122 L 95 125" stroke="#242820" strokeWidth="1.5" strokeLinecap="round" />
            </Svg>
          </Animated.View>
        )}

        {/* Layer 7: POSE 4 - DELIGHTED: Pulsing Heart & Clasped Hands */}
        {pose === 'delighted' && (
          <Animated.View
            style={[
              styles.partLayer,
              { transform: [{ scale: heartPulseAnim }] },
            ]}
          >
            <Svg viewBox="0 0 160 160" width={size} height={size}>
              {/* Clasped Happy Hands */}
              <Circle cx="74" cy="122" r="7" fill="#E8C39E" />
              <Circle cx="86" cy="122" r="7" fill="#E8C39E" />
              {/* Warm Pulsing Love Heart Above */}
              <Path
                d="M 80 14 Q 75 7 70 10 Q 65 14 80 24 Q 95 14 90 10 Q 85 7 80 14 Z"
                fill="#C45A45"
              />
              {/* Joy sparkles */}
              <Path d="M 64 12 L 67 15" stroke="#F4D35E" strokeWidth="2" strokeLinecap="round" />
              <Path d="M 96 12 L 93 15" stroke="#F4D35E" strokeWidth="2" strokeLinecap="round" />
            </Svg>
          </Animated.View>
        )}

        {/* Layer 8: POSE 5 - COOKING: Stirring Pan with Rising Steam */}
        {pose === 'cooking' && (
          <G>
            {/* Copper Skillet in front */}
            <Svg viewBox="0 0 160 160" width={size} height={size} style={StyleSheet.absoluteFill}>
              <Ellipse cx="116" cy="142" rx="22" ry="10" fill="#B36B47" stroke="#5E2C1A" strokeWidth="1.5" />
              <Ellipse cx="116" cy="141" rx="18" ry="7" fill="#E8A938" />
              <Circle cx="112" cy="140" r="3" fill="#FAF5E8" />
              <Circle cx="120" cy="141" r="2.5" fill="#FAF5E8" />
              <Path d="M 136 142 L 154 138" stroke="#3D1D11" strokeWidth="3.5" strokeLinecap="round" />
            </Svg>

            {/* Rising Steam */}
            <Animated.View style={[styles.partLayer, { transform: [{ translateY: steamY }], opacity: steamOpacity }]}>
              <Svg viewBox="0 0 160 160" width={size} height={size}>
                <Path d="M 112 132 Q 110 122 114 114 Q 118 106 114 98" stroke="#A89F91" strokeWidth="2" strokeLinecap="round" fill="none" />
                <Path d="M 120 132 Q 124 120 120 110 Q 116 100 120 92" stroke="#A89F91" strokeWidth="2" strokeLinecap="round" fill="none" />
              </Svg>
            </Animated.View>

            {/* Stirring Arm */}
            <Animated.View style={[styles.partLayer, { transform: [{ rotate: stirDeg }] }]}>
              <Svg viewBox="0 0 160 160" width={size} height={size}>
                <Path d="M 102 124 Q 112 120 114 130" stroke="#E8C39E" strokeWidth="7" strokeLinecap="round" fill="none" />
                <Path d="M 112 114 L 118 140" stroke="#8C5C38" strokeWidth="3" strokeLinecap="round" />
                <Ellipse cx="118" cy="140" rx="3" ry="4" fill="#8C5C38" />
                <Circle cx="113" cy="122" r="5.5" fill="#E8C39E" />
              </Svg>
            </Animated.View>
          </G>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  partLayer: {
    ...StyleSheet.absoluteFill,
  },
});
