import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

interface BeforeYouOrderSectionProps {
  fillingDescription?: string;
  allergyNotice?: string;
}

export const BeforeYouOrderSection: React.FC<BeforeYouOrderSectionProps> = ({
  fillingDescription = 'Roasted vegetables, hummus, cucumber, and fresh herbs. Likely contains wheat and sesame.',
  allergyNotice = 'Peanut cross-contact unknown. Please verify ingredients with restaurant staff.',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Before you order</Text>

      <Text style={styles.fillingDescription}>{fillingDescription}</Text>

      {/* Allergy Warning Card */}
      <View style={styles.allergyCard}>
        <Ionicons
          name="information-circle-outline"
          size={18}
          color={colors.primary}
          style={styles.infoIcon}
        />
        <Text style={styles.allergyNoticeText}>{allergyNotice}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    width: '100%',
  },
  heading: {
    fontSize: 27,
    lineHeight: 28,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '500',
    color: colors.text.primary,
  },
  fillingDescription: {
    fontSize: typography.fontSize.body,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.primary,
  },
  allergyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
    paddingLeft: 12,
    paddingVertical: 2,
    width: '100%',
  },
  infoIcon: {
    marginTop: 1,
  },
  allergyNoticeText: {
    flex: 1,
    fontSize: typography.fontSize.reassurance,
    lineHeight: 17,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
});

export default BeforeYouOrderSection;
