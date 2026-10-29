import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

export const BalancedMealGuidanceCard: React.FC = () => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>A little balance, your way</Text>
      <Text style={styles.supportingCopy}>
        Eggs for protein, rice for energy, and tomatoes for vegetables. A simple, balanced foundation for tonight.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
    paddingLeft: 16,
    paddingVertical: 4,
    gap: 4,
    width: '100%',
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '500',
    color: colors.text.primary,
  },
  supportingCopy: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 16,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
});

export default BalancedMealGuidanceCard;
