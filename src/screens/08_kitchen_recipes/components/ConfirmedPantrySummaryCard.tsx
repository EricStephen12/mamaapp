import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

interface ConfirmedPantrySummaryCardProps {
  onEditPantry?: () => void;
}

export const ConfirmedPantrySummaryCard: React.FC<
  ConfirmedPantrySummaryCardProps
> = ({ onEditPantry }) => {
  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.eyebrow}>Confirmed ingredients</Text>
        <TouchableOpacity onPress={onEditPantry} activeOpacity={0.7}>
          <Text style={styles.editAction}>Edit pantry</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Copy */}
      <Text style={styles.summaryText}>
        {`4 tomatoes · 4 eggs · 200g dry rice · 2 onions\nOlive oil, salt & cumin confirmed. No pepper assumed.`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(233, 235, 221, 0.45)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(102, 112, 74, 0.14)',
    padding: 18,
    gap: 8,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  eyebrow: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
    color: colors.primary,
  },
  editAction: {
    fontSize: typography.fontSize.reassurance,
    fontFamily: typography.fontFamily.regular,
    color: colors.primary,
    fontWeight: '500',
  },
  summaryText: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 18,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
});

export default ConfirmedPantrySummaryCard;
