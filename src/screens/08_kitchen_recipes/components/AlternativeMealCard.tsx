import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

const SPINACH_MEAL_IMAGE =
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80';

interface AlternativeMealCardProps {
  onViewRecipe?: () => void;
}

export const AlternativeMealCard: React.FC<AlternativeMealCardProps> = ({
  onViewRecipe,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>One small extra</Text>

      {/* Meal Info Row */}
      <View style={styles.mealRow}>
        <Image
          source={{ uri: SPINACH_MEAL_IMAGE }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <View style={styles.mealInfo}>
          <Text style={styles.mealTitle}>Spinach, tomato & egg rice</Text>
          <Text style={styles.mealSubtitle}>
            25 min · 2 servings · Contains egg
          </Text>
        </View>
      </View>

      {/* Missing Ingredient & Cost Distinction Callout */}
      <View style={styles.calloutCard}>
        <Text style={styles.missingTitle}>Missing: spinach · buy 1 × 150g bag</Text>

        <View style={styles.costRow}>
          <Text style={styles.checkoutCost}>$2.00 est. at checkout</Text>
          <Text style={styles.useCost}>$2.25 est. / serving</Text>
        </View>

        <Text style={styles.calloutExplanation}>
          Adds fresh spinach to your bowls. Per-serving cost reflects ingredients used.
        </Text>
      </View>

      <Text style={styles.varietyGuidance}>
        Optional addition for extra greens.
      </Text>

      {/* View Recipe & Shopping List Action */}
      <TouchableOpacity
        style={styles.actionRow}
        onPress={onViewRecipe}
        activeOpacity={0.7}
      >
        <Text style={styles.actionLabel}>View recipe & shopping list</Text>
        <Feather name="arrow-right" size={16} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
    width: '100%',
  },
  eyebrow: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
    color: colors.primary,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
  },
  thumbnail: {
    width: 104,
    height: 116,
    borderRadius: 16,
    backgroundColor: colors.border,
  },
  mealInfo: {
    flex: 1,
    gap: 8,
    alignItems: 'flex-start',
  },
  mealTitle: {
    fontSize: 26,
    lineHeight: 28,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
    fontWeight: '500',
  },
  mealSubtitle: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 17,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  calloutCard: {
    backgroundColor: 'rgba(233, 235, 221, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(102, 112, 74, 0.14)',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    width: '100%',
  },
  missingTitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    fontWeight: '500',
    color: colors.text.primary,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  checkoutCost: {
    fontSize: typography.fontSize.reassurance,
    color: colors.primary,
    fontFamily: typography.fontFamily.regular,
  },
  useCost: {
    fontSize: typography.fontSize.reassurance,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  calloutExplanation: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 17,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  varietyGuidance: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 17,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
  },
  actionLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontFamily: typography.fontFamily.regular,
  },
});

export default AlternativeMealCard;
