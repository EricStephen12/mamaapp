import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { RegionalMamaAvatar } from '../signature/RegionalMamaAvatar';
import { preferencesStore } from '../../services/preferencesStore';
import { useModalBottomInset } from '../../hooks/useBottomNavInset';

const MAMA_OVERFED = require('../../../assets/family/mama-overfed.jpg');
const AUNTIE_PULLING = require('../../../assets/family/auntie-pulling.jpg');

export interface MamaMomentAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

export interface MamaMomentModalProps {
  visible: boolean;
  eyebrow?: string;
  title: string;
  message: string;
  mood?: 'mama' | 'overfed' | 'auntie';
  actions: MamaMomentAction[];
  onClose: () => void;
  /** Render inline as an absolute overlay inside an already-open Modal (prevents iOS nested modal conflicts) */
  inline?: boolean;
}

/**
 * Custom warm Mama Kitchen modal that replaces cold system Alert.alert dialogs.
 */
export const MamaMomentModal: React.FC<MamaMomentModalProps> = ({
  visible,
  eyebrow = 'MAMA SAYS',
  title,
  message,
  mood = 'mama',
  actions,
  onClose,
  inline = false,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;
  const pass = preferencesStore.getKitchenPass();
  const modalBottomInset = useModalBottomInset(22);

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      scale.setValue(0.88);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 110,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, opacity, scale]);

  if (!visible) return null;

  const overlayBody = (
    <Animated.View
      style={[
        styles.backdrop,
        { paddingBottom: modalBottomInset },
        inline && styles.inlineBackdrop,
        { opacity },
      ]}
    >
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        {/* Illustrated Character Badge */}
        <View style={styles.avatarStage}>
          {mood === 'overfed' ? (
            <Image source={MAMA_OVERFED} style={styles.customCharImg} resizeMode="cover" />
          ) : mood === 'auntie' ? (
            <Image source={AUNTIE_PULLING} style={styles.customCharImg} resizeMode="cover" />
          ) : (
            <RegionalMamaAvatar
              countryCode={pass.country}
              cuisineAnchor={pass.cuisineAnchor}
              size={76}
            />
          )}
        </View>

        <View style={styles.eyebrowPill}>
          <Text style={styles.eyebrowText}>{eyebrow}</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}

        <View style={styles.actionsWrap}>
          {actions.map((action, idx) => {
            const variant = action.variant || (idx === 0 ? 'primary' : 'secondary');
            return (
              <TouchableOpacity
                key={`${action.label}-${idx}`}
                style={[
                  styles.actionBtn,
                  variant === 'primary' && styles.actionBtnPrimary,
                  variant === 'secondary' && styles.actionBtnSecondary,
                  variant === 'destructive' && styles.actionBtnDestructive,
                  variant === 'ghost' && styles.actionBtnGhost,
                ]}
                activeOpacity={0.85}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  action.onPress();
                }}
              >
                {action.icon ? (
                  <Ionicons
                    name={action.icon}
                    size={16}
                    color={
                      variant === 'primary'
                        ? '#FFFFFF'
                        : variant === 'destructive'
                          ? '#B9382C'
                          : colors.primary
                    }
                  />
                ) : null}
                <Text
                  style={[
                    styles.actionText,
                    variant === 'primary' && styles.actionTextPrimary,
                    variant === 'secondary' && styles.actionTextSecondary,
                    variant === 'destructive' && styles.actionTextDestructive,
                    variant === 'ghost' && styles.actionTextGhost,
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </Animated.View>
  );

  if (inline) {
    return overlayBody;
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {overlayBody}
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 24, 16, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  inlineBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.background,
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(102, 112, 74, 0.24)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  avatarStage: {
    marginBottom: 12,
  },
  customCharImg: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2.5,
    borderColor: '#D4A548',
    backgroundColor: '#F8F5EF',
  },
  eyebrowPill: {
    backgroundColor: 'rgba(102, 112, 74, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  eyebrowText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: colors.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  message: {
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  actionsWrap: {
    width: '100%',
    gap: 9,
  },
  actionBtn: {
    width: '100%',
    paddingVertical: 13.5,
    paddingHorizontal: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary,
  },
  actionBtnSecondary: {
    backgroundColor: 'rgba(102, 112, 74, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(102, 112, 74, 0.25)',
  },
  actionBtnDestructive: {
    backgroundColor: 'rgba(185, 56, 44, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(185, 56, 44, 0.25)',
  },
  actionBtnGhost: {
    paddingVertical: 9,
    backgroundColor: 'transparent',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionTextPrimary: {
    color: '#FFFFFF',
  },
  actionTextSecondary: {
    color: colors.primary,
  },
  actionTextDestructive: {
    color: '#B9382C',
  },
  actionTextGhost: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.secondary,
  },
});

