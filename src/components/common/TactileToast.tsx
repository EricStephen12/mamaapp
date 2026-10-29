import React, { useEffect, useRef } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export interface ToastProps {
  visible: boolean;
  message: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  duration?: number;
}

export const TactileToast: React.FC<ToastProps> = ({
  visible,
  message,
  iconName = 'checkmark-circle',
  actionLabel,
  onAction,
  onDismiss,
  duration = 3200,
}) => {
  const translateY = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 60,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 6,
          tension: 200,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 60,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.pillContent}>
        <Ionicons name={iconName} size={18} color={colors.primary} />
        <Text style={styles.message} numberOfLines={1}>
          {message}
        </Text>
        {actionLabel && (
          <TouchableOpacity
            onPress={() => {
              if (onAction) onAction();
              handleDismiss();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 84,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 9999,
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.snow100,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 99,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    maxWidth: '100%',
  },
  message: {
    fontSize: typography.fontSize.reassurance,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    flexShrink: 1,
  },
  actionText: {
    fontSize: typography.fontSize.reassurance,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
    marginLeft: 4,
    textDecorationLine: 'underline',
  },
});

export default TactileToast;
