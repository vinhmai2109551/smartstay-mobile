import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { RatingStars } from '@/components/RatingStars';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DemoRoomImageByName } from '@/constants/demoImages';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AvailableRoomType, RoomType } from '@/types/room';
import { formatVND } from '@/utils/currency';

type RoomTypeCardProps = {
  roomType: RoomType | AvailableRoomType;
  onPress?: () => void;
};

export function RoomTypeCard({ roomType, onPress }: RoomTypeCardProps) {
  const theme = useTheme();
  const availableCount = (roomType as AvailableRoomType).availableCount;
  const fallbackImage = DemoRoomImageByName[roomType.name];

  return (
    <Pressable onPress={onPress}>
      <ThemedView type="backgroundElement" style={styles.card}>
        {roomType.images?.[0] ? (
          <Image source={{ uri: roomType.images[0] }} style={styles.image} contentFit="cover" />
        ) : fallbackImage ? (
          <Image source={fallbackImage} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder, { backgroundColor: theme.backgroundSelected }]}>
            <Ionicons name="bed-outline" size={32} color={theme.textSecondary} />
          </View>
        )}

        <View style={styles.body}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {roomType.name}
          </ThemedText>
          <View style={styles.row}>
            <Ionicons name="people-outline" size={14} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              {roomType.capacity} khách
            </ThemedText>
            {typeof availableCount === 'number' ? (
              <ThemedText type="small" themeColor="textSecondary">
                · Còn {availableCount} phòng
              </ThemedText>
            ) : null}
          </View>
          {roomType.avgRating ? <RatingStars rating={roomType.avgRating} /> : null}
          <ThemedText type="smallBold" themeColor="primary">
            {formatVND(roomType.basePrice)}
            <ThemedText type="small" themeColor="textSecondary">
              {' '}
              / đêm
            </ThemedText>
          </ThemedText>
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 160,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
