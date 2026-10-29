import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import Svg, { Path, Line, Circle, Rect } from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

interface NearbyRestaurantCardProps {
  restaurantName?: string;
  distanceInfo?: string;
}

export const NearbyRestaurantCard: React.FC<NearbyRestaurantCardProps> = ({
  restaurantName = 'Olive & Grain',
  distanceInfo = 'Sample café · 8-minute walk',
}) => {
  return (
    <View style={styles.container}>
      {/* Restaurant Header */}
      <View style={styles.headerRow}>
        <Text style={styles.heading}>{restaurantName}</Text>
        <Feather name="map-pin" size={18} color={colors.primary} />
      </View>

      {/* Distance & Info */}
      <Text style={styles.distanceText}>{distanceInfo}</Text>

      {/* Illustrative Neighbourhood Map */}
      <View style={styles.mapContainer}>
        {/* SVG Street Grid & Walking Route */}
        <Svg width="100%" height="128" viewBox="0 0 340 128" style={StyleSheet.absoluteFill}>
          {/* Base Background */}
          <Rect x="0" y="0" width="340" height="128" fill={colors.linen200} />

          {/* Grid / Streets */}
          {/* Horizontal avenues */}
          <Line x1="0" y1="35" x2="340" y2="35" stroke="#f8f5ef" strokeWidth="12" />
          <Line x1="0" y1="94" x2="340" y2="94" stroke="#f8f5ef" strokeWidth="14" />

          {/* Vertical streets */}
          <Line x1="74" y1="0" x2="74" y2="128" stroke="#f8f5ef" strokeWidth="12" />
          <Line x1="160" y1="0" x2="160" y2="128" stroke="#f8f5ef" strokeWidth="10" />
          <Line x1="234" y1="0" x2="234" y2="128" stroke="#f8f5ef" strokeWidth="14" />
          <Line x1="295" y1="0" x2="295" y2="128" stroke="#f8f5ef" strokeWidth="8" />

          {/* Diagonal lane */}
          <Line x1="74" y1="94" x2="160" y2="35" stroke="#f8f5ef" strokeWidth="10" />

          {/* Walking Route Trail */}
          <Path
            d="M 74 94 L 160 35 L 222 35"
            stroke={colors.primary}
            strokeWidth="3.5"
            strokeDasharray="5,4"
            fill="none"
            strokeLinecap="round"
          />

          {/* Start Origin Point Marker */}
          <Circle
            cx="74"
            cy="94"
            r="6"
            fill={colors.text.primary}
            stroke="#f8f5ef"
            strokeWidth="3"
          />
        </Svg>

        {/* Destination Pin Icon Badge */}
        <View style={styles.destinationBadge}>
          <Ionicons name="restaurant" size={16} color={colors.white} />
        </View>

        {/* Illustrative Map Label */}
        <View style={styles.mapDisclaimerTag}>
          <Text style={styles.disclaimerTagText}>ILLUSTRATIVE MAP</Text>
        </View>
      </View>

      {/* Reassurance Disclaimer */}
      <Text style={styles.footerDisclaimer}>
        Sample neighbourhood option · price and distance are estimates.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  heading: {
    fontSize: 30,
    lineHeight: 32,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '500',
    color: colors.text.primary,
  },
  distanceText: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 17,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
  mapContainer: {
    height: 128,
    borderRadius: 16,
    backgroundColor: colors.linen200,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  destinationBadge: {
    position: 'absolute',
    top: 18,
    left: 215,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  mapDisclaimerTag: {
    position: 'absolute',
    right: 10,
    bottom: 8,
    backgroundColor: 'rgba(255, 252, 247, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  disclaimerTagText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
  footerDisclaimer: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 17,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
});

export default NearbyRestaurantCard;
