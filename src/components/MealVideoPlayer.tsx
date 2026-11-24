import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MealImageService } from '../services/mealImageService';
import { MamaPlatePlaceholder } from './common/MamaPlatePlaceholder';

interface MealVideoPlayerProps {
  videoId?: string;
  videoUrl: string;
  posterUrl?: string;
  isActive: boolean;
  creator?: {
    nickname: string;
    unique_id: string;
    avatar?: string;
  };
  style?: StyleProp<ViewStyle>;
  soundPillTop?: number;
  creatorPillBottom?: number;
}

export const MealVideoPlayer: React.FC<MealVideoPlayerProps> = ({
  videoId,
  videoUrl,
  posterUrl,
  isActive,
  creator,
  style,
  soundPillTop = 14,
  creatorPillBottom = 14,
}) => {
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);
  const isActiveRef = useRef(isActive);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // Initialize native high-performance player
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.muted = true;
    if (isActiveRef.current) {
      p.play();
    }
  });

  // Subscribe to player status changes so playback starts reliably once buffered
  useEffect(() => {
    const subscription = player.addListener('statusChange', ({ status, error }) => {
      if (status === 'readyToPlay') {
        setHasError(false);
        if (isActiveRef.current) {
          player.play();
        }
      } else if (status === 'error') {
        if (__DEV__) {
          console.log('[MealVideoPlayer] Playback error:', error?.message);
        }
        setHasError(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player]);

  // Keep play/pause in sync with card active state (conserve battery & RAM)
  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  const toggleSound = (e: any) => {
    e?.stopPropagation?.();
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setIsMuted((prev) => {
      const next = !prev;
      player.muted = next;
      return next;
    });
  };

  const openCreatorTikTok = (e: any) => {
    e?.stopPropagation?.();
    const handle = creator?.unique_id?.replace(/^@/, '').trim();
    if (!handle) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const isNumericTikTokId = videoId && /^\d{10,}$/.test(videoId);
    const targetUrl = isNumericTikTokId
      ? `https://www.tiktok.com/@${encodeURIComponent(handle)}/video/${videoId}`
      : `https://www.tiktok.com/@${encodeURIComponent(handle)}`;
    Linking.openURL(targetUrl).catch(() => {});
  };

  return (
    <View style={[styles.container, style]}>
      {/* Branded Fine Mama Plate Background (guarantees zero black-flash before stream buffers or on error) */}
      <MamaPlatePlaceholder variant="dark" iconSize={220} />
      {posterUrl && !MealImageService.isPlaceholderImage(posterUrl) ? (
        <Image
          source={{ uri: posterUrl }}
          style={styles.fill}
          resizeMode="cover"
        />
      ) : null}

      {/* Hardware-Accelerated 60 FPS Video Layer */}
      {!hasError ? (
        <VideoView
          style={styles.fill}
          player={player}
          nativeControls={false}
          contentFit="cover"
          surfaceType="textureView"
          useExoShutter={false}
          playsInline
          pointerEvents="none"
        />
      ) : null}

      {/* Floating Sound Toggle Pill (Top Right) */}
      {!hasError ? (
        <TouchableOpacity
          style={[styles.soundPill, { top: soundPillTop }]}
          onPress={toggleSound}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={14}
            color="#FFFFFF"
          />
          <Text style={styles.soundPillText}>{isMuted ? 'Sound off' : 'Sound on'}</Text>
        </TouchableOpacity>
      ) : null}

      {/* Clickable Creator Attribution Pill (Bottom Left -> Opens Creator's TikTok) */}
      {!hasError && creator?.unique_id ? (
        <TouchableOpacity
          style={[styles.creatorPill, { bottom: creatorPillBottom }]}
          onPress={openCreatorTikTok}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="link"
          accessibilityLabel={`Watch original video by @${creator.unique_id} on TikTok`}
        >
          <Ionicons name="logo-tiktok" size={11} color="#FFFFFF" />
          <Text style={styles.creatorText} numberOfLines={1}>
            @{creator.unique_id}
          </Text>
          <Ionicons name="open-outline" size={11} color="rgba(226, 232, 240, 0.85)" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  soundPill: {
    position: 'absolute',
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    zIndex: 20,
  },
  soundPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  creatorPill: {
    position: 'absolute',
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.76)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    maxWidth: 175,
    zIndex: 20,
  },
  creatorText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#E2E8F0',
    flexShrink: 1,
  },
});
