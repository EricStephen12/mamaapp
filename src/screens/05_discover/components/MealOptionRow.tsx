import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

export interface MealOptionData {
  id: string;
  eyebrow: string;
  mealName: string;
  estimatedCost: string;
  imageUrl: string;
}

interface MealOptionRowProps {
  data: MealOptionData;
  onPress?: () => void;
}

export const MealOptionRow: React.FC<MealOptionRowProps> = ({ data, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: data.imageUrl }}
        style={styles.thumbnail}
        resizeMode="cover"
      />

      <View style={styles.information}>
        <Text style={styles.eyebrow}>{data.eyebrow}</Text>
        <Text style={styles.mealName}>{data.mealName}</Text>

        <View style={styles.costAndArrowRow}>
          <Text style={styles.estimatedCost}>{data.estimatedCost}</Text>
          <Feather name="arrow-up-right" size={17} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
  },
  thumbnail: {
    width: 92,
    height: 100,
    borderRadius: 16,
    backgroundColor: colors.border,
  },
  information: {
    flex: 1,
    gap: 6,
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontSize: typography.fontSize.label,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  mealName: {
    fontSize: 22,
    lineHeight: 25,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
    fontWeight: '500',
  },
  costAndArrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  estimatedCost: {
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
  },
});

export default MealOptionRow;
