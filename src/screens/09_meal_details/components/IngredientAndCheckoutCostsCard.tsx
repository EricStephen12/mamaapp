import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

interface IngredientAndCheckoutCostsCardProps {
  usedPerServing?: string;
  checkoutTotal?: string;
  servings?: number;
}

export const IngredientAndCheckoutCostsCard: React.FC<
  IngredientAndCheckoutCostsCardProps
> = ({
  usedPerServing = '$2.80',
  checkoutTotal = '$13.40',
  servings = 2,
}) => {
  return (
    <View style={styles.container}>
      {/* Cost Comparison Row */}
      <View style={styles.comparisonRow}>
        {/* Ingredients Used Column */}
        <View style={styles.costCol}>
          <Text style={styles.costEyebrow}>Ingredients used</Text>
          <Text style={styles.amountText}>{usedPerServing}</Text>
          <Text style={styles.costBasis}>est. per serving</Text>
        </View>

        {/* At Checkout Column */}
        <View style={[styles.costCol, styles.checkoutCol]}>
          <Text style={styles.costEyebrow}>At checkout</Text>
          <Text style={styles.amountText}>{checkoutTotal}</Text>
          <Text style={styles.costBasis}>est. shopping basket</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Explanatory Note */}
      <Text style={styles.supportingCopy}>
        {`$5.60 used for ${servings} servings. Checkout includes full packages to restock your pantry.`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    backgroundColor: colors.snow100,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.06)',
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 12,
    width: '100%',
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  comparisonRow: {
    flexDirection: 'row',
    gap: 18,
    width: '100%',
  },
  costCol: {
    flex: 1,
    gap: 4,
    alignItems: 'flex-start',
  },
  checkoutCol: {
    borderLeftWidth: 1,
    borderColor: colors.border,
    paddingLeft: 18,
  },
  costEyebrow: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  amountText: {
    fontSize: 34,
    lineHeight: 38,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
  },
  costBasis: {
    fontSize: typography.fontSize.label,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
  },
  supportingCopy: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 17,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
});

export default IngredientAndCheckoutCostsCard;
