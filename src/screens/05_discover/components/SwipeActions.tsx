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

interface SwipeActionsProps {
  onPass: () => void;
  onLikeAndSave: () => void;
  isSaved?: boolean;
}

export const SwipeActions: React.FC<SwipeActionsProps> = ({
  onPass,
  onLikeAndSave,
  isSaved = false,
}) => {
  const passScale = useRef(new Animated.Value(1)).current;
  const saveScale = useRef(new Animated.Value(1)).current;

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

  return (
    <View style={styles.container}>
      {/* Primary Action Buttons */}
      <View style={styles.actionsRow}>
        {/* Not Today (Pass) */}
        <Animated.View style={[{ transform: [{ scale: passScale }] }, styles.actionFlex]}>
          <TouchableOpacity
            style={styles.notTodayButton}
            onPress={onPass}
            onPressIn={() => handlePressIn(passScale)}
            onPressOut={() => handlePressOut(passScale)}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={16} color={colors.text.secondary} />
            <Text style={styles.notTodayText}>Not today</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Like & Save */}
        <Animated.View style={[{ transform: [{ scale: saveScale }] }, styles.actionFlex]}>
          <TouchableOpacity
            style={styles.likeAndSaveButton}
            onPress={onLikeAndSave}
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
              {isSaved ? 'Saved!' : 'Like & save'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={colors.white} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Gesture Hints */}
      <View style={styles.gestureHintsRow}>
        <Text style={styles.hintText}>Swipe left to pass</Text>
        <Text style={styles.hintText}>Swipe right to keep</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    width: '100%',
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
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 26,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  notTodayText: {
    fontSize: typography.fontSize.sub,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
  },
  likeAndSaveButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  likeAndSaveText: {
    fontSize: typography.fontSize.sub,
    color: colors.white,
    fontFamily: typography.fontFamily.regular,
    fontWeight: '500',
  },
  gestureHintsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  hintText: {
    fontSize: typography.fontSize.label,
    color: colors.text.secondary,
  },
  reassuranceText: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 17,
    color: colors.text.secondary,
  },
});

export default SwipeActions;
