import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

interface EatingOutPriceCardProps {
  price?: string;
  serving?: string;
  disclaimer?: string;
  budgetRemaining?: string;
  tasteLabel?: string;
}

export const EatingOutPriceCard: React.FC<EatingOutPriceCardProps> = ({
  price = '',
  serving = '1 portion',
  disclaimer = 'Before tax, tips or extras',
  budgetRemaining,
  tasteLabel = 'culinary',
}) => {
  return (
    <View style={styles.container}>
      {/* Price Header Row */}
      <View style={styles.priceRow}>
        <View style={styles.priceColumn}>
          <Text style={styles.eyebrow}>Estimated meal price</Text>
          <Text style={styles.priceText}>{price}</Text>
        </View>

        <View style={styles.basisColumn}>
          <Text style={styles.servingText}>{serving}</Text>
          <Text style={styles.extrasText}>{disclaimer}</Text>
        </View>
      </View>

      {/* Editorial note on why this fits */}
      <View style={styles.quoteBlock}>
        <View style={styles.quoteRule} />
        <Text style={styles.reasonText}>
          Fits your {tasteLabel} tastes{budgetRemaining ? ` · Leaves ${budgetRemaining} this week` : ''}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    width: '100%',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  priceColumn: {
    gap: 4,
  },
  eyebrow: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  priceText: {
    fontSize: 34,
    lineHeight: 38,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
    fontWeight: '400',
  },
  basisColumn: {
    alignItems: 'flex-end',
    gap: 2,
  },
  servingText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.primary,
  },
  extrasText: {
    fontSize: typography.fontSize.label,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
  quoteBlock: {
    gap: 8,
    marginTop: 2,
  },
  quoteRule: {
    width: 20,
    height: 1,
    backgroundColor: colors.primary,
  },
  reasonText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: typography.fontFamily.serif,
    fontStyle: 'italic',
    color: colors.text.muted,
  },
});

export default EatingOutPriceCard;
