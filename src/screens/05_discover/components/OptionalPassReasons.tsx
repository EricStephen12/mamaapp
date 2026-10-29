import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

interface OptionalPassReasonsProps {
  onReasonSelected?: (reason: string) => void;
}

const PASS_REASONS = [
  'Too expensive',
  'Too much effort',
  'Don’t like it',
];

export const OptionalPassReasons: React.FC<OptionalPassReasonsProps> = ({
  onReasonSelected,
}) => {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  const handleToggle = (reason: string) => {
    setSelectedReasons((prev) => {
      const exists = prev.includes(reason);
      const updated = exists
        ? prev.filter((r) => r !== reason)
        : [...prev, reason];
      if (!exists && onReasonSelected) {
        onReasonSelected(reason);
      }
      return updated;
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Not today? Tell us why (optional)</Text>

      <View style={styles.reasonsRow}>
        {PASS_REASONS.map((reason) => {
          const isSelected = selectedReasons.includes(reason);
          return (
            <Pressable
              key={reason}
              onPress={() => handleToggle(reason)}
              style={({ pressed }) => [
                styles.reasonChip,
                isSelected ? styles.chipSelected : styles.chipUnselected,
                pressed && styles.chipPressed,
              ]}
            >
              {isSelected && (
                <Ionicons
                  name="checkmark"
                  size={12}
                  color={colors.primary}
                  style={styles.checkIcon}
                />
              )}
              <Text
                style={[
                  styles.reasonLabel,
                  isSelected ? styles.labelSelected : styles.labelUnselected,
                ]}
              >
                {reason}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
    width: '100%',
  },
  eyebrow: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  reasonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 99,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.linen100,
    borderColor: colors.primary,
  },
  chipUnselected: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  chipPressed: {
    transform: [{ scale: 0.96 }],
  },
  checkIcon: {
    marginRight: 5,
  },
  reasonLabel: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 14,
    fontFamily: typography.fontFamily.regular,
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  labelUnselected: {
    color: colors.text.secondary,
  },
});

export default OptionalPassReasons;
