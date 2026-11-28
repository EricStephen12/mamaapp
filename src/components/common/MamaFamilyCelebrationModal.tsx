import React, { useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { preferencesStore } from '../../services/preferencesStore';
import { SteamWisps } from '../signature/SteamWisps';
import { MamaCharacter } from './MamaCharacter';
import { useModalBottomInset } from '../../hooks/useBottomNavInset';

export interface MamaFamilyCelebrationProps {
  visible: boolean;
  dishTitle: string;
  homeCostFormatted: string;
  savedVsTakeoutFormatted: string;
  mealsCookedCount: number;
  xpAwarded?: number;
  xpSkipReason?: 'daily_cap' | 'cooldown' | 'duplicate_dish';
  onClaimReward: () => void;
}

interface CookAchievement {
  badge: string;
  headline: string;
  mamaLine: string;
}

function getCookAchievement(mealsCookedCount: number): CookAchievement {
  if (mealsCookedCount <= 1) {
    return {
      badge: 'FIRST PLATE COOKED',
      headline: 'Plate Served!',
      mamaLine: '“First pot seasoned — Mama is proud!”',
    };
  }
  if (mealsCookedCount <= 3) {
    return {
      badge: 'HOME KITCHEN RHYTHM',
      headline: 'Cooked at Home!',
      mamaLine: '“Way better than takeout.”',
    };
  }
  if (mealsCookedCount <= 7) {
    return {
      badge: 'DELIVERY DEFEATED',
      headline: 'Wallet Saved!',
      mamaLine: '“Full belly, heavy wallet.”',
    };
  }
  return {
    badge: 'HEAD CHEF',
    headline: 'Kitchen Legend!',
    mamaLine: '“You run this kitchen now.”',
  };
}

export const MamaFamilyCelebrationModal: React.FC<MamaFamilyCelebrationProps> = ({
  visible,
  dishTitle,
  savedVsTakeoutFormatted,
  mealsCookedCount,
  xpAwarded,
  xpSkipReason,
  onClaimReward,
}) => {
  const achievement = getCookAchievement(mealsCookedCount);
  const xpAmount =
    typeof xpAwarded === 'number'
      ? xpAwarded
      : preferencesStore.isMamaPlus()
        ? 100
        : 50;
  const modalBottomInset = useModalBottomInset(22);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.88)).current;
  const bowlBounce = useRef(new Animated.Value(0)).current;
  const bowlScale = useRef(new Animated.Value(0.75)).current;

  const runJoyDance = useCallback(() => {
    bowlScale.setValue(0.75);
    bowlBounce.setValue(0);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    Animated.parallel([
      Animated.spring(bowlScale, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(bowlBounce, {
          toValue: -12,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(bowlBounce, {
          toValue: 0,
          friction: 4,
          tension: 120,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [bowlBounce, bowlScale]);

  useEffect(() => {
    if (!visible) {
      backdropOpacity.setValue(0);
      cardScale.setValue(0.88);
      return;
    }
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 6,
        tension: 95,
        useNativeDriver: true,
      }),
    ]).start();
    runJoyDance();
  }, [visible, backdropOpacity, cardScale, runJoyDance]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClaimReward}>
      <Animated.View
        style={[styles.backdrop, { paddingBottom: modalBottomInset, opacity: backdropOpacity }]}
      >
        <Animated.View style={[styles.card, { transform: [{ scale: cardScale }] }]}>
          {/* Single Unified Living Mama Bowl Celebration Stage */}
          <View style={styles.stage}>
            <SteamWisps triggerKey={dishTitle} style={styles.stageSteam} />

            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>{achievement.badge}</Text>
            </View>

            <Animated.View
              style={{
                transform: [{ translateY: bowlBounce }, { scale: bowlScale }],
              }}
            >
              <MamaCharacter
                pose="delighted"
                size={122}
                isSpeaking={true}
                onPress={runJoyDance}
              />
            </Animated.View>

            <Text style={styles.mamaLineText}>{achievement.mamaLine}</Text>
          </View>

          <Text style={styles.title}>{achievement.headline}</Text>
          <Text style={styles.dishName} numberOfLines={2}>
            {dishTitle}
          </Text>

          {/* Clean Reward Strip */}
          <View style={styles.summaryStrip}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryValGreen}>+{savedVsTakeoutFormatted}</Text>
              <Text style={styles.summaryLabel}>Saved vs delivery</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Text style={styles.summaryVal}>
                {xpAmount > 0 ? `+${xpAmount} XP` : 'Logged ✓'}
              </Text>
              <Text style={styles.summaryLabel}>
                {xpAmount > 0
                  ? `${Math.max(1, mealsCookedCount)} ${Math.max(1, mealsCookedCount) === 1 ? 'plate' : 'plates'} cooked`
                  : xpSkipReason === 'daily_cap'
                    ? 'Daily XP limit reached'
                    : xpSkipReason === 'cooldown'
                      ? 'Next XP in 3 hrs'
                      : 'XP earned for this dish'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.claimBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              onClaimReward();
            }}
            activeOpacity={0.88}
          >
            <Text style={styles.claimBtnText}>Continue</Text>
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
    backgroundColor: 'rgba(20, 24, 16, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  card: {
    width: '100%',
    maxWidth: 368,
    backgroundColor: colors.background,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(102, 112, 74, 0.22)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 12,
  },
  stage: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#F8F5EF',
    borderWidth: 1,
    borderColor: 'rgba(102, 112, 74, 0.14)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 14,
    gap: 8,
    marginBottom: 14,
  },
  stageSteam: {
    position: 'absolute',
    top: 22,
    alignSelf: 'center',
    zIndex: 1,
  },
  badgePill: {
    backgroundColor: 'rgba(102, 112, 74, 0.12)',
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgePillText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.0,
    color: colors.primary,
  },
  mamaLineText: {
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  title: {
    fontSize: 21,
    fontWeight: '900',
    color: colors.text.primary,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  dishName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 16,
  },
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(102, 112, 74, 0.14)',
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(102, 112, 74, 0.16)',
  },
  summaryValGreen: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
  summaryVal: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text.primary,
  },
  summaryLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.text.secondary,
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
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  claimBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
