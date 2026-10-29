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

const FRITTATA_IMAGE =
  'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=400&q=80';

interface SaveForLaterMealCardProps {
  onSave?: () => void;
}

export const SaveForLaterMealCard: React.FC<SaveForLaterMealCardProps> = ({
  onSave,
}) => {
  const [saved, setSaved] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

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
        <Image
          source={{ uri: FRITTATA_IMAGE }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <View style={styles.mealInfo}>
          <Text style={styles.mealTitle}>Tomato & onion rice frittata</Text>
          <Text style={styles.mealSubtitle}>
            30 min · 2 servings · $1.70 est. / serving
          </Text>
        </View>
      </View>

      {/* Supporting Copy */}
      <Text style={styles.supportingCopy}>
        Another way to use your confirmed eggs, tomatoes, rice, and pantry staples.
      </Text>

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
  supportingCopy: {
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
