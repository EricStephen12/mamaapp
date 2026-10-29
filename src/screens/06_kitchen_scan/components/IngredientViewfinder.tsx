import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

const COUNTER_IMAGE_URL =
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80';

interface IngredientViewfinderProps {
  isScanning?: boolean;
}

export const IngredientViewfinder: React.FC<IngredientViewfinderProps> = ({
  isScanning = false,
}) => {
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
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
    loop.start();
    return () => loop.stop();
  }, [scanLineAnim]);

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 240],
  });

  return (
    <View style={styles.container}>
      {/* Background Raw Ingredients on Counter Photo */}
      <Image
        source={{ uri: COUNTER_IMAGE_URL }}
        style={styles.counterImage}
        resizeMode="cover"
      />

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

        {/* Gentle Scanning Horizon */}
        <Animated.View
          style={[
            styles.scanLine,
            {
              transform: [{ translateY }],
            },
          ]}
        />
      </View>

      {/* Guidance Framing Prompt */}
      <View style={styles.framingPrompt}>
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
    backgroundColor: colors.border,
  },
  counterImage: {
    width: '100%',
    height: '100%',
  },
  cameraModeBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: colors.snow200,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 2,
  },
  modeLabel: {
    fontSize: typography.fontSize.label,
    fontWeight: '600',
    color: colors.text.primary,
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
    borderColor: 'rgba(255, 252, 247, 0.95)',
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
    backgroundColor: 'rgba(233, 235, 221, 0.7)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },
  framingPrompt: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
    backgroundColor: colors.snow200,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  guidanceText: {
    fontSize: typography.fontSize.reassurance,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
});

export default IngredientViewfinder;
