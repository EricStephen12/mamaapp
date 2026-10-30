import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

interface IngredientViewfinderProps {
  isScanning?: boolean;
}

export const IngredientViewfinder: React.FC<IngredientViewfinderProps> = ({
  isScanning = false,
}) => {
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2400,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2400,
          useNativeDriver: true,
        }),
      ])
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 1200, useNativeDriver: true }),
      ])
    );
    scanLoop.start();
    pulseLoop.start();
    return () => {
      scanLoop.stop();
      pulseLoop.stop();
    };
  }, [scanLineAnim, pulseAnim]);

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 240],
  });

  return (
    <View style={styles.container}>
      {/* Dark viewfinder background — no external image */}
      <View style={styles.viewfinderBg} />

      {/* Subtle radial glow center */}
      <View style={styles.centerGlow} />

      {/* Mode Badge: INGREDIENTS */}
      <View style={styles.cameraModeBadge}>
        <Ionicons name="camera-outline" size={14} color={colors.primary} />
        <Text style={styles.modeLabel}>INGREDIENTS</Text>
      </View>

      {/* Framing Guides Overlay (Reticle Corners) */}
      <View style={styles.framingGuidesWrapper}>
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        {/* Animated Scan Line */}
        <Animated.View
          style={[
            styles.scanLine,
            {
              transform: [{ translateY }],
              opacity: pulseAnim,
            },
          ]}
        />
      </View>

      {/* Guidance Framing Prompt */}
      <View style={styles.framingPrompt}>
        <Ionicons name="scan-outline" size={12} color={colors.primary} style={{ marginRight: 6 }} />
        <Text style={styles.guidanceText}>
          Keep each ingredient in view, in good light.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 394,
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0A0E08',
  },
  viewfinderBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0D1209',
  },
  centerGlow: {
    position: 'absolute',
    top: '20%',
    left: '20%',
    right: '20%',
    bottom: '20%',
    borderRadius: 120,
    backgroundColor: 'rgba(102, 112, 74, 0.06)',
  },
  cameraModeBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(233, 235, 221, 0.12)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 2,
    borderWidth: 1,
    borderColor: 'rgba(233, 235, 221, 0.08)',
  },
  modeLabel: {
    fontSize: typography.fontSize.label,
    fontWeight: '600',
    color: 'rgba(233, 235, 221, 0.85)',
    letterSpacing: 0.5,
  },
  framingGuidesWrapper: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    height: 255,
    zIndex: 1,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: 'rgba(233, 235, 221, 0.70)',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderTopLeftRadius: 3,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderTopRightRadius: 3,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderBottomLeftRadius: 3,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomRightRadius: 3,
  },
  scanLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 1.5,
    backgroundColor: 'rgba(102, 112, 74, 0.8)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 2,
  },
  framingPrompt: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(233, 235, 221, 0.09)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderWidth: 1,
    borderColor: 'rgba(233, 235, 221, 0.06)',
  },
  guidanceText: {
    fontSize: typography.fontSize.reassurance,
    color: 'rgba(233, 235, 221, 0.7)',
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
});

export default IngredientViewfinder;
