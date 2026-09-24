import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { roomImageSource } from '@/components/RoomTypeCard';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Space } from '@/constants/theme';
import { useShadows, useTheme } from '@/hooks/use-theme';
import { RoomType } from '@/types/room';
import { formatVND } from '@/utils/currency';

type FeaturedRoomCardProps = {
  roomType: RoomType;
  width: number;
  onPress?: () => void;
};

const CARD_HEIGHT = 200;

/** Image-led card for the horizontal "featured" carousel on the home screen. */
export function FeaturedRoomCard({ roomType, width, onPress }: FeaturedRoomCardProps) {
  const theme = useTheme();
  const shadows = useShadows();
  const image = roomImageSource(roomType);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${roomType.name}, từ ${formatVND(roomType.basePrice)} mỗi đêm`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, shadows.card, { width, opacity: pressed ? 0.94 : 1 }]}>
      <View style={[styles.inner, { backgroundColor: theme.backgroundSelected }]}>
        {image ? (
          <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
            <Ionicons name="bed-outline" size={36} color={theme.textSecondary} />
          </View>
        )}
        {/* Dark gradient keeps the white caption readable on any photo. */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.75)']}
          locations={[0.35, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.caption}>
          <ThemedText type="bodyBold" style={styles.onImage} numberOfLines={1}>
            {roomType.name}
          </ThemedText>
          <View style={styles.metaRow}>
            <ThemedText style={[styles.price, styles.onImage]}>{formatVND(roomType.basePrice)}</ThemedText>
            <ThemedText type="caption" style={styles.onImageMuted}>
              / đêm
            </ThemedText>
            <View style={styles.dot} />
            <Ionicons name="people" size={13} color="rgba(255,255,255,0.9)" />
            <ThemedText type="caption" style={styles.onImageMuted}>
              {roomType.capacity}
            </ThemedText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: CARD_HEIGHT,
    borderRadius: Radius.lg,
  },
  inner: {
    flex: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    padding: Space.lg,
    gap: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
  },
  price: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    marginHorizontal: Space.xs,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  onImage: { color: '#FFFFFF' },
  onImageMuted: { color: 'rgba(255,255,255,0.9)' },
});
