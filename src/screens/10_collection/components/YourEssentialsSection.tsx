import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { preferencesStore, formatCurrency } from '../../../services/preferencesStore';

interface YourEssentialsSectionProps {
  onEdit?: () => void;
  dietarySummary?: string;
}

export const YourEssentialsSection: React.FC<YourEssentialsSectionProps> = ({
  onEdit,
  dietarySummary,
}) => {
  const pass = preferencesStore.getKitchenPass();
  const formattedBudget = formatCurrency(pass.weeklyBudget, pass.currencySymbol, pass.currencyCode);

  const summaryText =
    dietarySummary ||
    `${pass.countryName} · ${pass.cuisineLabel} · ${formattedBudget} / week`;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Your Kitchen Pass</Text>
        {onEdit && (
          <TouchableOpacity
            onPress={onEdit}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Text style={styles.editLink}>Update</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.copy}>{summaryText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '600',
    color: colors.text.primary,
  },
  editLink: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
  },
  copy: {
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.text.secondary,
  },
});

export default YourEssentialsSection;
