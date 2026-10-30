import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

interface EatingOutRecommendationCardProps {
  dishName?: string;
  spotName?: string;
  costText?: string;
  image?: string;
  eyebrow?: string;
  onExploreEatingOut?: () => void;
}

export const EatingOutRecommendationCard: React.FC<
  EatingOutRecommendationCardProps
> = ({
  dishName,
  spotName,
  costText,
  image,
  eyebrow = 'Eating out nearby',
  onExploreEatingOut,
}) => {
  if (!dishName && !spotName) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Or let someone else cook</Text>

      <TouchableOpacity
        style={styles.mealRow}
        activeOpacity={0.8}
        onPress={onExploreEatingOut}
      >
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <Ionicons name="restaurant-outline" size={24} color={colors.primary} />
          </View>
        )}

        <View style={styles.mealInfo}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.mealName}>{dishName || spotName}</Text>

          <View style={styles.costRow}>
            <Text style={styles.costText}>
              {costText ? `${costText}${spotName && dishName ? ` · ${spotName}` : ''}` : spotName || ''}
            </Text>
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
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 222, 0.7)',
  },
  thumbnail: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: colors.sand,
  },
  placeholderThumbnail: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealInfo: {
    flex: 1,
    gap: 3,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.primary,
    fontWeight: '700',
  },
  mealName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    fontFamily: typography.fontFamily.serif,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 4,
  },
  costText: {
    fontSize: 13,
    color: colors.text.muted,
  },
});
