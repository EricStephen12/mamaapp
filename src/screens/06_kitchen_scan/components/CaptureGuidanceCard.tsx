import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

export const CaptureGuidanceCard: React.FC = () => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Ingredients, not a finished meal.</Text>
      <Text style={styles.supportingCopy}>
        Lay out raw items or pantry staples. You can review and edit before we suggest meals.
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
    color: colors.text.primary,
    fontWeight: '500',
  },
  supportingCopy: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 16,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
});

export default CaptureGuidanceCard;
