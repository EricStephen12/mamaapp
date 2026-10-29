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
  onPressManage?: () => void;
}

export const WeeklyBalanceCard: React.FC<WeeklyBalanceCardProps> = ({
  remainingAmount = 23800,
  remainingDays = 4,
  spentAmount = 11200,
  totalBudget = 35000,
  currencySymbol = '₦',
  currencyCode = 'NGN',
  countryName = 'Nigeria',
  onPressManage,
}) => {
  const safeBudget = Math.max(1, totalBudget);
  const progressPercent = Math.min(100, Math.max(0, (spentAmount / safeBudget) * 100));

  const formattedRemaining = formatCurrency(remainingAmount, currencySymbol, currencyCode);
  const formattedSpent = formatCurrency(spentAmount, currencySymbol, currencyCode);
  const formattedTotal = formatCurrency(totalBudget, currencySymbol, currencyCode);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPressManage}
      activeOpacity={0.8}
    >
      {/* Top Row: Country Tag + Update Button */}
      <View style={styles.topRow}>
        <View style={styles.countryTag}>
          <Ionicons name="location" size={12} color={colors.primary} />
          <Text style={styles.countryText}>{countryName} · {currencySymbol}</Text>
        </View>

        <View style={styles.updatePill}>
          <Text style={styles.updateText}>Budget</Text>
          <Feather name="chevron-down" size={12} color={colors.primary} />
        </View>
      </View>

      {/* Main Number Row */}
      <View style={styles.mainNumberRow}>
        <Text style={styles.remainingValue}>{formattedRemaining}</Text>
        <Text style={styles.leftLabel}>left</Text>
      </View>

      {/* Thin Sleek Progress Line */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Bottom Summary: Spent vs Total */}
      <View style={styles.bottomRow}>
        <Text style={styles.subMetric}>{formattedSpent} spent of {formattedTotal}</Text>
        <Text style={styles.subMetric}>{remainingDays} days left</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: colors.snow100,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 8,
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countryText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  updatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.snow200,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  updateText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  mainNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  remainingValue: {
    fontSize: 34,
    lineHeight: 38,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
    fontWeight: '700',
  },
  leftLabel: {
    fontSize: typography.fontSize.sub,
    color: colors.text.muted,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(36, 40, 32, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subMetric: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
});

export default WeeklyBalanceCard;
