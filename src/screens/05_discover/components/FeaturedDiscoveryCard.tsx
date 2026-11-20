import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { MealVideoPlayer } from '../../../components/MealVideoPlayer';
import { VideoService, MealVideoData } from '../../../services/videoService';

export interface DiscoveryItem {
  id: string;
  positionLabel: string;
  category: string;
  cost: string;
  title: string;
  nutrition: string;
  reason: string;
  imageUrl?: string;
}

interface FeaturedDiscoveryCardProps {
  item: DiscoveryItem;
  onOpenDetails?: () => void;
  swipeAnim?: Animated.ValueXY;
  cardOpacity?: Animated.Value;
}

export const FeaturedDiscoveryCard: React.FC<FeaturedDiscoveryCardProps> = ({
  item,
  onOpenDetails,
  swipeAnim,
  cardOpacity,
}) => {
  const [videoEntry, setVideoEntry] = useState<{ title: string; data: MealVideoData } | null>(null);

  useEffect(() => {
    if (!item.title) return;

    if (VideoService.getCachedVideo(item.title)) {
      return;
    }

    let isCancelled = false;
    const timer = setTimeout(() => {
      VideoService.resolveCookingVideo(item.title)
        .then((data) => {
          if (!isCancelled && data) {
            setVideoEntry({ title: item.title, data });
          }
        })
        .catch(() => {});
    }, 450);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [item.title]);

  const activeVideo =
    videoEntry?.title === item.title
      ? videoEntry.data
      : VideoService.getCachedVideo(item.title);

  const animatedStyle = swipeAnim
    ? {
        transform: [
          ...swipeAnim.getTranslateTransform(),
          {
            rotate: swipeAnim.x.interpolate({
              inputRange: [-200, 0, 200],
              outputRange: ['-7deg', '0deg', '7deg'],
              extrapolate: 'clamp',
            }),
          },
        ],
        opacity: cardOpacity || 1,
      }
    : {};

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <TouchableOpacity
        activeOpacity={0.94}
        onPress={onOpenDetails}
        style={styles.touchable}
      >
        {activeVideo?.videoUrl ? (
          <MealVideoPlayer
            videoId={activeVideo.id}
            videoUrl={activeVideo.videoUrl}
            posterUrl={activeVideo.coverUrl || item.imageUrl}
            isActive={true}
            creator={activeVideo.author}
            soundPillTop={56}
            creatorPillBottom={108}
          />
        ) : item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.mealImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="restaurant-outline" size={36} color={colors.primary} />
          </View>
        )}

        {/* Top Floating Glass Pills */}
        <View style={styles.topFloatingRow}>
          <View style={styles.glassPill}>
            <Ionicons name="time-outline" size={13} color="#FFFFFF" />
            <Text style={styles.glassPillText}>{item.category}</Text>
          </View>

          <View style={styles.costPill}>
            <Text style={styles.costPillText}>{item.cost}</Text>
          </View>
        </View>

        {/* Bottom Editorial Scrim Overlay */}
        <View style={styles.bottomScrim}>
          <View style={styles.metaTopRow}>
            <Text style={styles.positionTag}>{item.positionLabel}</Text>
            {item.nutrition ? (
              <Text style={styles.nutritionTag} numberOfLines={1}>
                {item.nutrition}
              </Text>
            ) : null}
          </View>

          <Text style={styles.heading} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    height: 430,
    backgroundColor: '#1E211B',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#181512',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  touchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
  },
  mealImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#262922',
  },
  topFloatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  glassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(20, 22, 18, 0.68)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  glassPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  costPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 16,
  },
  costPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  bottomScrim: {
    paddingHorizontal: 22,
    paddingTop: 36,
    paddingBottom: 24,
    backgroundColor: 'rgba(18, 20, 16, 0.72)',
    gap: 6,
  },
  metaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  positionTag: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  nutritionTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FBBF24',
    letterSpacing: 0.3,
  },
  heading: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default FeaturedDiscoveryCard;
