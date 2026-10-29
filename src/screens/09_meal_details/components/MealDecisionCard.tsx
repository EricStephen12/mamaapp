import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

interface MealDecisionCardProps {
  onChooseForToday?: () => void;
  onSaveToCollection?: () => void;
  isSaved?: boolean;
  supportingCopy?: string;
}

export const MealDecisionCard: React.FC<MealDecisionCardProps> = ({
  onChooseForToday,
  onSaveToCollection,
  isSaved = false,
  supportingCopy = 'Estimated prices and nutrition.',
}) => {
  const chooseScale = useRef(new Animated.Value(1)).current;
  const saveScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (anim: Animated.Value) => {
    Animated.spring(anim, {
      toValue: 0.96,
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

  return (
    <View style={styles.container}>
      {/* Choose For Today Action */}
      <Animated.View style={{ transform: [{ scale: chooseScale }], width: '100%' }}>
        <TouchableOpacity
          style={styles.chooseButton}
          onPress={onChooseForToday}
          onPressIn={() => handlePressIn(chooseScale)}
          onPressOut={() => handlePressOut(chooseScale)}
          activeOpacity={0.85}
        >
          <Text style={styles.chooseText}>Choose for today</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Save To Collection Action */}
      <Animated.View style={{ transform: [{ scale: saveScale }], width: '100%' }}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={onSaveToCollection}
          onPressIn={() => handlePressIn(saveScale)}
          onPressOut={() => handlePressOut(saveScale)}
          activeOpacity={0.85}
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={colors.primary}
          />
          <Text style={styles.saveText}>
            {isSaved ? 'Saved to collection' : 'Save to collection'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Reassurance Disclaimer */}
      <Text style={styles.disclaimerText}>{supportingCopy}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
    width: '100%',
  },
  chooseButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  chooseText: {
    color: colors.white,
    fontSize: typography.fontSize.sub,
    fontFamily: typography.fontFamily.medium,
    fontWeight: '500',
  },
  saveButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  saveText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sub,
    fontFamily: typography.fontFamily.medium,
    fontWeight: '500',
  },
  disclaimerText: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 17,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'left',
  },
});

export default MealDecisionCard;
