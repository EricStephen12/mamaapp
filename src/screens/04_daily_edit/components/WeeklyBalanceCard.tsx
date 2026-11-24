import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { formatCurrency } from '../../../services/preferencesStore';

interface WeeklyBalanceCardProps {
  remainingAmount?: number;
  remainingDays?: number;
  spentAmount?: number;
  totalBudget?: number;
  currencySymbol?: string;
  currencyCode?: string;
  countryName?: string;
  mealsCookedCount?: number;
  onPressManage?: () => void;
}

export const WeeklyBalanceCard: React.FC<WeeklyBalanceCardProps> = ({
  remainingAmount = 0,
  spentAmount = 0,
  totalBudget = 0,
  currencySymbol = '₦',
  currencyCode = 'NGN',
  mealsCookedCount = 0,
  onPressManage,
}) => {
  const safeBudget = Math.max(1, totalBudget);
  const progressPercent =
    totalBudget > 0 ? Math.min(100, Math.max(0, (spentAmount / safeBudget) * 100)) : 0;

  const isBudgetFinished = totalBudget > 0 && remainingAmount <= 0;
  const isBudgetLow = !isBudgetFinished && totalBudget > 0 && progressPercent >= 75;

  const safeRemaining = Math.max(0, remainingAmount);
  const formattedRemaining = formatCurrency(safeRemaining, currencySymbol, currencyCode);
  const formattedTotal = formatCurrency(totalBudget, currencySymbol, currencyCode);

  const eyebrowLabel = isBudgetFinished
    ? 'WEEKLY BUDGET · FINISHED'
    : isBudgetLow
      ? 'WEEKLY BUDGET · RUNNING LOW'
      : 'WEEKLY BUDGET';

  const barColor = isBudgetFinished
    ? '#C84B31'
    : isBudgetLow
      ? '#D98A2B'
      : colors.primary;

  const mamaEmotionLine = isBudgetFinished
    ? "Budget finished! Don't stress—Mama will cook from what's in your kitchen."
    : isBudgetLow
      ? "Careful my child—budget's getting low! Let's lean on your pantry staples."
      : spentAmount > 0 && mealsCookedCount >= 3
        ? 'Look at you protecting your pocket—Mama is so proud!'
        : spentAmount > 0
          ? 'Steady pace—home cooking is keeping your wallet heavy.'
          : "Fresh week ahead—zero stress deciding what to eat.";

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isBudgetFinished && styles.cardFinished,
        isBudgetLow && styles.cardLow,
      ]}
      onPress={onPressManage}
      activeOpacity={0.85}
    >
      <View style={styles.mainMetricRow}>
        <View style={styles.budgetLeftBlock}>
          <Text
            style={[
              styles.countryText,
              isBudgetFinished && styles.eyebrowFinished,
              isBudgetLow && styles.eyebrowLow,
            ]}
          >
            {eyebrowLabel}
          </Text>
          <Text style={styles.remainingValue}>
            {formattedRemaining}{' '}
            <Text style={styles.leftLabel}>left of {formattedTotal}</Text>
          </Text>
        </View>

        <View style={styles.updatePill}>
          <Text style={styles.updateText}>{isBudgetFinished ? 'Top up' : 'Edit'}</Text>
          <Feather name="chevron-right" size={12} color={colors.primary} />
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progressPercent}%`, backgroundColor: barColor },
          ]}
        />
      </View>

      <View style={styles.mamaNoteRow}>
        <Ionicons
          name={isBudgetFinished ? 'heart' : isBudgetLow ? 'alert-circle' : 'shield-checkmark'}
          size={13}
          color={barColor}
        />
        <Text
          style={[
            styles.mamaNoteText,
            isBudgetFinished && styles.mamaNoteFinished,
            isBudgetLow && styles.mamaNoteLow,
          ]}
          numberOfLines={2}
        >
          {mamaEmotionLine}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: colors.snow200,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.06)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 9,
    width: '100%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardLow: {
    borderColor: 'rgba(217, 138, 43, 0.34)',
    backgroundColor: 'rgba(255, 250, 240, 0.96)',
  },
  cardFinished: {
    borderColor: 'rgba(200, 75, 49, 0.34)',
    backgroundColor: 'rgba(255, 246, 244, 0.96)',
  },
  countryText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.6,
  },
  eyebrowLow: {
    color: '#B86B1A',
  },
  eyebrowFinished: {
    color: '#B9382C',
  },
  updatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.snow100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.06)',
  },
  updateText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  mainMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  budgetLeftBlock: {
    gap: 2,
  },
  remainingValue: {
    fontSize: 20,
    lineHeight: 24,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.4,
  },
  leftLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(36, 40, 32, 0.08)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  mamaNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
  },
  mamaNoteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16.5,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  mamaNoteLow: {
    color: '#9A5912',
  },
  mamaNoteFinished: {
    color: '#9E3125',
  },
});
