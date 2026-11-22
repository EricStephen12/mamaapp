import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import Svg, { Circle, Path, Ellipse, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { preferencesStore } from '../../services/preferencesStore';
import { SteamWisps } from '../signature/SteamWisps';
import { MamaSealStamp } from '../signature/MamaSealStamp';

const MAMA_OVERFED = require('../../../assets/family/mama-overfed.jpg');
const AUNTIE_PULLING = require('../../../assets/family/auntie-pulling.jpg');

export interface MamaFamilyCelebrationProps {
  visible: boolean;
  dishTitle: string;
  homeCostFormatted: string;
  savedVsTakeoutFormatted: string;
  mealsCookedCount: number;
  onClaimReward: () => void;
}

interface FamilyAchievement {
  badge: string;
  headline: string;
  mamaLine: string;
  auntieLine: string;
  cousinLine: string;
}

function getFamilyAchievement(mealsCookedCount: number): FamilyAchievement {
  if (mealsCookedCount <= 1) {
    return {
      badge: 'FIRST POT SEASONED',
      headline: 'Mama Is Over the Moon!',
      mamaLine: '“My child really cooked! Even Mama overate…”',
      auntieLine: '“Mama, leave some!”',
      cousinLine: '“Save me a plate!”',
    };
  }
  if (mealsCookedCount === 2) {
    return {
      badge: 'HOME KITCHEN RHYTHM',
      headline: 'Two Plates Strong!',
      mamaLine: '“My belly is SO full… carry me to the couch!”',
      auntieLine: '“Come on, Mama!”',
      cousinLine: '“Push from behind!”',
    };
  }
  if (mealsCookedCount <= 4) {
    return {
      badge: 'MAMA OVERATE!',
      headline: 'The Whole Family Ate Well!',
      mamaLine: '“Ooh my child… you cooked too well tonight!”',
      auntieLine: '“Up you go, Mama!”',
      cousinLine: '“I got the spoon!”',
    };
  }
  if (mealsCookedCount <= 7) {
    return {
      badge: 'DELIVERY APPS DEFEATED',
      headline: 'Takeout Didn’t Stand a Chance!',
      mamaLine: '“Heavy wallet, full belly… Mama is resting now!”',
      auntieLine: '“Let’s wheel her out!”',
      cousinLine: '“Next plate is mine!”',
    };
  }
  return {
    badge: 'HEAD CHEF OF THE HOUSE',
    headline: 'Certified Family Legend!',
    mamaLine: '“Take my wooden spoon—you run this kitchen now!”',
    auntieLine: '“Mama, go nap!”',
    cousinLine: '“Best cook ever!”',
  };
}

/**
 * Playful hand-inked SVG Little Cousin character leaning right to push Mama
 * while sneaking a taste with his wooden spoon!
 */
const LittleCousinPushing: React.FC<{ size?: number }> = ({ size = 84 }) => (
  <Svg width={size} height={size} viewBox="0 0 110 110" fill="none">
    {/* Soft warm glow */}
    <Circle cx="55" cy="58" r="44" fill="#F4E6C8" opacity={0.65} />
    {/* Afro curls */}
    <Circle cx="44" cy="30" r="14" fill="#3B2416" stroke="#2A180E" strokeWidth="2.5" />
    <Circle cx="58" cy="26" r="14" fill="#3B2416" stroke="#2A180E" strokeWidth="2.5" />
    <Circle cx="36" cy="40" r="11" fill="#3B2416" stroke="#2A180E" strokeWidth="2.5" />
    <Circle cx="68" cy="35" r="11" fill="#3B2416" stroke="#2A180E" strokeWidth="2.5" />
    {/* Olive tee body leaning right */}
    <Path
      d="M32 70 C36 60, 62 58, 72 70 L78 96 L30 96 Z"
      fill="#66704A"
      stroke="#2A180E"
      strokeWidth="2.8"
      strokeLinejoin="round"
    />
    {/* Collar accent */}
    <Path d="M44 65 Q54 71 63 65" stroke="#E8B960" strokeWidth="2.6" strokeLinecap="round" />
    {/* Head */}
    <Circle cx="54" cy="46" r="17" fill="#A86538" stroke="#2A180E" strokeWidth="2.8" />
    {/* Rosy cheeks */}
    <Ellipse cx="45" cy="50" rx="3.4" ry="2.2" fill="#D96B52" opacity={0.55} />
    <Ellipse cx="64" cy="49" rx="3.4" ry="2.2" fill="#D96B52" opacity={0.55} />
    {/* Mischievous happy eyes */}
    <Path d="M45 43 Q48 40 51 43" stroke="#2A180E" strokeWidth="2.4" strokeLinecap="round" />
    <Path d="M58 43 Q61 40 64 43" stroke="#2A180E" strokeWidth="2.4" strokeLinecap="round" />
    {/* Big cheeky grin */}
    <Path
      d="M47 52 Q55 60 64 51 Z"
      fill="#FFFFFF"
      stroke="#2A180E"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    {/* Right arm pushing forward to the right */}
    <Path
      d="M68 72 L94 66"
      stroke="#A86538"
      strokeWidth="9"
      strokeLinecap="round"
    />
    <Path
      d="M68 72 L94 66"
      stroke="#2A180E"
      strokeWidth="2.6"
      strokeLinecap="round"
    />
    <Circle cx="95" cy="65" r="5.5" fill="#A86538" stroke="#2A180E" strokeWidth="2.4" />
    {/* Left hand holding sneaky wooden tasting spoon */}
    <Rect
      x="15"
      y="46"
      width="4.5"
      height="28"
      rx="2.2"
      transform="rotate(-24 17 60)"
      fill="#C98947"
      stroke="#2A180E"
      strokeWidth="2"
    />
    <Ellipse
      cx="13"
      cy="44"
      rx="6"
      ry="8.5"
      transform="rotate(-24 13 44)"
      fill="#DDA15E"
      stroke="#2A180E"
      strokeWidth="2.2"
    />
    <Circle cx="26" cy="70" r="5.5" fill="#A86538" stroke="#2A180E" strokeWidth="2.4" />
  </Svg>
);

export const MamaFamilyCelebrationModal: React.FC<MamaFamilyCelebrationProps> = ({
  visible,
  dishTitle,
  homeCostFormatted,
  savedVsTakeoutFormatted,
  mealsCookedCount,
  onClaimReward,
}) => {
  const achievement = getFamilyAchievement(mealsCookedCount);
  const xpAmount = preferencesStore.isMamaPlus() ? 100 : 50;

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.84)).current;

  // 3-character comedy stage animated values
  const mamaScale = useRef(new Animated.Value(0.6)).current;
  const mamaTilt = useRef(new Animated.Value(0)).current;
  const auntieX = useRef(new Animated.Value(170)).current;
  const auntieOpacity = useRef(new Animated.Value(0)).current;
  const cousinX = useRef(new Animated.Value(-160)).current;
  const cousinOpacity = useRef(new Animated.Value(0)).current;
  const groupDragX = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;

  const [scenePhase, setScenePhase] = useState<'belly' | 'family' | 'dragged'>('belly');
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  const runComedySequence = useCallback(() => {
    clearTimers();
    setScenePhase('belly');

    mamaScale.setValue(0.6);
    mamaTilt.setValue(0);
    auntieX.setValue(170);
    auntieOpacity.setValue(0);
    cousinX.setValue(-160);
    cousinOpacity.setValue(0);
    groupDragX.setValue(0);
    badgeScale.setValue(0.4);
    badgeOpacity.setValue(0);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    // Beat 1: Overfed Mama pops in & happily rubs her belly with a gentle sway
    Animated.parallel([
      Animated.spring(mamaScale, {
        toValue: 1,
        friction: 5,
        tension: 95,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(mamaTilt, {
          toValue: -1,
          duration: 280,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(mamaTilt, {
          toValue: 1,
          duration: 320,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(mamaTilt, {
          toValue: 0,
          duration: 260,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Beat 2 (1.05s): Auntie rushes in from the right + Little Cousin jumps in from the left!
    const t1 = setTimeout(() => {
      setScenePhase('family');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      Animated.parallel([
        Animated.spring(auntieX, {
          toValue: 0,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(auntieOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(cousinX, {
          toValue: 0,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(cousinOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1050);

    // Beat 3 (1.75s): Tug #1, Tug #2, then Auntie + Cousin playfully drag sleepy Mama off-screen!
    const t2 = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      Animated.sequence([
        // Tug 1
        Animated.parallel([
          Animated.timing(groupDragX, {
            toValue: 22,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(mamaTilt, {
            toValue: -1.4,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(groupDragX, {
          toValue: 12,
          duration: 110,
          useNativeDriver: true,
        }),
        // Tug 2
        Animated.parallel([
          Animated.timing(groupDragX, {
            toValue: 48,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.timing(mamaTilt, {
            toValue: -2.2,
            duration: 160,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(groupDragX, {
          toValue: 36,
          duration: 100,
          useNativeDriver: true,
        }),
        // Whoosh — dragged right off stage!
        Animated.parallel([
          Animated.timing(groupDragX, {
            toValue: 340,
            duration: 460,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(mamaTilt, {
            toValue: -3.2,
            duration: 420,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setScenePhase('dragged');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Animated.parallel([
          Animated.timing(badgeOpacity, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.spring(badgeScale, {
            toValue: 1,
            friction: 5,
            tension: 110,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 1750);

    const t3 = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, 2020);

    timersRef.current = [t1, t2, t3];
  }, [
    auntieOpacity,
    auntieX,
    badgeOpacity,
    badgeScale,
    clearTimers,
    cousinOpacity,
    cousinX,
    groupDragX,
    mamaScale,
    mamaTilt,
  ]);

  useEffect(() => {
    if (!visible) {
      clearTimers();
      backdropOpacity.setValue(0);
      cardScale.setValue(0.84);
      return;
    }
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 6,
        tension: 95,
        useNativeDriver: true,
      }),
    ]).start();
    const t0 = setTimeout(() => {
      runComedySequence();
    }, 0);

    return () => {
      clearTimeout(t0);
      clearTimers();
    };
  }, [visible, backdropOpacity, cardScale, runComedySequence, clearTimers]);

  if (!visible) return null;

  const mamaRotate = mamaTilt.interpolate({
    inputRange: [-4, 0, 4],
    outputRange: ['-16deg', '0deg', '16deg'],
  });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClaimReward}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Animated.View style={[styles.card, { transform: [{ scale: cardScale }] }]}>
          {/* Animated 3-Character Family Comedy Stage */}
          <View style={styles.stage}>
            <SteamWisps triggerKey={scenePhase} style={styles.stageSteam} />

            {/* Live Speech Bubble */}
            <View style={styles.speechPill}>
              <Text style={styles.speechPillText} numberOfLines={1}>
                {scenePhase === 'belly'
                  ? achievement.mamaLine
                  : scenePhase === 'family'
                    ? `${achievement.auntieLine}  ${achievement.cousinLine}`
                    : 'Mama went to nap — you win tonight!'}
              </Text>
            </View>

            {/* Sliding 3-Character Family Group */}
            <Animated.View
              style={[
                styles.familyRow,
                { transform: [{ translateX: groupDragX }] },
              ]}
            >
              {/* 1. Little Cousin pushing from the left with wooden spoon */}
              <Animated.View
                style={[
                  styles.cousinWrap,
                  {
                    opacity: cousinOpacity,
                    transform: [{ translateX: cousinX }],
                  },
                ]}
              >
                <LittleCousinPushing size={84} />
              </Animated.View>

              {/* 2. Overfed Mama rubbing her full belly in center */}
              <Animated.View
                style={[
                  styles.mamaWrap,
                  {
                    transform: [{ scale: mamaScale }, { rotate: mamaRotate }],
                  },
                ]}
              >
                <Image
                  source={MAMA_OVERFED}
                  style={styles.mamaOverfedImg}
                  resizeMode="contain"
                />
              </Animated.View>

              {/* 3. Laughing Auntie pulling Mama off to the right */}
              <Animated.View
                style={[
                  styles.auntieWrap,
                  {
                    opacity: auntieOpacity,
                    transform: [{ translateX: auntieX }],
                  },
                ]}
              >
                <Image
                  source={AUNTIE_PULLING}
                  style={styles.auntieImg}
                  resizeMode="contain"
                />
              </Animated.View>
            </Animated.View>

            {/* Unlocked Achievement Reveal after Mama gets dragged off-screen */}
            <Animated.View
              pointerEvents={scenePhase === 'dragged' ? 'auto' : 'none'}
              style={[
                styles.achievementReveal,
                {
                  opacity: badgeOpacity,
                  transform: [{ scale: badgeScale }],
                },
              ]}
            >
              <MamaSealStamp size={64} variant="linen" />
              <Text style={styles.achievementStampTitle}>{achievement.badge}</Text>
              <TouchableOpacity
                style={styles.replayChip}
                onPress={runComedySequence}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={12} color={colors.primary} />
                <Text style={styles.replayChipText}>Replay family scene</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Headline & Dish */}
          <Text style={styles.eyebrow}>{achievement.badge}</Text>
          <Text style={styles.title}>{achievement.headline}</Text>
          <Text style={styles.dishName} numberOfLines={2}>
            {dishTitle}
          </Text>

          {/* Savings & XP Reward Tiles */}
          <View style={styles.statsRow}>
            <View style={styles.statCardGreen}>
              <Text style={styles.statLabelGreen}>SAVED VS DELIVERY</Text>
              <Text style={styles.statValGreen}>+{savedVsTakeoutFormatted}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>MAMA XP EARNED</Text>
              <Text style={styles.statVal}>+{xpAmount} XP</Text>
            </View>
          </View>

          <View style={styles.milestoneStrip}>
            <Ionicons name="flame" size={15} color={colors.primary} />
            <Text style={styles.milestoneStripText}>
              Home Cost: {homeCostFormatted} · {Math.max(1, mealsCookedCount)}{' '}
              {Math.max(1, mealsCookedCount) === 1 ? 'Plate' : 'Plates'} Cooked at Home
            </Text>
          </View>

          {/* Primary Claim CTA */}
          <TouchableOpacity
            style={styles.claimBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              onClaimReward();
            }}
            activeOpacity={0.88}
          >
            <Text style={styles.claimBtnText}>Claim Reward &amp; Continue</Text>
            <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 24, 16, 0.76)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.background,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(102, 112, 74, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  stage: {
    width: '100%',
    height: 196,
    borderRadius: 22,
    backgroundColor: '#F8F5EF',
    borderWidth: 1,
    borderColor: 'rgba(102, 112, 74, 0.16)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 14,
  },
  stageSteam: {
    position: 'absolute',
    top: 28,
    alignSelf: 'center',
    zIndex: 1,
  },
  speechPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 252, 247, 0.94)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(102, 112, 74, 0.18)',
    alignItems: 'center',
    zIndex: 10,
  },
  speechPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  familyRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '100%',
    height: 150,
    paddingBottom: 4,
  },
  cousinWrap: {
    marginRight: -22,
    marginBottom: 4,
    zIndex: 4,
  },
  mamaWrap: {
    zIndex: 3,
  },
  mamaOverfedImg: {
    width: 142,
    height: 142,
    borderRadius: 16,
  },
  auntieWrap: {
    marginLeft: -26,
    marginBottom: 2,
    zIndex: 5,
  },
  auntieImg: {
    width: 112,
    height: 112,
    borderRadius: 14,
  },
  achievementReveal: {
    position: 'absolute',
    top: 46,
    bottom: 8,
    left: 16,
    right: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 8,
  },
  achievementStampTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 1.1,
    color: colors.primary,
    textAlign: 'center',
  },
  replayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(102, 112, 74, 0.12)',
  },
  replayChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  eyebrow: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.3,
    color: colors.primary,
    marginBottom: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text.primary,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  dishName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 12,
  },
  statCardGreen: {
    flex: 1,
    backgroundColor: 'rgba(102, 112, 74, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(102, 112, 74, 0.28)',
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  statLabelGreen: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: colors.primary,
    marginBottom: 3,
  },
  statValGreen: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 252, 247, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: colors.text.secondary,
    marginBottom: 3,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text.primary,
  },
  milestoneStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.linen200,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 16,
  },
  milestoneStripText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
  },
  claimBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  claimBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
