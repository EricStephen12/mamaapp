import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface MamaSealStampProps {
  label?: string;
  sublabel?: string;
  size?: number;
  variant?: 'frosted' | 'linen';
  style?: StyleProp<ViewStyle>;
}

/**
 * Signature Editorial Stamp ("MAMA'S PICK")
 * Unmistakable artisan wax/ink seal in screenshots and shared recipe cards.
 */
export const MamaSealStamp: React.FC<MamaSealStampProps> = ({
  label = "MAMA'S",
  sublabel = 'PICK',
  size = 54,
  variant = 'frosted',
  style,
}) => {
  const isFrosted = variant === 'frosted';
  const strokeColor = isFrosted ? 'rgba(255, 252, 247, 0.88)' : colors.primary;
  const textColor = isFrosted ? '#FFFCF7' : colors.primary;
  const bgColor = isFrosted ? 'rgba(36, 40, 32, 0.52)' : 'rgba(248, 245, 239, 0.94)';

  return (
    <View
      style={[
        styles.sealWrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
        },
        style,
      ]}
      pointerEvents="none"
    >
      <Svg width={size} height={size} viewBox="0 0 60 60" style={styles.svgFill}>
        {/* Outer fine artisan ring */}
        <Circle
          cx="30"
          cy="30"
          r="27"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.2"
          strokeDasharray="3 2.5"
        />
        {/* Inner crisp seal border */}
        <Circle
          cx="30"
          cy="30"
          r="23"
          fill="none"
          stroke={strokeColor}
          strokeWidth="0.9"
          strokeOpacity="0.85"
        />
        {/* Tiny four-point culinary star at top */}
        <Path
          d="M30 9 L31.2 12.2 L34.4 13.4 L31.2 14.6 L30 17.8 L28.8 14.6 L25.6 13.4 L28.8 12.2 Z"
          fill={strokeColor}
        />
      </Svg>

      <View style={styles.labelCenter}>
        <Text style={[styles.sealTopText, { color: textColor }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.sealBottomText, { color: textColor }]} numberOfLines={1}>
          {sublabel}
        </Text>
      </View>
    </View>
  );
};

interface KitchenTicketDividerProps {
  label?: string;
}

/**
 * Editorial Kitchen Ticket Divider with subtle side notches & dashed culinary rule.
 * Makes meal detail screenshots immediately recognizable as Mama Kitchen.
 */
export const KitchenTicketDivider: React.FC<KitchenTicketDividerProps> = ({
  label = 'MAMA DISH TICKET',
}) => {
  return (
    <View style={styles.ticketRow} pointerEvents="none">
      <View style={styles.notchLeft} />
      <View style={styles.dashedLine} />
      <View style={styles.ticketBadge}>
        <Text style={styles.ticketText}>{label}</Text>
      </View>
      <View style={styles.dashedLine} />
      <View style={styles.notchRight} />
    </View>
  );
};

const styles = StyleSheet.create({
  sealWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  svgFill: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  labelCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 7,
  },
  sealTopText: {
    fontFamily: typography.fontFamily.serif,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  sealBottomText: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginTop: 0.5,
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    marginHorizontal: -4,
  },
  notchLeft: {
    width: 8,
    height: 14,
    borderTopRightRadius: 7,
    borderBottomRightRadius: 7,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: colors.border,
  },
  notchRight: {
    width: 8,
    height: 14,
    borderTopLeftRadius: 7,
    borderBottomLeftRadius: 7,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: colors.border,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(102, 112, 74, 0.32)',
    marginHorizontal: 6,
  },
  ticketBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(233, 235, 221, 0.65)',
  },
  ticketText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.primary,
  },
});

