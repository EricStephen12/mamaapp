import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

interface StepData {
  number: string;
  title: string;
  instruction: string;
  timeHint?: string;
}

const COOKING_STEPS: StepData[] = [
  {
    number: '01',
    title: 'Roast & warm',
    timeHint: '18 min roast · hands-free',
    instruction:
      'Heat oven to 220°C. Toss sliced carrots and chickpeas with oil, cumin and salt. Roast for 18–20 minutes.',
  },
  {
    number: '02',
    title: 'Fluff & fold',
    timeHint: '5 min rest · easy',
    instruction:
      'Cover couscous with 150ml boiling water. Rest for 5 minutes, fluff, then fold in the baby spinach.',
  },
  {
    number: '03',
    title: 'Bring it together',
    timeHint: '2 min assemble',
    instruction:
      'Stir lemon juice into the yogurt. Top couscous with the roast vegetables, yogurt and lemon zest.',
  },
];

export const CookingStepsSection: React.FC = () => {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const toggleStep = (stepNumber: string) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNumber)
        ? prev.filter((n) => n !== stepNumber)
        : [...prev, stepNumber]
    );
  };

  const allCompleted = completedSteps.length === COOKING_STEPS.length;

  let cheerMessage = 'Tap steps as you go · Relax and take your time.';
  if (completedSteps.length === 1) {
    cheerMessage = 'Great start! The oven is doing the heavy lifting.';
  } else if (completedSteps.length === 2) {
    cheerMessage = 'Almost there! Just assembling your warm bowl.';
  } else if (allCompleted) {
    cheerMessage = 'Dinner is served · Time to sit down and enjoy.';
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>A little time in the kitchen</Text>
        {completedSteps.length > 0 && (
          <View style={styles.progressPill}>
            <Text style={styles.progressText}>
              {allCompleted ? 'All done!' : `${completedSteps.length}/${COOKING_STEPS.length} done`}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.promptHint}>{cheerMessage}</Text>

      <View style={styles.stepsList}>
        {COOKING_STEPS.map((step) => {
          const isDone = completedSteps.includes(step.number);
          return (
            <TouchableOpacity
              key={step.number}
              style={[styles.stepCard, isDone && styles.stepCardDone]}
              onPress={() => toggleStep(step.number)}
              activeOpacity={0.7}
            >
              <View style={[styles.stepBadge, isDone && styles.stepBadgeDone]}>
                {isDone ? (
                  <Ionicons name="checkmark" size={16} color={colors.white} />
                ) : (
                  <Text style={styles.stepBadgeText}>{step.number}</Text>
                )}
              </View>
              <View style={styles.stepContent}>
                <View style={styles.stepTitleRow}>
                  <Text style={[styles.stepTitle, isDone && styles.stepTitleDone]}>
                    {step.title}
                  </Text>
                  {step.timeHint && (
                    <Text style={[styles.timeHintText, isDone && styles.timeHintTextDone]}>
                      {step.timeHint}
                    </Text>
                  )}
                </View>
                <Text style={[styles.stepInstruction, isDone && styles.stepInstructionDone]}>
                  {step.instruction}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  heading: {
    fontSize: 26,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
    fontWeight: '500',
  },
  progressPill: {
    backgroundColor: colors.linen100,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
  },
  progressText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    fontWeight: '600',
  },
  promptHint: {
    fontSize: typography.fontSize.reassurance,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  stepsList: {
    gap: 10,
    width: '100%',
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    backgroundColor: colors.snow100,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.06)',
    width: '100%',
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  stepCardDone: {
    backgroundColor: 'rgba(233, 235, 221, 0.35)',
    borderColor: 'rgba(102, 112, 74, 0.25)',
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
  },
  stepBadgeDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepBadgeText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
    gap: 4,
  },
  stepTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  stepTitle: {
    fontSize: typography.fontSize.sub,
    fontFamily: typography.fontFamily.semiBold,
    fontWeight: '600',
    color: colors.text.primary,
  },
  stepTitleDone: {
    textDecorationLine: 'line-through',
    color: colors.text.secondary,
  },
  timeHintText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.primary,
    backgroundColor: colors.linen100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timeHintTextDone: {
    opacity: 0.6,
  },
  stepInstruction: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 18,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  stepInstructionDone: {
    color: colors.text.secondary,
    opacity: 0.7,
  },
});

export default CookingStepsSection;
