import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

interface WeeklyBudgetCardProps {
  amount?: number;
  currencySymbol?: string;
  currencyCode?: string;
  period?: string;
  onAmountChange?: (amount: number) => void;
}

export const WeeklyBudgetCard: React.FC<WeeklyBudgetCardProps> = ({
  amount = 85,
  currencySymbol = '$',
  currencyCode = 'USD',
  period = 'per week',
  onAmountChange,
}) => {
  const [currentAmount, setCurrentAmount] = useState(amount);
  const [prevAmount, setPrevAmount] = useState(amount);

  if (prevAmount !== amount) {
    setPrevAmount(amount);
    setCurrentAmount(amount);
  }

  const step = currentAmount >= 5000 ? 1000 : currentAmount >= 1000 ? 250 : 5;
  const minVal = currentAmount >= 5000 ? 5000 : 15;
  const maxVal = currentAmount >= 5000 ? 500000 : 2000;

  const handleDelta = (delta: number) => {
    const next = Math.max(minVal, Math.min(maxVal, currentAmount + delta * step));
    setCurrentAmount(next);
    onAmountChange?.(next);
  };

  const presets = [
    { multiplier: 0.75, label: 'Light' },
    { multiplier: 1.0, label: 'Balanced' },
    { multiplier: 1.3, label: 'Generous' },
    { multiplier: 1.65, label: 'Gourmet' },
  ].map((p) => {
    const val = Math.round((amount * p.multiplier) / (amount >= 1000 ? 500 : 5)) * (amount >= 1000 ? 500 : 5);
    return { val: Math.max(minVal, val), label: p.label };
  });

  const handleSelectPreset = (val: number) => {
    setCurrentAmount(val);
    onAmountChange?.(val);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Weekly food budget</Text>

      <View style={styles.amountRow}>
        <View style={styles.amountBlock}>
          <Text style={styles.amount}>
            {currencySymbol}{currentAmount.toLocaleString()}
          </Text>
          <Text style={styles.period}>{currencyCode} · {period}</Text>
        </View>

        {/* Tactile Adjuster Steppers */}
        <View style={styles.stepperContainer}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => handleDelta(-1)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="remove" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => handleDelta(1)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Preset Budget Chips */}
      <View style={styles.presetRow}>
        {presets.map((p) => {
          const isSelected = Math.abs(currentAmount - p.val) < (amount >= 1000 ? 250 : 3);
          return (
            <TouchableOpacity
              key={p.label}
              style={[styles.presetChip, isSelected && styles.presetChipSelected]}
              onPress={() => handleSelectPreset(p.val)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.presetChipText,
                  isSelected && styles.presetChipTextSelected,
                ]}
              >
                {p.label} ({currencySymbol}{p.val.toLocaleString()})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.tipBlock}>
        <Ionicons name="information-circle-outline" size={14} color={colors.primary} />
        <Text style={styles.tipText}>
          Mama balances smart home cooking and treats within this target.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 222, 0.85)',
    padding: 20,
    gap: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.primary,
    fontWeight: '700',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountBlock: {
    gap: 2,
  },
  amount: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
    fontFamily: typography.fontFamily.serif,
  },
  period: {
    fontSize: 12,
    color: colors.text.muted,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.sand,
    borderRadius: 14,
    padding: 4,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.sand,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  presetChipTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  tipBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(217, 107, 74, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 16,
  },
});

export default WeeklyBudgetCard;
