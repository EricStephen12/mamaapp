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
      tension: 220,
      friction: 10,
    }).start();
  };

  const handlePressOut = (anim: Animated.Value) => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 160,
      friction: 7,
    }).start();
  };

  return (
    <View style={styles.container}>
      <View style={styles.actionsRow}>
        {/* Pass Button */}
        <Animated.View style={[{ transform: [{ scale: passScale }] }, styles.passFlex]}>
          <TouchableOpacity
            style={styles.passButton}
            onPress={onPass}
            onPressIn={() => handlePressIn(passScale)}
            onPressOut={() => handlePressOut(passScale)}
            activeOpacity={0.9}
          >
            <Text style={styles.passText}>Pass</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Save Button */}
        <Animated.View style={[{ transform: [{ scale: saveScale }] }, styles.saveFlex]}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={onLikeAndSave}
            onPressIn={() => handlePressIn(saveScale)}
            onPressOut={() => handlePressOut(saveScale)}
            activeOpacity={0.9}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={16}
              color={colors.snow100}
            />
            <Text style={styles.saveText}>
              {isSaved ? 'Saved' : 'Save to collection'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  passFlex: {
    flex: 1,
  },
  saveFlex: {
    flex: 2,
  },
  passButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#ECEAE2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  saveButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.snow100,
    letterSpacing: 0.2,
  },
});

export default SwipeActions;
