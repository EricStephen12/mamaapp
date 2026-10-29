import React, { useRef } from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface SelectableChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  isAddButton?: boolean;
}

export const SelectableChip: React.FC<SelectableChipProps> = ({
  label,
  selected = false,
  onPress,
  style,
  textStyle,
  isAddButton = false,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
      friction: 6,
      tension: 250,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 180,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.chip,
          selected ? styles.chipSelected : styles.chipUnselected,
          isAddButton && styles.chipAdd,
          style,
        ]}
      >
        {selected && (
          <Ionicons
            name="checkmark"
            size={12}
            color={colors.primary}
            style={styles.checkIcon}
          />
        )}
        <Text
          style={[
            styles.label,
            selected ? styles.labelSelected : styles.labelUnselected,
            isAddButton && styles.labelAdd,
            textStyle,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 99,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  chipSelected: {
    backgroundColor: colors.linen100,
    borderColor: 'rgba(102, 112, 74, 0.4)',
  },
  chipUnselected: {
    backgroundColor: colors.snow100,
    borderColor: 'rgba(36, 40, 32, 0.1)',
  },
  chipAdd: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(36, 40, 32, 0.2)',
    borderStyle: 'dashed',
    shadowOpacity: 0,
    elevation: 0,
  },
  checkIcon: {
    marginRight: 5,
  },
  label: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 15,
    fontFamily: typography.fontFamily.regular,
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  labelUnselected: {
    color: colors.text.secondary,
  },
  labelAdd: {
    color: colors.text.secondary,
  },
});

export default SelectableChip;
