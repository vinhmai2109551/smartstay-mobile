import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { reviewsApi } from '@/api/reviews';
import { roomTypesApi } from '@/api/roomTypes';
import { Avatar } from '@/components/Avatar';
import { RatingStars } from '@/components/RatingStars';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomBar } from '@/components/ui/BottomBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorView } from '@/components/ui/ErrorView';
import { Skeleton } from '@/components/ui/Skeleton';
import { amenityIcon } from '@/constants/amenityIcons';
import { DemoRoomImageByName } from '@/constants/demoImages';
import { FontFamily, MaxContentWidth, Radius, Space } from '@/constants/theme';
import { useApi } from '@/hooks/useApi';
import { useTheme } from '@/hooks/use-theme';
import { formatVND } from '@/utils/currency';
import { formatDate, nightsBetween, toIsoDate } from '@/utils/date';

const GUTTER = Space.lg;

export default function RoomTypeDetailScreen() {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const params = useLocalSearchParams<{ id: string; checkIn?: string; checkOut?: string; guests?: string }>();
  const fetchRoomType = useCallback(() => roomTypesApi.detail(params.id), [params.id]);
  const { data: roomType, loading, error, refetch } = useApi(fetchRoomType);

  const fetchReviews = useCallback(() => reviewsApi.byRoomType(params.id), [params.id]);
  const reviews = useApi(fetchReviews);

  const [page, setPage] = useState(0);
  const galleryWidth = Math.min(windowWidth, MaxContentWidth);
  const galleryHeight = Math.round(Math.min(galleryWidth * 0.72, 380));

  if (loading) {
    return (
      <ThemedView style={styles.flex}>
        <Skeleton height={galleryHeight} radius={0} />
        <View style={styles.skeletonBody}>
          <Skeleton width="70%" height={28} />
          <Skeleton width="40%" height={16} />
          <Skeleton height={80} radius={Radius.md} />
          <Skeleton height={120} radius={Radius.md} />
        </View>
      </ThemedView>
    );
  }
  if (error || !roomType) return <ErrorView message={error ?? 'Không tìm thấy loại phòng.'} onRetry={refetch} />;

  const checkIn = params.checkIn ?? toIsoDate(dayjs().add(1, 'day').toDate());
  const checkOut = params.checkOut ?? toIsoDate(dayjs().add(2, 'day').toDate());
  const guests = params.guests ?? '2';
  const nights = nightsBetween(checkIn, checkOut);

  const fallbackImage = DemoRoomImageByName[roomType.name];
  const galleryImages: (string | number)[] = roomType.images?.length
    ? roomType.images
    : fallbackImage
      ? [fallbackImage]
      : [];

  const reviewList = reviews.data?.data ?? [];
  const averageRating = reviewList.length
    ? reviewList.reduce((sum, review) => sum + review.rating, 0) / reviewList.length
    : undefined;

  return (
    <ThemedView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.galleryWrap, { width: galleryWidth, height: galleryHeight }]}>
          {galleryImages.length ? (
            <FlatList
              data={galleryImages}
              keyExtractor={(item, index) => `${index}-${String(item)}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / galleryWidth))}
              renderItem={({ item }) => (
                <Image
                  source={typeof item === 'string' ? { uri: item } : item}
                  style={{ width: galleryWidth, height: galleryHeight }}
                  contentFit="cover"
                  transition={200}
                  accessibilityLabel={`Ảnh ${roomType.name}`}
                />
              )}
            />
          ) : (
            <View style={[styles.galleryPlaceholder, { backgroundColor: theme.backgroundSelected }]}>
              <Ionicons name="image-outline" size={40} color={theme.textSecondary} />
            </View>
          )}
          {galleryImages.length > 1 ? (
            <View style={styles.dots} pointerEvents="none">
              {galleryImages.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, index === page ? styles.dotActive : null, { backgroundColor: '#FFFFFF' }]}
                />
              ))}
            </View>
          ) : null}
        </View>

        <View style={[styles.sheet, { backgroundColor: theme.background, width: galleryWidth }]}>
          <View style={styles.titleBlock}>
            <ThemedText type="title">{roomType.name}</ThemedText>
            <View style={styles.metaRow}>
              <View style={styles.meta}>
                <Ionicons name="people-outline" size={16} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary">
                  Tối đa {roomType.capacity} khách
                </ThemedText>
              </View>
              {averageRating !== undefined ? (
                <View style={styles.meta}>
                  <Ionicons name="star" size={15} color={theme.accent} />
                  <ThemedText type="smallBold">{averageRating.toFixed(1)}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    ({reviewList.length} đánh giá)
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </View>

          <Card style={styles.stayCard}>
            <View style={styles.stayItem}>
              <ThemedText type="caption" themeColor="textSecondary">
                Nhận phòng
              </ThemedText>
              <ThemedText type="bodyBold">{formatDate(checkIn)}</ThemedText>
            </View>
            <View style={[styles.stayDivider, { backgroundColor: theme.border }]} />
            <View style={styles.stayItem}>
              <ThemedText type="caption" themeColor="textSecondary">
                Trả phòng
              </ThemedText>
              <ThemedText type="bodyBold">{formatDate(checkOut)}</ThemedText>
            </View>
            <View style={[styles.stayDivider, { backgroundColor: theme.border }]} />
            <View style={styles.stayItem}>
              <ThemedText type="caption" themeColor="textSecondary">
                Khách
              </ThemedText>
              <ThemedText type="bodyBold">{guests}</ThemedText>
            </View>
          </Card>

          {roomType.description ? (
            <View style={styles.section}>
              <ThemedText type="heading">Giới thiệu</ThemedText>
              <ThemedText type="body" themeColor="textSecondary">
                {roomType.description}
              </ThemedText>
            </View>
          ) : null}

          {roomType.amenities?.length ? (
            <View style={styles.section}>
              <ThemedText type="heading">Tiện ích</ThemedText>
              <View style={styles.amenityGrid}>
                {roomType.amenities.map((amenity, index) => (
                  <View key={index} style={styles.amenity}>
                    <View style={[styles.amenityIcon, { backgroundColor: theme.primarySoft }]}>
                      <Ionicons name={amenityIcon(amenity)} size={18} color={theme.primary} />
                    </View>
                    <ThemedText type="small" style={styles.amenityText}>
                      {amenity}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <View style={styles.reviewTitleRow}>
              <ThemedText type="heading">Đánh giá từ khách hàng</ThemedText>
              {averageRating !== undefined ? <RatingStars rating={averageRating} size={14} /> : null}
            </View>
            {reviews.loading ? (
              <Skeleton height={90} radius={Radius.md} />
            ) : reviewList.length > 0 ? (
              reviewList.map((review) => (
                <Card key={review.id} style={styles.reviewCard} elevation="none">
                  <View style={styles.reviewHeader}>
                    <Avatar name={review.userFullName} size={36} tone="soft" />
                    <View style={styles.reviewAuthor}>
                      <ThemedText type="smallBold">{review.userFullName ?? 'Khách hàng'}</ThemedText>
                      {review.createdAt ? (
                        <ThemedText type="caption" themeColor="textSecondary">
                          {formatDate(review.createdAt)}
                        </ThemedText>
                      ) : null}
                    </View>
                    <RatingStars rating={review.rating} size={12} />
                  </View>
                  {review.comment ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      {review.comment}
                    </ThemedText>
                  ) : null}
                </Card>
              ))
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                Chưa có đánh giá nào — hãy là người đầu tiên trải nghiệm.
              </ThemedText>
            )}
          </View>
        </View>
      </ScrollView>

      <BottomBar>
        <View style={styles.priceBlock}>
          <View style={styles.priceRow}>
            <ThemedText style={[styles.price, { color: theme.primary }]}>{formatVND(roomType.basePrice)}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              / đêm
            </ThemedText>
          </View>
          <ThemedText type="caption" themeColor="textSecondary">
            {nights} đêm · {formatVND(roomType.basePrice * nights)}
          </ThemedText>
        </View>
        <Button
          label="Đặt phòng"
          fullWidth={false}
          onPress={() =>
            router.push({
              pathname: '/booking/new',
              params: { roomTypeId: roomType.roomTypeId, checkIn, checkOut, guests },
            })
          }
        />
      </BottomBar>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { alignItems: 'center', paddingBottom: Space['2xl'] },
  skeletonBody: { padding: GUTTER, gap: Space.lg },
  galleryWrap: { overflow: 'hidden' },
  galleryPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dots: {
    position: 'absolute',
    bottom: Space['2xl'] + Space.sm,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, opacity: 0.55 },
  dotActive: { width: 18, opacity: 1 },
  sheet: {
    marginTop: -Space['2xl'],
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: GUTTER,
    paddingTop: Space['2xl'],
    gap: Space['2xl'],
  },
  titleBlock: { gap: Space.sm },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.lg },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Space.xs },
  stayCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: Space.md },
  stayItem: { flex: 1, alignItems: 'center', gap: 2 },
  stayDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
  section: { gap: Space.md },
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: Space.md },
  amenity: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: Space.sm, paddingRight: Space.sm },
  amenityIcon: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  amenityText: { flex: 1 },
  reviewTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.sm },
  reviewCard: { gap: Space.sm },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  reviewAuthor: { flex: 1 },
  priceBlock: { flex: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: Space.xs },
  price: { fontFamily: FontFamily.bold, fontSize: 20, lineHeight: 26 },
});
