import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
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
  imageUrl: string;
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
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.mealImage}
          resizeMode="cover"
        />

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
    backgroundColor: colors.snow100,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  imageWrapper: {
    height: 300,
    width: '100%',
    position: 'relative',
    backgroundColor: colors.border,
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  positionBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: colors.snow200,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  positionText: {
    fontSize: typography.fontSize.label,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  recipeDetailsButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.snow200,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  contentBody: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
    color: colors.primary,
  },
  estimatedCost: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
    color: colors.primary,
  },
  heading: {
    fontSize: 28,
    lineHeight: 32,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
    fontWeight: '500',
  },
  nutritionCopy: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 17,
    color: colors.text.secondary,
  },
  quoteBlock: {
    marginTop: 12,
    gap: 12,
  },
  quoteRule: {
    width: 24,
    height: 1,
    backgroundColor: colors.primary,
  },
  reasonText: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: typography.fontFamily.serif,
    fontStyle: 'italic',
    color: colors.text.muted,
  },
});

export default FeaturedDiscoveryCard;
