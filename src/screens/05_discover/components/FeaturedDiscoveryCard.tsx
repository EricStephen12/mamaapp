import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

export interface DiscoveryItem {
  id: string;
  positionLabel: string;
  category: string;
  cost: string;
  title: string;
  nutrition: string;
  reason: string;
  imageUrl?: string;
}

interface FeaturedDiscoveryCardProps {
  item: DiscoveryItem;
  onOpenDetails?: () => void;
  swipeAnim?: Animated.ValueXY;
  cardOpacity?: Animated.Value;
}

export const FeaturedDiscoveryCard: React.FC<FeaturedDiscoveryCardProps> = ({
  item,
  onOpenDetails,
  swipeAnim,
  cardOpacity,
}) => {
  const animatedStyle = swipeAnim
    ? {
        transform: [
          ...swipeAnim.getTranslateTransform(),
          {
            rotate: swipeAnim.x.interpolate({
              inputRange: [-200, 0, 200],
              outputRange: ['-10deg', '0deg', '10deg'],
              extrapolate: 'clamp',
            }),
          },
        ],
        opacity: cardOpacity || 1,
      }
    : {};

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      {/* Featured Meal Image Header */}
      <View style={styles.imageWrapper}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.mealImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="restaurant-outline" size={44} color={colors.primary} />
          </View>
        )}

        {/* Position Counter Badge */}
        <View style={styles.positionBadge}>
          <Text style={styles.positionText}>{item.positionLabel}</Text>
        </View>

        {/* Open Recipe Details Circular Button */}
        <TouchableOpacity
          style={styles.recipeDetailsButton}
          onPress={onOpenDetails}
          activeOpacity={0.8}
        >
          <Feather name="arrow-up-right" size={18} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Discovery Details Body */}
      <View style={styles.contentBody}>
        {/* Eyebrow & Price Row */}
        <View style={styles.metaRow}>
          <Text style={styles.eyebrow}>{item.category}</Text>
          <Text style={styles.estimatedCost}>{item.cost}</Text>
        </View>

        {/* Meal Heading */}
        <Text style={styles.heading}>{item.title}</Text>

        {/* Nutritional Breakdown */}
        <Text style={styles.nutritionCopy}>{item.nutrition}</Text>

        {/* Editorial note on why this was picked */}
        <View style={styles.quoteBlock}>
          <View style={styles.quoteRule} />
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 222, 0.9)',
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  imageWrapper: {
    position: 'relative',
    height: 220,
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
  positionBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(26, 24, 21, 0.7)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  positionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  recipeDetailsButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contentBody: {
    padding: 20,
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.primary,
    fontWeight: '700',
  },
  estimatedCost: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    fontFamily: typography.fontFamily.serif,
    lineHeight: 28,
  },
  nutritionCopy: {
    fontSize: 12,
    color: colors.text.muted,
  },
  quoteBlock: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    marginTop: 4,
  },
  quoteRule: {
    width: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.text.secondary,
    lineHeight: 18,
  },
});
