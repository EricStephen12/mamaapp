import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

interface SaveForLaterMealCardProps {
  title?: string;
  subtitle?: string;
  image?: string;
  onSave?: () => void;
}

export const SaveForLaterMealCard: React.FC<SaveForLaterMealCardProps> = ({
  title,
  subtitle,
  image,
  onSave,
}) => {
  const [saved, setSaved] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  if (!title) return null;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
    }).start();
  };

  const handleToggleSave = () => {
    setSaved(!saved);
    if (onSave) onSave();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Save for later</Text>

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

      {/* Save to Collection Action Button */}
      <Animated.View style={[{ transform: [{ scale }] }]}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleToggleSave}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.8}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={colors.primary}
          />
          <Text style={styles.actionLabel}>
            {saved ? 'Saved to collection' : 'Save to collection'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
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
  actionButton: {
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.snow100,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  actionLabel: {
    fontSize: typography.fontSize.sub,
    fontWeight: '500',
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
  },
});

export default SaveForLaterMealCard;
