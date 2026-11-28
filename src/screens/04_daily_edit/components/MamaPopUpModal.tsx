import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { MamaCharacter, MamaPose } from '../../../components/common/MamaCharacter';
import { RolledMeal } from '../../../services/api/rollService';
import { useModalBottomInset } from '../../../hooks/useBottomNavInset';

interface MamaPopUpModalProps {
  visible: boolean;
  pose: MamaPose;
  quote: string;
  activeMeal: RolledMeal | null;
  onClose: () => void;
  onAskNewAdvice: () => void;
  onTriggerRoll: () => void;
  onOpenRecipe: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_WIDTH = Math.min(SCREEN_WIDTH - 32, 380);

export const MamaPopUpModal: React.FC<MamaPopUpModalProps> = ({
  visible,
  pose,
  quote,
  activeMeal,
  onClose,
  onAskNewAdvice,
  onTriggerRoll,
  onOpenRecipe,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.84)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [selectedMode, setSelectedMode] = useState<'default' | 'shortcut' | 'flavor'>('default');
  const modalBottomInset = useModalBottomInset(22);

  useEffect(() => {
    if (!visible) {
      scaleAnim.setValue(0.84);
      opacityAnim.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, scaleAnim, opacityAnim]);

  if (!visible) return null;

  const dishName = activeMeal?.title || 'this dish';
  const mainIngredient = activeMeal?.ingredients?.[0]?.name || 'your base';

  let displayedDialogue = quote;
  if (selectedMode === 'shortcut') {
    displayedDialogue = `Cut ${mainIngredient.toLowerCase()} smaller and cover the pan — cuts cook time by a third.`;
  } else if (selectedMode === 'flavor') {
    displayedDialogue = activeMeal?.mamaTip
      ? activeMeal.mamaTip
      : `Toast your aromatics in warm oil for 45 seconds first for deeper flavor.`;
  }

  const handleSelectChip = (mode: 'default' | 'shortcut' | 'flavor') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedMode(mode);
    if (mode === 'default') {
      onAskNewAdvice();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.backdrop, { paddingBottom: modalBottomInset, opacity: opacityAnim }]}>
        <TouchableOpacity
          style={styles.backdropDismiss}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.popupCard,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.mamaBadge}>
              <Ionicons name="flame" size={13} color="#FFFFFF" />
              <Text style={styles.mamaBadgeText}>MAMA’S TIP</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={18} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Character + Speech Card */}
          <View style={styles.speechStage}>
            <MamaCharacter
              pose={selectedMode === 'flavor' ? 'delighted' : pose}
              size={64}
              isSpeaking={true}
              onPress={() => handleSelectChip('default')}
            />
            <View style={styles.speechBubble}>
              <Text style={styles.speechDishLabel} numberOfLines={1}>
                ON {dishName.toUpperCase()}
              </Text>
              <Text style={styles.speechText}>
                &ldquo;{displayedDialogue}&rdquo;
              </Text>
            </View>
          </View>

          {/* Interactive 1-Tap Prompt Chips */}
          <View style={styles.promptSection}>
            <Text style={styles.promptHeading}>QUICK TIPS</Text>
            <View style={styles.chipsWrap}>
              <TouchableOpacity
                style={[
                  styles.promptChip,
                  selectedMode === 'shortcut' && styles.promptChipActive,
                ]}
                onPress={() => handleSelectChip('shortcut')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="flash"
                  size={13}
                  color={selectedMode === 'shortcut' ? '#FFFFFF' : colors.primary}
                />
                <Text
                  style={[
                    styles.promptChipText,
                    selectedMode === 'shortcut' && styles.promptChipTextActive,
                  ]}
                >
                  5-Min Shortcut
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.promptChip,
                  selectedMode === 'flavor' && styles.promptChipActive,
                ]}
                onPress={() => handleSelectChip('flavor')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="flame"
                  size={13}
                  color={selectedMode === 'flavor' ? '#FFFFFF' : colors.primary}
                />
                <Text
                  style={[
                    styles.promptChipText,
                    selectedMode === 'flavor' && styles.promptChipTextActive,
                  ]}
                >
                  Flavor Secret
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.promptChip,
                  selectedMode === 'default' && styles.promptChipActive,
                ]}
                onPress={() => handleSelectChip('default')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="refresh"
                  size={13}
                  color={selectedMode === 'default' ? '#FFFFFF' : colors.primary}
                />
                <Text
                  style={[
                    styles.promptChipText,
                    selectedMode === 'default' && styles.promptChipTextActive,
                  ]}
                >
                  New Advice
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Action Row */}
          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={() => {
                onClose();
                onOpenRecipe();
              }}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryActionText}>Cook This Dish</Text>
              <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={() => {
                onClose();
                onTriggerRoll();
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="shuffle" size={15} color={colors.primary} />
              <Text style={styles.secondaryActionText}>Spin Another</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 22, 16, 0.68)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backdropDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  popupCard: {
    width: '100%',
    maxWidth: MODAL_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 18,
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mamaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  mamaBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.snow200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speechStage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.snow200,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.06)',
  },
  speechBubble: {
    flex: 1,
    gap: 4,
  },
  speechDishLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.6,
  },
  speechText: {
    fontFamily: typography.fontFamily.serif,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
    fontStyle: 'italic',
  },
  promptSection: {
    gap: 8,
  },
  promptHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text.secondary,
    letterSpacing: 0.7,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(102, 112, 74, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  promptChipActive: {
    backgroundColor: colors.primary,
  },
  promptChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  promptChipTextActive: {
    color: '#FFFFFF',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1.3,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 18,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryActionBtn: {
    flex: 1,
    backgroundColor: colors.snow200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 14,
    borderRadius: 18,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
});

