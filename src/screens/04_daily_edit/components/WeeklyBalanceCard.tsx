import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
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
  onPressManage,
}) => {
  const safeBudget = Math.max(1, totalBudget);
  const progressPercent =
    totalBudget > 0 ? Math.min(100, Math.max(0, (spentAmount / safeBudget) * 100)) : 0;

  const safeRemaining = Math.max(0, remainingAmount);
  const formattedRemaining = formatCurrency(safeRemaining, currencySymbol, currencyCode);
  const formattedTotal = formatCurrency(totalBudget, currencySymbol, currencyCode);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPressManage}
      activeOpacity={0.85}
    >
      <View style={styles.mainMetricRow}>
        <View style={styles.budgetLeftBlock}>
          <Text style={styles.countryText}>WEEKLY BUDGET</Text>
          <Text style={styles.remainingValue}>
            {formattedRemaining}{' '}
            <Text style={styles.leftLabel}>left of {formattedTotal}</Text>
          </Text>
        </View>

        <View style={styles.updatePill}>
          <Text style={styles.updateText}>Edit</Text>
          <Feather name="chevron-right" size={12} color={colors.primary} />
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
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
    gap: 10,
    width: '100%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  countryText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.6,
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
});
