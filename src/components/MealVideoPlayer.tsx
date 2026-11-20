import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface MealVideoPlayerProps {
  videoUrl: string;
  posterUrl?: string;
  isActive: boolean;
  creator?: {
    nickname: string;
    unique_id: string;
    avatar?: string;
  };
  style?: StyleProp<ViewStyle>;
  onPressCard?: () => void;
}

export const MealVideoPlayer: React.FC<MealVideoPlayerProps> = ({
  videoUrl,
  posterUrl,
  isActive,
  creator,
  style,
}) => {
  const [isMuted, setIsMuted] = useState(true);

  // Initialize native high-performance player
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.muted = true;
    if (isActive) {
      p.play();
    }
  });

  // Keep play/pause in sync with card active state (conserve battery & RAM)
  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  const toggleSound = (e: any) => {
    e.stopPropagation?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsMuted((prev) => {
      const next = !prev;
      player.muted = next;
      return next;
    });
  };

  return (
    <View style={[styles.container, style]}>
      {/* Background Poster (guarantees zero black-flash before stream buffers) */}
      {posterUrl ? (
        <Image
          source={{ uri: posterUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : null}

      {/* Hardware-Accelerated 60 FPS Video Layer */}
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        nativeControls={false}
        contentFit="cover"
      />

      {/* Floating Sound Toggle Pill (Top Right) */}
      <TouchableOpacity
        style={styles.soundPill}
        onPress={toggleSound}
        activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={isMuted ? 'volume-mute' : 'volume-high'}
          size={14}
          color="#FFFFFF"
        />
        <Text style={styles.soundPillText}>{isMuted ? 'Mute' : 'Live'}</Text>
      </TouchableOpacity>

      {/* Creator Attribution Pill (Bottom Left) */}
      {creator?.unique_id ? (
        <View style={styles.creatorPill}>
          <Ionicons name="logo-tiktok" size={11} color="#FFFFFF" />
          <Text style={styles.creatorText} numberOfLines={1}>
            @{creator.unique_id}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  soundPill: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    zIndex: 10,
  },
  soundPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  creatorPill: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    maxWidth: 160,
    zIndex: 10,
  },
  creatorText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#E2E8F0',
  },
});
