import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { roomTypesApi } from '@/api/roomTypes';
import { reviewsApi } from '@/api/reviews';
import { RatingStars } from '@/components/RatingStars';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { ErrorView } from '@/components/ui/ErrorView';
import { LoadingView } from '@/components/ui/LoadingView';
import { Screen } from '@/components/ui/Screen';
import { DemoRoomImageByName } from '@/constants/demoImages';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useApi } from '@/hooks/useApi';
import { formatVND } from '@/utils/currency';
import { toIsoDate } from '@/utils/date';

export default function RoomTypeDetailScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id: string; checkIn?: string; checkOut?: string; guests?: string }>();
  const fetchRoomType = useCallback(() => roomTypesApi.detail(params.id), [params.id]);
  const { data: roomType, loading, error, refetch } = useApi(fetchRoomType);

  const fetchReviews = useCallback(() => reviewsApi.byRoomType(params.id), [params.id]);
  const reviews = useApi(fetchReviews);

  if (loading) return <LoadingView />;
  if (error || !roomType) return <ErrorView message={error ?? 'Không tìm thấy loại phòng.'} onRetry={refetch} />;

  const checkIn = params.checkIn ?? toIsoDate(dayjs().add(1, 'day').toDate());
  const checkOut = params.checkOut ?? toIsoDate(dayjs().add(2, 'day').toDate());
  const guests = params.guests ?? '2';

  const fallbackImage = DemoRoomImageByName[roomType.name];
  const galleryImages: (string | number)[] = roomType.images?.length
    ? roomType.images
    : fallbackImage
      ? [fallbackImage]
      : [];

  return (
    <Screen contentContainerStyle={styles.content}>
      {galleryImages.length ? (
        <FlatList
          data={galleryImages}
          keyExtractor={(item) => String(item)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.gallery}
          renderItem={({ item }) => (
            <Image
              source={typeof item === 'string' ? { uri: item } : item}
              style={styles.galleryImage}
              contentFit="cover"
            />
          )}
        />
      ) : null}

      <View style={styles.headerRow}>
        <ThemedText type="title" style={styles.name}>
          {roomType.name}
        </ThemedText>
        {roomType.avgRating ? <RatingStars rating={roomType.avgRating} /> : null}
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="people-outline" size={16} color={theme.textSecondary} />
        <ThemedText themeColor="textSecondary">Tối đa {roomType.capacity} khách</ThemedText>
      </View>

      <ThemedText type="smallBold" themeColor="primary" style={styles.price}>
        {formatVND(roomType.basePrice)} <ThemedText themeColor="textSecondary">/ đêm</ThemedText>
      </ThemedText>

      <ThemedText>{roomType.description}</ThemedText>

      {roomType.amenities?.length ? (
        <View>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Tiện ích
          </ThemedText>
          <View style={styles.amenityWrap}>
            {roomType.amenities.map((amenity, index) => {
              const label = typeof amenity === 'string' ? amenity : amenity.name;
              return (
                <View key={index} style={[styles.amenityChip, { borderColor: theme.border }]}>
                  <ThemedText type="small">{label}</ThemedText>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      <View>
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Đánh giá từ khách hàng
        </ThemedText>
        {reviews.data && reviews.data.data.length > 0 ? (
          reviews.data.data.map((review) => (
            <ThemedView key={review.id} type="backgroundElement" style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <ThemedText type="smallBold">{review.userFullName ?? 'Khách hàng'}</ThemedText>
                <RatingStars rating={review.rating} size={12} />
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {review.comment}
              </ThemedText>
            </ThemedView>
          ))
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            Chưa có đánh giá nào.
          </ThemedText>
        )}
      </View>

      <Button
        label="Đặt phòng này"
        onPress={() =>
          router.push({
            pathname: '/booking/new',
            params: { roomTypeId: roomType.id, checkIn, checkOut, guests },
          })
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing.six, gap: Spacing.two },
  gallery: { marginHorizontal: -Spacing.three, marginBottom: Spacing.two },
  galleryImage: { width: 360, height: 220 },
  headerRow: { gap: Spacing.one },
  name: { fontSize: 24, lineHeight: 30 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  price: { fontSize: 18, marginBottom: Spacing.one },
  sectionTitle: { marginTop: Spacing.three, marginBottom: Spacing.two, fontSize: 16 },
  amenityWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  amenityChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: 4 },
  reviewCard: { borderRadius: Spacing.two, padding: Spacing.two, marginBottom: Spacing.two, gap: 4 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
