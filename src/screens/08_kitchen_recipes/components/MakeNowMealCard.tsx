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

const MAKE_NOW_IMAGE_URL =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

interface MakeNowMealCardProps {
  onPass?: () => void;
  onLikeAndSave?: () => void;
  onChooseToCook?: () => void;
}

export const MakeNowMealCard: React.FC<MakeNowMealCardProps> = ({
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

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Make now, nothing to buy</Text>

      {/* Featured Meal Card */}
      <View style={styles.mealCard}>
        {/* Meal Photograph with Preparation Badge */}
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: MAKE_NOW_IMAGE_URL }}
            style={styles.mealImage}
            resizeMode="cover"
          />
          <View style={styles.mealBadge}>
            <Text style={styles.badgeLabel}>25 min</Text>
          </View>
        </View>

        {/* Meal Details Body */}
        <View style={styles.mealBody}>
          <Text style={styles.mealHeading}>Tomato & egg rice bowls</Text>
          <Text style={styles.mealSubtitle}>
            Easy · Makes 2 servings · Contains egg
          </Text>

          {/* Price line */}
          <View style={styles.priceLine}>
            <Text style={styles.costAmount}>$1.85</Text>
            <Text style={styles.costBasis}>a serving, from what you have</Text>
          </View>

          {/* Editorial note on why this was picked */}
          <View style={styles.quoteBlock}>
            <View style={styles.quoteRule} />
            <Text style={styles.reasonText}>
              Mediterranean, the way you like it, and it uses the tomatoes first.
            </Text>
          </View>

          <Text style={styles.ingredientsSummary}>
            Tomatoes, eggs, rice, onion, olive oil and cumin. About 540 kcal and
            20g protein a serving.
          </Text>
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
      </View>

      {/* Choose to Cook Today Primary Action */}
      <Animated.View style={[{ transform: [{ scale: cookScale }] }]}>
        <TouchableOpacity
          style={styles.chooseToCookButton}
          onPress={onChooseToCook}
          onPressIn={() => handlePressIn(cookScale)}
          onPressOut={() => handlePressOut(cookScale)}
          activeOpacity={0.8}
        >
          <Text style={styles.chooseToCookLabel}>Cook this tonight</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    width: '100%',
  },
  eyebrow: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
    color: colors.primary,
  },
  mealCard: {
    backgroundColor: colors.snow100,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.06)',
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  imageWrapper: {
    height: 256,
    width: '100%',
    position: 'relative',
    backgroundColor: colors.border,
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  mealBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 252, 247, 0.94)',
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 6,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  badgeLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontFamily: typography.fontFamily.medium,
    fontWeight: '600',
  },
  mealBody: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 22,
    gap: 12,
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
    lineHeight: 16,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  priceLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
  },
  costAmount: {
    fontSize: 28,
    lineHeight: 32,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
  },
  costBasis: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  quoteBlock: {
    marginTop: 8,
    gap: 10,
  },
  quoteRule: {
    width: 24,
    height: 1,
    backgroundColor: colors.primary,
  },
  reasonText: {
    fontSize: 17,
    lineHeight: 23,
    fontFamily: typography.fontFamily.serif,
    fontStyle: 'italic',
    color: colors.text.muted,
  },
  ingredientsSummary: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 18,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionFlex: {
    flex: 1,
  },
  notTodayButton: {
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.12)',
    borderRadius: 25,
    backgroundColor: colors.snow100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  notTodayText: {
    fontSize: typography.fontSize.sub,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
  },
  likeAndSaveButton: {
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(102, 112, 74, 0.25)',
    backgroundColor: colors.linen100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  likeAndSaveText: {
    fontSize: typography.fontSize.sub,
    color: colors.primary,
    fontFamily: typography.fontFamily.medium,
    fontWeight: '600',
  },
  chooseToCookButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 3,
  },
  chooseToCookLabel: {
    fontSize: typography.fontSize.sub,
    color: colors.white,
    fontFamily: typography.fontFamily.medium,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default MakeNowMealCard;
