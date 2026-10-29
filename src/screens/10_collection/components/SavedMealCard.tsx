import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

export interface SavedMealItem {
  id: string;
  title: string;
  type: 'home' | 'eating_out';
  typeLabel: string;
  cost: string;
  imageUrl: string;
  targetScreen: 'AtHomeMealDetails' | 'EatingOutMealDetails';
}

interface SavedMealCardProps {
  item: SavedMealItem;
  onPress: () => void;
  onUnsave?: () => void;
}

export const SavedMealCard: React.FC<SavedMealCardProps> = ({
  item,
  onPress,
  onUnsave,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 5,
      tension: 300,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 200,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, styles.wrapper]}>
      <Pressable
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Meal Photograph with Bookmark Badge */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
          <Pressable
            style={styles.bookmarkBadge}
            onPress={(e) => {
              e.stopPropagation();
              if (onUnsave) onUnsave();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="bookmark" size={14} color={colors.primary} />
          </Pressable>
        </View>

        {/* Meal Metadata */}
        <View style={styles.metadata}>
          <Text style={styles.typeLabel} numberOfLines={1}>
            {item.typeLabel}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.cost} numberOfLines={1}>
            {item.cost}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  card: {
    flex: 1,
    gap: 10,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 159,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.linen200,
  },
  image: {
    width: '100%',
    height: 159,
  },
  bookmarkBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.snow200,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  metadata: {
    gap: 4,
    alignItems: 'flex-start',
  },
  typeLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semiBold,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    lineHeight: 24,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '500',
    color: colors.text.primary,
    minHeight: 48,
  },
  cost: {
    fontSize: typography.fontSize.reassurance,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
});

export default SavedMealCard;
