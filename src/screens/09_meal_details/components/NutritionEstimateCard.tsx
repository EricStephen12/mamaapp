import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

interface NutritionEstimateCardProps {
  calories?: string;
  protein?: string;
  fiber?: string;
}

export const NutritionEstimateCard: React.FC<NutritionEstimateCardProps> = ({
  calories = '540',
  protein = '20g',
  fiber = '13g',
}) => {
  return (
    <View style={styles.container}>
      {/* 3 Nutrient Blocks */}
      <View style={styles.factsRow}>
        <View style={styles.nutrientBlockFirst}>
          <Text style={styles.amountText}>{calories}</Text>
          <Text style={styles.labelText}>kcal / serving</Text>
        </View>

        <View style={styles.nutrientBlock}>
          <Text style={styles.amountText}>{protein}</Text>
          <Text style={styles.labelText}>protein / serving</Text>
        </View>

        <View style={styles.nutrientBlock}>
          <Text style={styles.amountText}>{fiber}</Text>
          <Text style={styles.labelText}>fibre / serving</Text>
        </View>
      </View>

      {/* Disclaiming Footnote */}
      <Text style={styles.disclaimerText}>
        Approximate nutrition, not a verified analysis.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    width: '100%',
  },
  factsRow: {
    flexDirection: 'row',
    width: '100%',
  },
  nutrientBlockFirst: {
    flex: 1,
    gap: 3,
    alignItems: 'flex-start',
  },
  nutrientBlock: {
    flex: 1,
    borderLeftWidth: 1,
    borderColor: colors.border,
    paddingLeft: 12,
    gap: 3,
    alignItems: 'flex-start',
  },
  amountText: {
    fontSize: 28,
    lineHeight: 30,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
  },
  labelText: {
    fontSize: typography.fontSize.label,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  disclaimerText: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 17,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
});

export default NutritionEstimateCard;
