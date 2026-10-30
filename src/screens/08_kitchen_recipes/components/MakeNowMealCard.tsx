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

interface MakeNowMealCardProps {
  title?: string;
  subtitle?: string;
  cookTime?: string;
  cost?: string;
  image?: string;
  reason?: string;
  ingredientsSummary?: string;
  onPass?: () => void;
  onLikeAndSave?: () => void;
  onChooseToCook?: () => void;
}

export const MakeNowMealCard: React.FC<MakeNowMealCardProps> = ({
  title = '',
  subtitle = '',
  cookTime = '',
  cost = '',
  image,
  reason = '',
  ingredientsSummary = '',
  onPass,
  onLikeAndSave,
  onChooseToCook,
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const passScale = useRef(new Animated.Value(1)).current;
  const saveScale = useRef(new Animated.Value(1)).current;
  const cookScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (anim: Animated.Value) => {
    Animated.spring(anim, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handlePressOut = (anim: Animated.Value) => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
    }).start();
  };

  const handleSaveToggle = () => {
    setIsSaved(!isSaved);
    if (onLikeAndSave) onLikeAndSave();
  };

  if (!title) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Make now, nothing to buy</Text>

      {/* Featured Meal Card */}
      <View style={styles.mealCard}>
        {/* Meal Photograph with Preparation Badge */}
        {image ? (
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: image }}
              style={styles.mealImage}
              resizeMode="cover"
            />
            {cookTime ? (
              <View style={styles.mealBadge}>
                <Text style={styles.badgeLabel}>{cookTime}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Meal Details Body */}
        <View style={styles.mealBody}>
          <Text style={styles.mealHeading}>{title}</Text>
          {subtitle ? <Text style={styles.mealSubtitle}>{subtitle}</Text> : null}

          {/* Price line */}
          {cost ? (
            <View style={styles.priceLine}>
              <Text style={styles.costAmount}>{cost}</Text>
              <Text style={styles.costBasis}>a serving, from what you have</Text>
            </View>
          ) : null}

          {/* Editorial note on why this was picked */}
          {reason ? (
            <View style={styles.quoteBlock}>
              <View style={styles.quoteRule} />
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ) : null}

          {ingredientsSummary ? (
            <Text style={styles.ingredientsSummary}>{ingredientsSummary}</Text>
          ) : null}
        </View>
      </View>

      {/* Swipe Action Buttons Row */}
      <View style={styles.actionsRow}>
        {/* Not Today */}
        <Animated.View style={[{ transform: [{ scale: passScale }] }, styles.actionFlex]}>
          <TouchableOpacity
            style={styles.notTodayButton}
            onPress={onPass}
            onPressIn={() => handlePressIn(passScale)}
            onPressOut={() => handlePressOut(passScale)}
            activeOpacity={0.8}
          >
            <Text style={styles.notTodayText}>Not today</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Like & Save */}
        <Animated.View style={[{ transform: [{ scale: saveScale }] }, styles.actionFlex]}>
          <TouchableOpacity
            style={styles.likeAndSaveButton}
            onPress={handleSaveToggle}
            onPressIn={() => handlePressIn(saveScale)}
            onPressOut={() => handlePressOut(saveScale)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isSaved ? 'heart' : 'heart-outline'}
              size={16}
              color={colors.white}
            />
            <Text style={styles.likeAndSaveText}>
              {isSaved ? 'Saved' : 'Keep it'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Cook this */}
        <Animated.View style={[{ transform: [{ scale: cookScale }] }, styles.cookFlex]}>
          <TouchableOpacity
            style={styles.cookButton}
            onPress={onChooseToCook}
            onPressIn={() => handlePressIn(cookScale)}
            onPressOut={() => handlePressOut(cookScale)}
            activeOpacity={0.8}
          >
            <Text style={styles.cookButtonText}>Cook this</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.white} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.primary,
    fontWeight: '700',
  },
  mealCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 222, 0.9)',
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
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
  mealBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(26, 24, 21, 0.72)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  mealBody: {
    padding: 20,
    gap: 10,
  },
  mealHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    fontFamily: typography.fontFamily.serif,
    lineHeight: 28,
  },
  mealSubtitle: {
    fontSize: 13,
    color: colors.text.muted,
  },
  priceLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingVertical: 2,
  },
  costAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  costBasis: {
    fontSize: 12,
    color: colors.text.muted,
  },
  quoteBlock: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    marginVertical: 4,
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
    lineHeight: 19,
  },
  ingredientsSummary: {
    fontSize: 12,
    color: colors.text.muted,
    lineHeight: 17,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionFlex: {
    flex: 1,
  },
  cookFlex: {
    flex: 1.4,
  },
  notTodayButton: {
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notTodayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  likeAndSaveButton: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  likeAndSaveText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  cookButton: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  cookButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
});
