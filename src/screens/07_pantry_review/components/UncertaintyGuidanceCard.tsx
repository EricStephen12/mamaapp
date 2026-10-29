import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

export const UncertaintyGuidanceCard: React.FC = () => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Your check makes the difference.</Text>
      <Text style={styles.supportingCopy}>
        Photos cannot verify exact amounts or allergens. Edit anything we misread.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
    paddingLeft: 14,
    paddingVertical: 4,
    gap: 4,
    width: '100%',
  },
  title: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  supportingCopy: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 16,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
});

export default UncertaintyGuidanceCard;
