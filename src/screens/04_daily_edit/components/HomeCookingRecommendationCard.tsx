import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

interface HomeCookingRecommendationCardProps {
  title?: string;
  subtitle?: string;
  time?: string;
  price?: string;
  reason?: string;
  image?: string;
  cuisineLabel?: string;
  onExploreRecipe?: () => void;
  onSaveToggle?: (saved: boolean) => void;
}

export const HomeCookingRecommendationCard: React.FC<
  HomeCookingRecommendationCardProps
> = ({
  title,
  subtitle,
  time = '10 min',
  price,
  reason,
  image,
  cuisineLabel = 'Comfort',
  onExploreRecipe,
  onSaveToggle,
}) => {
  const [saved, setSaved] = useState(false);

  if (!title) return null;

  const handleToggleSave = () => {
    const nextSaved = !saved;
    setSaved(nextSaved);
    onSaveToggle?.(nextSaved);
  };

  return (
    <View style={styles.container}>
      {/* Section Heading */}
      <View style={styles.sectionHeading}>
        <Text style={styles.title}>Tonight&apos;s Pick for You</Text>
        <Text style={styles.sectionLink}>{cuisineLabel}</Text>
      </View>

      {/* Featured Meal Card */}
      <TouchableOpacity
        style={styles.imageCard}
        activeOpacity={0.92}
        onPress={onExploreRecipe}
      >
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.mealImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="restaurant-outline" size={32} color={colors.primary} />
          </View>
        )}

        {/* Preparation Badge */}
        {time ? (
          <View style={styles.prepBadge}>
            <Ionicons name="time-outline" size={13} color={colors.primary} />
            <Text style={styles.prepText}>{time}</Text>
          </View>
        ) : null}

        {/* Save Bookmark Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleToggleSave}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={16}
            color={colors.primary}
          />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Meal Title & Price Row */}
      <View style={styles.titleAndPriceRow}>
        <TouchableOpacity
          style={styles.titleBlock}
          activeOpacity={0.7}
          onPress={onExploreRecipe}
        >
          <Text style={styles.mealHeading}>{title}</Text>
          {subtitle ? <Text style={styles.mealSubtitle}>{subtitle}</Text> : null}
        </TouchableOpacity>

        {price ? (
          <View style={styles.priceBlock}>
            <Text style={styles.priceText}>{price}</Text>
            <Text style={styles.costBasis}>est. cost</Text>
          </View>
        ) : null}
      </View>

      {/* Recommendation Reasoning */}
      {reason ? <Text style={styles.reasoningText}>{reason}</Text> : null}

      {/* Explore Recipe Link */}
      <TouchableOpacity
        style={styles.recipeLinkRow}
        activeOpacity={0.7}
        onPress={onExploreRecipe}
      >
        <Text style={styles.linkLabel}>Start cooking</Text>
        <Ionicons name="arrow-forward" size={14} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    width: '100%',
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 26,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '500',
    color: colors.text.primary,
  },
  sectionLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  imageCard: {
    position: 'relative',
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.sand,
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prepBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  prepText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
  },
  saveButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleAndPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  mealHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    fontFamily: typography.fontFamily.serif,
    lineHeight: 26,
  },
  mealSubtitle: {
    fontSize: 13,
    color: colors.text.muted,
  },
  priceBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  costBasis: {
    fontSize: 11,
    color: colors.text.muted,
  },
  reasoningText: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  recipeLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default HomeCookingRecommendationCard;
