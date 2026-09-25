import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { DemoRoomImageByName } from '@/constants/demoImages';
import { FontFamily, Radius, Space } from '@/constants/theme';
import { useShadows, useTheme } from '@/hooks/use-theme';
import { AvailableRoomType, RoomType } from '@/types/room';
import { formatVND } from '@/utils/currency';

type RoomTypeCardProps = {
  roomType: RoomType | AvailableRoomType;
  onPress?: () => void;
  imageHeight?: number;
};

export function roomImageSource(roomType: RoomType) {
  if (roomType.images?.[0]) return { uri: roomType.images[0] };
  return DemoRoomImageByName[roomType.name];
}

export function RoomTypeCard({ roomType, onPress, imageHeight = 200 }: RoomTypeCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const shadows = useShadows();
  const availableCount = (roomType as AvailableRoomType).availableCount;
  const image = roomImageSource(roomType);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('room.cardAccessibility', {
        name: roomType.name,
        capacity: roomType.capacity,
        price: formatVND(roomType.basePrice),
      })}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        shadows.card,
        { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.94 : 1 },
      ]}>
      <View style={[styles.imageWrap, { height: imageHeight }]}>
        {image ? (
          <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.placeholder, { backgroundColor: theme.backgroundSelected }]}>
            <Ionicons name="bed-outline" size={36} color={theme.textSecondary} />
          </View>
        )}

        {typeof availableCount === 'number' ? (
          <View style={[styles.badge, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons
              name={availableCount > 0 ? 'checkmark-circle' : 'close-circle'}
              size={14}
              color={availableCount > 0 ? theme.success : theme.danger}
            />
            <ThemedText type="caption">
              {availableCount > 0 ? t('room.availableCount', { count: availableCount }) : t('room.soldOut')}
            </ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <ThemedText type="bodyBold" numberOfLines={1}>
          {roomType.name}
        </ThemedText>
        <View style={styles.row}>
          <Ionicons name="people-outline" size={16} color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary">
            {t('room.maxGuests', { count: roomType.capacity })}
          </ThemedText>
        </View>
        <View style={styles.priceRow}>
          <ThemedText style={[styles.price, { color: theme.primary }]}>{formatVND(roomType.basePrice)}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t('room.perNight')}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
  },
  imageWrap: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    overflow: 'hidden',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: Space.md,
    left: Space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    paddingHorizontal: Space.sm + 2,
    paddingVertical: Space.xs,
    borderRadius: Radius.full,
  },
  body: {
    padding: Space.lg,
    gap: Space.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Space.xs,
    marginTop: Space.xs,
  },
  price: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    lineHeight: 24,
  },
});
