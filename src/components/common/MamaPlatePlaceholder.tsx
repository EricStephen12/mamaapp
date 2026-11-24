import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

interface MamaPlatePlaceholderProps {
  variant?: 'linen' | 'dark';
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Minimal single-stroke line-art SVG plate placeholder matching Mama Kitchen's olive aesthetic.
 * Zero gradients, zero clutter, 0ms instant render.
 */
export const MamaPlatePlaceholder: React.FC<MamaPlatePlaceholderProps> = ({
  variant = 'linen',
  iconSize = 96,
  style,
}) => {
  const isDark = variant === 'dark';
  const strokeColor = isDark ? 'rgba(248, 245, 239, 0.42)' : '#66704A';
  const bgColor = isDark ? '#262A22' : '#F3EFE6';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: bgColor },
        style,
      ]}
      pointerEvents="none"
    >
      <Svg width={iconSize} height={iconSize} viewBox="0 0 120 120" fill="none">
        {/* Outer plate rim */}
        <Circle
          cx="60"
          cy="60"
          r="38"
          stroke={strokeColor}
          strokeWidth={2.4}
          fill="none"
        />
        {/* Inner plate well */}
        <Circle
          cx="60"
          cy="60"
          r="25"
          stroke={strokeColor}
          strokeWidth={1.8}
          strokeOpacity={isDark ? 0.6 : 0.55}
          fill="none"
        />
        {/* Minimal fork (left) */}
        <Path
          d="M12 36V50C12 54 18 54 18 50V36M15 36V84"
          stroke={strokeColor}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Minimal knife (right) */}
        <Path
          d="M105 36C101 42 101 52 105 56V84"
          stroke={strokeColor}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MamaPlatePlaceholder;
