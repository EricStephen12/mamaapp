import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

interface WeeklyBudgetCardProps {
  amount?: number;
  period?: string;
  onAmountChange?: (amount: number) => void;
}

const BUDGET_PRESETS = [
  { val: 65, label: 'Light' },
  { val: 85, label: 'Balanced' },
  { val: 110, label: 'Generous' },
  { val: 140, label: 'Gourmet' },
];

export const WeeklyBudgetCard: React.FC<WeeklyBudgetCardProps> = ({
  amount = 85,
  period = 'USD / week',
  onAmountChange,
}) => {
  const [currentAmount, setCurrentAmount] = useState(amount);

  const handleDelta = (delta: number) => {
    const next = Math.max(30, Math.min(300, currentAmount + delta));
    setCurrentAmount(next);
    onAmountChange?.(next);
  };

  const handleSelectPreset = (val: number) => {
    setCurrentAmount(val);
    onAmountChange?.(val);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Weekly food budget</Text>

      <View style={styles.amountRow}>
        <View style={styles.amountBlock}>
          <Text style={styles.amount}>${currentAmount}</Text>
          <Text style={styles.period}>{period}</Text>
        </View>

        {/* Tactile Adjuster Steppers */}
        <View style={styles.stepperContainer}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => handleDelta(-5)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="remove" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => handleDelta(5)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Preset Budget Chips */}
      <View style={styles.presetsRow}>
        {BUDGET_PRESETS.map((p) => {
          const isSelected = currentAmount === p.val;
          return (
            <TouchableOpacity
              key={p.val}
              style={[
                styles.presetChip,
                isSelected && styles.presetChipActive,
              ]}
              onPress={() => handleSelectPreset(p.val)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.presetChipText,
                  isSelected && styles.presetChipTextActive,
                ]}
              >
                ${p.val} · {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.divider} />

      <View style={styles.scopeRow}>
        <Ionicons
          name="calendar-outline"
          size={16}
          color={colors.primary}
          style={styles.calendarIcon}
        />
        <Text style={styles.supportingCopy}>
          For one person · groceries + eating out{'\n'}Resets every Monday
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: colors.snow100,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    paddingHorizontal: 22,
    paddingVertical: 20,
    gap: 14,
    width: '100%',
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  eyebrow: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  amount: {
    fontSize: 54,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
    fontWeight: '400',
    lineHeight: 60,
  },
  period: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.snow200,
    borderRadius: 99,
    padding: 3,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 99,
    backgroundColor: colors.snow200,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetChipActive: {
    backgroundColor: colors.linen100,
    borderColor: colors.primary,
  },
  presetChipText: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  presetChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
  },
  scopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  calendarIcon: {
    marginTop: 2,
  },
  supportingCopy: {
    flex: 1,
    fontSize: typography.fontSize.reassurance,
    lineHeight: 17,
    color: colors.text.secondary,
  },
});

export default WeeklyBudgetCard;
