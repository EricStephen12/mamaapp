import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

interface AlternativeMealCardProps {
  title?: string;
  subtitle?: string;
  missingIngredient?: string;
  checkoutCost?: string;
  servingCost?: string;
  image?: string;
  onViewRecipe?: () => void;
}

export const AlternativeMealCard: React.FC<AlternativeMealCardProps> = ({
  title,
  subtitle,
  missingIngredient,
  checkoutCost,
  servingCost,
  image,
  onViewRecipe,
}) => {
  if (!title) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>One small extra</Text>

      {/* Meal Info Row */}
      <View style={styles.mealRow}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]} />
        )}
        <View style={styles.mealInfo}>
          <Text style={styles.mealTitle}>{title}</Text>
          {subtitle ? (
            <Text style={styles.mealSubtitle}>{subtitle}</Text>
          ) : null}
        </View>
      </View>

      {/* Missing Ingredient & Cost Callout */}
      {missingIngredient ? (
        <View style={styles.calloutCard}>
          <Text style={styles.missingTitle}>Missing: {missingIngredient}</Text>

          <View style={styles.costRow}>
            {checkoutCost ? <Text style={styles.checkoutCost}>{checkoutCost} est. at checkout</Text> : null}
            {servingCost ? <Text style={styles.useCost}>{servingCost} est. / serving</Text> : null}
          </View>

          <Text style={styles.calloutExplanation}>
            Optional addition for extra variety with your confirmed pantry.
          </Text>
        </View>
      ) : null}

      {/* View Recipe & Shopping List Action */}
      <TouchableOpacity
        style={styles.actionRow}
        onPress={onViewRecipe}
        activeOpacity={0.7}
      >
        <Text style={styles.actionLabel}>View recipe &amp; shopping list</Text>
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
  thumbnailPlaceholder: {
    backgroundColor: 'rgba(102, 112, 74, 0.08)',
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
