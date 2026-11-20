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
  imageUrl?: string;
  targetScreen: 'AtHomeMealDetails' | 'EatingOutMealDetails';
}

interface SavedMealCardProps {
  item: SavedMealItem;
  onPress: () => void;
  onUnsave?: () => void;
  onRollToday?: () => void;
}

export const SavedMealCard: React.FC<SavedMealCardProps> = ({
  item,
  onPress,
  onUnsave,
  onRollToday,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 240,
      friction: 12,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 180,
      friction: 8,
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
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.editorialTile}>
            <Ionicons name="restaurant-outline" size={26} color={colors.primary} />
          </View>
        )}

        {/* Top Row: Time/Cost Pill + Bookmark Button */}
        <View style={styles.topRow}>
          <View style={styles.metaPill}>
            <Text style={styles.metaPillText}>
              {item.typeLabel} · {item.cost}
            </Text>
          </View>

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

        {/* Bottom Scrim Overlay with Serif Title & Roll Action */}
        <View style={styles.bottomScrim}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          {onRollToday && (
            <Pressable
              style={styles.rollTodayPill}
              onPress={(e) => {
                e.stopPropagation();
                onRollToday();
              }}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="dice-outline" size={11} color="#FFFFFF" />
              <Text style={styles.rollTodayText}>Roll today</Text>
            </Pressable>
          )}
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
    height: 215,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#1E211B',
    justifyContent: 'space-between',
    shadowColor: '#181512',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  image: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  editorialTile: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#262922',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  metaPill: {
    backgroundColor: 'rgba(18, 20, 16, 0.72)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  metaPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bookmarkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  bottomScrim: {
    paddingHorizontal: 12,
    paddingTop: 22,
    paddingBottom: 14,
    backgroundColor: 'rgba(18, 20, 16, 0.72)',
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rollTodayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  rollTodayText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default SavedMealCard;
