import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

interface EntryOptionProps {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  supportingCopy: string;
  onPress: () => void;
}

const EntryOption: React.FC<EntryOptionProps> = ({
  iconName,
  label,
  supportingCopy,
  onPress,
}) => (
  <TouchableOpacity
    style={styles.optionCard}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.iconCircle}>
      <Ionicons name={iconName} size={20} color={colors.primary} />
    </View>
    <Text style={styles.optionLabel}>{label}</Text>
    <Text style={styles.optionCopy}>{supportingCopy}</Text>
  </TouchableOpacity>
);

interface CookWithWhatIHaveCardProps {
  onSelectPhoto?: () => void;
  onSelectManual?: () => void;
}

export const CookWithWhatIHaveCard: React.FC<CookWithWhatIHaveCardProps> = ({
  onSelectPhoto,
  onSelectManual,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.headingBlock}>
        <Text style={styles.heading}>Cook with what you have</Text>
        <Text style={styles.supportingCopy}>
          Turn ingredients on hand into simple, tailored recipes.
        </Text>
      </View>

      <View style={styles.optionsRow}>
        <EntryOption
          iconName="camera-outline"
          label="Photo"
          supportingCopy="Snap your ingredients"
          onPress={() => onSelectPhoto && onSelectPhoto()}
        />
        <EntryOption
          iconName="add"
          label="Manual"
          supportingCopy="Enter items by name"
          onPress={() => onSelectManual && onSelectManual()}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: colors.snow100,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
    width: '100%',
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  headingBlock: {
    gap: 6,
  },
  heading: {
    fontSize: 25,
    lineHeight: 28,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
    fontWeight: '500',
  },
  supportingCopy: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 17,
    color: colors.text.secondary,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.linen100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: typography.fontSize.reassurance,
    fontWeight: '600',
    color: colors.text.primary,
  },
  optionCopy: {
    fontSize: 10,
    lineHeight: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 10,
    lineHeight: 15,
    color: colors.text.secondary,
  },
});

export default CookWithWhatIHaveCard;
