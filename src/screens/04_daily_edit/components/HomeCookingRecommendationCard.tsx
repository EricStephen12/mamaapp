import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { preferencesStore, UserKitchenPass } from '../../../services/preferencesStore';

const MEAL_BY_CUISINE: Record<string, {
  title: string;
  subtitle: string;
  time: string;
  price: string;
  reason: string;
  image: string;
}> = {
  african_caribbean: {
    title: 'Sizzled Pepper Egg & Onion Skillet',
    subtitle: '1 Pan · High Comfort · 480 kcal',
    time: '9 min',
    price: '$2.20',
    reason: 'Spicy tomato reduction folded with eggs. Perfect with warm bread or rice.',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
  },
  asian_comfort: {
    title: 'Warm Ginger & Scallion Fried Rice',
    subtitle: '1 Skillet · Comfort Classic · 510 kcal',
    time: '12 min',
    price: '$1.95',
    reason: 'Fragrant crisp rice with loose egg curds and sesame oil aroma.',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  },
  mediterranean: {
    title: 'Garlic Butter & Herb Egg Toast',
    subtitle: 'Golden Skillet · 440 kcal',
    time: '8 min',
    price: '$2.10',
    reason: 'Crisped bread in garlic oil with soft-centered sunny eggs.',
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
  },
  latin_americas: {
    title: 'Spiced Black Bean & Egg Skillet',
    subtitle: '1 Pan · Warm Cumin & Lime · 490 kcal',
    time: '11 min',
    price: '$2.30',
    reason: 'Warm beans simmered with garlic, cumin, and fried eggs.',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  },
  everyday_comfort: {
    title: 'Crispy Buttered Egg & Rice Bowl',
    subtitle: '1 Pan · 3 Ingredients · 460 kcal',
    time: '10 min',
    price: '$1.80',
    reason: 'Quick comfort with what you have on the counter. Zero fuss.',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  },
};

interface HomeCookingRecommendationCardProps {
  onExploreRecipe?: () => void;
  onSaveToggle?: (saved: boolean) => void;
  selectedMood?: 'tired' | 'normal' | 'takeout';
}

export const HomeCookingRecommendationCard: React.FC<
  HomeCookingRecommendationCardProps
> = ({ onExploreRecipe, onSaveToggle, selectedMood = 'normal' }) => {
  const [saved, setSaved] = useState(false);
  const [pass, setPass] = useState<UserKitchenPass>(preferencesStore.getKitchenPass());

  useEffect(() => {
    const unsubscribe = preferencesStore.subscribe((updated) => setPass(updated));
    return unsubscribe;
  }, []);

  const handleToggleSave = () => {
    const nextSaved = !saved;
    setSaved(nextSaved);
    onSaveToggle?.(nextSaved);
  };

  const meal = MEAL_BY_CUISINE[pass.cuisineAnchor] || MEAL_BY_CUISINE.everyday_comfort;

  // Adapt for mood
  const displayTime = selectedMood === 'tired' ? '6 min' : meal.time;
  const displayTitle = selectedMood === 'tired' ? `Quick ${meal.title}` : meal.title;

  return (
    <View style={styles.container}>
      {/* Section Heading */}
      <View style={styles.sectionHeading}>
        <Text style={styles.title}>Tonight&apos;s Pick for You</Text>
        <Text style={styles.sectionLink}>{pass.cuisineLabel.split(' ')[0]} Comfort</Text>
      </View>

      {/* Featured Meal Card */}
      <TouchableOpacity
        style={styles.imageCard}
        activeOpacity={0.92}
        onPress={onExploreRecipe}
      >
        <Image
          source={{ uri: meal.image }}
          style={styles.mealImage}
          resizeMode="cover"
        />

        {/* Preparation Badge */}
        <View style={styles.prepBadge}>
          <Ionicons name="time-outline" size={13} color={colors.primary} />
          <Text style={styles.prepText}>{displayTime}</Text>
        </View>

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
          <Text style={styles.mealHeading}>
            {displayTitle}
          </Text>
          <Text style={styles.mealSubtitle}>
            {meal.subtitle}
          </Text>
        </TouchableOpacity>

        <View style={styles.priceBlock}>
          <Text style={styles.priceText}>{meal.price}</Text>
          <Text style={styles.costBasis}>est. cost</Text>
        </View>
      </View>

      {/* Recommendation Reasoning */}
      <Text style={styles.reasoningText}>
        {meal.reason}
      </Text>

      {/* Explore Recipe Link */}
      <TouchableOpacity
        style={styles.recipeLinkRow}
        activeOpacity={0.7}
        onPress={onExploreRecipe}
      >
        <Text style={styles.linkLabel}>Start cooking (3 steps)</Text>
        <Ionicons name="arrow-forward" size={16} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
    width: '100%',
  },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '500',
    color: colors.text.primary,
  },
  sectionLink: {
    fontSize: typography.fontSize.reassurance,
    color: colors.primary,
    fontWeight: '500',
  },
  imageCard: {
    height: 244,
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.border,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  prepBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: colors.snow200,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prepText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  saveButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.snow200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleAndPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  titleBlock: {
    flex: 1,
    gap: 6,
  },
  mealHeading: {
    fontSize: 28,
    lineHeight: 32,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
    fontWeight: '500',
  },
  mealSubtitle: {
    fontSize: typography.fontSize.reassurance,
    color: colors.text.secondary,
  },
  priceBlock: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 28,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
    lineHeight: 32,
  },
  costBasis: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  reasoningText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  recipeLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  linkLabel: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default HomeCookingRecommendationCard;
