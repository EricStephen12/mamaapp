import React, { useRef, useState } from 'react';
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

interface CaptureControlsProps {
  onCapture: () => void;
  onGalleryPress?: () => void;
  onFlashToggle?: (isFlashOn: boolean) => void;
}

export const CaptureControls: React.FC<CaptureControlsProps> = ({
  onCapture,
  onGalleryPress,
  onFlashToggle,
}) => {
  const [flashOn, setFlashOn] = useState(false);
  const shutterScale = useRef(new Animated.Value(1)).current;

  const handleShutterPressIn = () => {
    Animated.spring(shutterScale, {
      toValue: 0.88,
      useNativeDriver: true,
      friction: 6,
    }).start();
  };

  const handleShutterPressOut = () => {
    Animated.spring(shutterScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
    }).start();
  };

  const toggleFlash = () => {
    const nextState = !flashOn;
    setFlashOn(nextState);
    if (onFlashToggle) {
      onFlashToggle(nextState);
    }
  };

  return (
    <View style={styles.container}>
      {/* 3 Camera Actions Row */}
      <View style={styles.actionsRow}>
        {/* Gallery Action */}
        <TouchableOpacity
          style={styles.actionItem}
          onPress={onGalleryPress}
          activeOpacity={0.7}
        >
          <Ionicons name="images-outline" size={24} color={colors.primary} />
          <Text style={styles.actionLabel}>Gallery</Text>
        </TouchableOpacity>

        {/* Shutter Button */}
        <Animated.View style={[{ transform: [{ scale: shutterScale }] }]}>
          <TouchableOpacity
            style={styles.shutterOuter}
            onPress={onCapture}
            onPressIn={handleShutterPressIn}
            onPressOut={handleShutterPressOut}
            activeOpacity={0.9}
          >
            <View style={styles.shutterInner}>
              <View style={styles.shutterCore} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Flash Toggle Action */}
        <TouchableOpacity
          style={styles.actionItem}
          onPress={toggleFlash}
          activeOpacity={0.7}
        >
          <Ionicons
            name={flashOn ? 'flash' : 'flash-off-outline'}
            size={24}
            color={flashOn ? colors.primary : colors.text.secondary}
          />
          <Text style={styles.actionLabel}>
            {flashOn ? 'Flash on' : 'Flash off'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Capture Caption */}
      <Text style={styles.captureCaption}>Take ingredient photo</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
    width: '100%',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    width: '100%',
  },
  actionItem: {
    width: 68,
    alignItems: 'center',
    gap: 6,
  },
  actionLabel: {
    fontSize: typography.fontSize.reassurance,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.snow100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  shutterCore: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
  },
  captureCaption: {
    fontSize: typography.fontSize.reassurance,
    color: colors.primary,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
});

export default CaptureControls;
