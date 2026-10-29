import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

const PITA_IMAGE_URL =
  'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=400&q=80';

interface EatingOutRecommendationCardProps {
  onExploreEatingOut?: () => void;
}

export const EatingOutRecommendationCard: React.FC<
  EatingOutRecommendationCardProps
> = ({ onExploreEatingOut }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Or let someone else cook</Text>

      <TouchableOpacity
        style={styles.mealRow}
        activeOpacity={0.8}
        onPress={onExploreEatingOut}
      >
        <Image
          source={{ uri: PITA_IMAGE_URL }}
          style={styles.thumbnail}
          resizeMode="cover"
        />

        <View style={styles.mealInfo}>
          <Text style={styles.eyebrow}>Eating out nearby</Text>
          <Text style={styles.mealName}>Roasted veg & hummus pita</Text>

          <View style={styles.costRow}>
            <Text style={styles.costText}>$8.50 est. · Olive & Grain</Text>
            <Feather name="arrow-up-right" size={16} color={colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
    width: '100%',
  },
  title: {
    fontSize: 26,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '500',
    color: colors.text.primary,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
  },
  thumbnail: {
    width: 92,
    height: 100,
    borderRadius: 14,
    backgroundColor: colors.border,
  },
  mealInfo: {
    flex: 1,
    gap: 6,
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
    color: colors.primary,
  },
  mealName: {
    fontSize: 22,
    lineHeight: 25,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
    fontWeight: '500',
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  costText: {
    fontSize: 12,
    color: colors.text.primary,
  },
});

export default EatingOutRecommendationCard;
