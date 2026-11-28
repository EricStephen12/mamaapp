import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { MamaCharacter } from '../../../components/common/MamaCharacter';
import { preferencesStore } from '../../../services/preferencesStore';
import { useModalBottomInset } from '../../../hooks/useBottomNavInset';

export interface CookStepCardItem {
  id: number;
  timeHint: string;
  title: string;
  instruction: string;
}

interface InteractiveCookModalProps {
  visible: boolean;
  dishTitle: string;
  steps: CookStepCardItem[];
  currentStepIndex: number;
  completedStepIds: number[];
  onSelectStepIndex: (index: number) => void;
  onCompleteCurrentStep: () => void;
  onFinishCooking: () => void;
  onClose: () => void;
}

interface DishRewardModalProps {
  visible: boolean;
  dishTitle: string;
  homeCostFormatted: string;
  savedVsTakeoutFormatted: string;
  mealsCookedCount: number;
  onClaimReward: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_WIDTH = Math.min(SCREEN_WIDTH - 28, 390);

export const InteractiveCookModal: React.FC<InteractiveCookModalProps> = ({
  visible,
  dishTitle,
  steps,
  currentStepIndex,
  completedStepIds,
  onSelectStepIndex,
  onCompleteCurrentStep,
  onFinishCooking,
  onClose,
}) => {
  const cardScale = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const modalBottomInset = useModalBottomInset(22);

  useEffect(() => {
    if (!visible) {
      cardScale.setValue(0.88);
      opacityAnim.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, currentStepIndex, cardScale, opacityAnim]);

  if (!visible || steps.length === 0) return null;

  const safeIndex = Math.max(0, Math.min(steps.length - 1, currentStepIndex));
  const step = steps[safeIndex];
  const isLastStep = safeIndex === steps.length - 1;
  const isStepDone = completedStepIds.includes(step.id);
  const progressPercent = Math.round(((safeIndex + 1) / steps.length) * 100);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    cardScale.setValue(0.93);
    Animated.spring(cardScale, {
      toValue: 1,
      friction: 6,
      tension: 95,
      useNativeDriver: true,
    }).start();

    onCompleteCurrentStep();
    if (isLastStep) {
      onFinishCooking();
    } else {
      onSelectStepIndex(safeIndex + 1);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.backdrop, { paddingBottom: modalBottomInset, opacity: opacityAnim }]}>
        <TouchableOpacity
          style={styles.backdropDismiss}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.flashcard,
            {
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          {/* Top Bar */}
          <View style={styles.topHeader}>
            <View style={styles.stepPill}>
              <Ionicons name="flame" size={13} color="#FFFFFF" />
              <Text style={styles.stepPillText}>
                STEP {safeIndex + 1} OF {steps.length} • {step.title.toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeCircle} onPress={onClose}>
              <Ionicons name="close" size={18} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Segmented Step Dots */}
          <View style={styles.progressDotsRow}>
            {steps.map((s, idx) => {
              const active = idx === safeIndex;
              const done = completedStepIds.includes(s.id) || idx < safeIndex;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.progressSegment,
                    done && styles.progressSegmentDone,
                    active && styles.progressSegmentActive,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    onSelectStepIndex(idx);
                  }}
                />
              );
            })}
          </View>

          {/* Main Instruction Stage */}
          <View style={styles.instructionBox}>
            <View style={styles.dishMiniRow}>
              <Text style={styles.dishMiniTitle} numberOfLines={1}>
                {dishTitle}
              </Text>
              <View style={styles.timeHintBadge}>
                <Ionicons name="time-outline" size={12} color={colors.primary} />
                <Text style={styles.timeHintText}>{step.timeHint}</Text>
              </View>
            </View>

            <Text style={styles.bigInstructionText}>{step.instruction}</Text>

            {isStepDone && (
              <View style={styles.doneTag}>
                <Ionicons name="checkmark-circle" size={14} color="#15803D" />
                <Text style={styles.doneTagText}>Step Completed</Text>
              </View>
            )}
          </View>

          {/* Mini Mama Encouragement Row */}
          <View style={styles.mamaMiniBar}>
            <MamaCharacter
              pose={isLastStep ? 'delighted' : 'cooking'}
              size={40}
              isSpeaking={true}
            />
            <Text style={styles.mamaMiniText}>
              {isLastStep
                ? '"Almost ready — give it a quick taste!"'
                : `"${progressPercent}% done — keep the heat steady."`}
            </Text>
          </View>

          {/* Navigation Controls */}
          <View style={styles.controlsRow}>
            {safeIndex > 0 ? (
              <TouchableOpacity
                style={styles.prevBtn}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  onSelectStepIndex(safeIndex - 1);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={16} color={colors.primary} />
                <Text style={styles.prevBtnText}>Back</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.nextStepBtn}
              onPress={handleNext}
              activeOpacity={0.88}
            >
              <Ionicons
                name={isLastStep ? 'trophy' : 'checkmark-circle'}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.nextStepBtnText}>
                {isLastStep ? 'Finish & Claim XP' : 'Next Step'}
              </Text>
              {!isLastStep && (
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export const DishRewardModal: React.FC<DishRewardModalProps> = ({
  visible,
  dishTitle,
  homeCostFormatted,
  savedVsTakeoutFormatted,
  mealsCookedCount,
  onClaimReward,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.75)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const modalBottomInset = useModalBottomInset(22);

  useEffect(() => {
    if (!visible) {
      scaleAnim.setValue(0.75);
      opacityAnim.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 85,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, scaleAnim, opacityAnim]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClaimReward}
    >
      <Animated.View style={[styles.backdrop, { paddingBottom: modalBottomInset, opacity: opacityAnim }]}>
        <Animated.View
          style={[
            styles.rewardCard,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Trophy Top Icon */}
          <View style={styles.trophyCircle}>
            <Ionicons name="trophy" size={34} color="#FFFFFF" />
          </View>

          <Text style={styles.rewardEyebrow}>BUDGET &amp; CRAVING WIN</Text>
          <Text style={styles.rewardTitle}>Sorted at Home!</Text>
          <Text style={styles.rewardDishName} numberOfLines={2}>
            {dishTitle}
          </Text>

          {/* Real Savings & XP Grid */}
          <View style={styles.rewardStatsRow}>
            <View style={styles.rewardStatCardGreen}>
              <Text style={styles.rewardStatLabelGreen}>SAVED VS DELIVERY</Text>
              <Text style={styles.rewardStatValGreen}>+{savedVsTakeoutFormatted}</Text>
            </View>

            <View style={styles.rewardStatCard}>
              <Text style={styles.rewardStatLabel}>XP EARNED</Text>
              <Text style={styles.rewardStatVal}>
                +{preferencesStore.isMamaPlus() ? 100 : 50} XP
              </Text>
            </View>
          </View>

          {/* Meals Logged Pill */}
          <View style={styles.streakCelebrationBar}>
            <Ionicons name="flame" size={16} color={colors.primary} />
            <Text style={styles.streakCelebrationText}>
              Home Cost: {homeCostFormatted} • {Math.max(1, mealsCookedCount)} Meal{Math.max(1, mealsCookedCount) === 1 ? '' : 's'} Logged
            </Text>
          </View>

          {/* Mama Pride Quote */}
          <View style={styles.mamaRewardRow}>
            <MamaCharacter pose="delighted" size={46} isSpeaking={true} />
            <Text style={styles.mamaRewardText}>
              &ldquo;Well done! Your kitchen smells amazing and your wallet stays heavy.&rdquo;
            </Text>
          </View>

          {/* Claim Button */}
          <TouchableOpacity
            style={styles.claimBtn}
            onPress={onClaimReward}
            activeOpacity={0.88}
          >
            <Text style={styles.claimBtnText}>Claim Reward & Continue</Text>
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
    backgroundColor: 'rgba(18, 22, 16, 0.74)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  backdropDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  flashcard: {
    width: '100%',
    maxWidth: MODAL_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 18,
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.3,
    shadowRadius: 26,
    elevation: 16,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  stepPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.snow200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(36, 40, 32, 0.1)',
  },
  progressSegmentDone: {
    backgroundColor: 'rgba(102, 112, 74, 0.45)',
  },
  progressSegmentActive: {
    backgroundColor: colors.primary,
  },
  instructionBox: {
    backgroundColor: colors.snow200,
    borderRadius: 22,
    padding: 18,
    gap: 12,
    minHeight: 165,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.06)',
  },
  dishMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dishMiniTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  timeHintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  timeHintText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  bigInstructionText: {
    fontFamily: typography.fontFamily.serif,
    fontSize: 19,
    lineHeight: 27,
    fontWeight: '700',
    color: colors.text.primary,
  },
  doneTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  doneTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  mamaMiniBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 6,
  },
  mamaMiniText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: colors.text.secondary,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.snow200,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
  },
  prevBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  nextStepBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 18,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  nextStepBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rewardCard: {
    width: '100%',
    maxWidth: MODAL_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.34,
    shadowRadius: 28,
    elevation: 18,
  },
  trophyCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  rewardEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  rewardTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.4,
  },
  rewardDishName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  rewardStatsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  rewardStatCardGreen: {
    flex: 1.2,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    gap: 2,
  },
  rewardStatLabelGreen: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  rewardStatValGreen: {
    fontFamily: typography.fontFamily.serif,
    fontSize: 22,
    fontWeight: '800',
    color: '#14532D',
  },
  rewardStatCard: {
    flex: 1,
    backgroundColor: colors.snow200,
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  rewardStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
  rewardStatVal: {
    fontFamily: typography.fontFamily.serif,
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  streakCelebrationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(102, 112, 74, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  streakCelebrationText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  mamaRewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.snow200,
    borderRadius: 18,
    padding: 12,
    width: '100%',
  },
  mamaRewardText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
    color: colors.text.primary,
    fontWeight: '500',
  },
  claimBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 20,
    marginTop: 4,
  },
  claimBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

