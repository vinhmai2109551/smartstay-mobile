import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { bookingsApi } from '@/api/bookings';
import { BookingCard } from '@/components/BookingCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorView } from '@/components/ui/ErrorView';
import { Skeleton } from '@/components/ui/Skeleton';
import { MaxContentWidth, Radius, Space } from '@/constants/theme';
import { useApi } from '@/hooks/useApi';
import { useTheme } from '@/hooks/use-theme';
import { BookingStatus } from '@/types/booking';

const GUTTER = Space.lg;

type FilterKey = 'ALL' | 'UPCOMING' | 'STAYING' | 'DONE' | 'CANCELLED';

const FILTERS: { key: FilterKey; label: string; statuses?: BookingStatus[] }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'UPCOMING', label: 'Sắp tới', statuses: ['PENDING', 'CONFIRMED'] },
  { key: 'STAYING', label: 'Đang lưu trú', statuses: ['CHECKED_IN'] },
  { key: 'DONE', label: 'Đã trả phòng', statuses: ['CHECKED_OUT'] },
  { key: 'CANCELLED', label: 'Đã huỷ', statuses: ['CANCELLED'] },
];

export default function BookingsScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, MaxContentWidth);
  const fetchBookings = useCallback(() => bookingsApi.my(), []);
  const { data, loading, error, refetch, refreshing, refresh } = useApi(fetchBookings, { refetchOnFocus: true });
  const [filter, setFilter] = useState<FilterKey>('ALL');

  const bookings = useMemo(() => {
    const all = data?.data ?? [];
    const statuses = FILTERS.find((f) => f.key === filter)?.statuses;
    return statuses ? all.filter((b) => statuses.includes(b.status)) : all;
  }, [data, filter]);

  if (error && !data) return <ErrorView message={error} onRetry={refetch} />;

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <FlatList
          data={loading ? [] : bookings}
          keyExtractor={(item) => item.bookingId}
          contentContainerStyle={[styles.list, { width: contentWidth }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} colors={[theme.primary]} />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.titles}>
                <ThemedText type="title">Đơn đặt phòng</ThemedText>
                <ThemedText type="body" themeColor="textSecondary">
                  Theo dõi các kỳ nghỉ của bạn.
                </ThemedText>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filters}
                style={styles.filterScroll}>
                {FILTERS.map((f) => (
                  <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
                ))}
              </ScrollView>
              {loading ? (
                <View style={styles.skeletons}>
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} height={150} radius={Radius.lg} />
                  ))}
                </View>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            loading ? null : filter === 'ALL' ? (
              <EmptyState
                icon="receipt-outline"
                title="Chưa có đơn nào"
                description="Đặt phòng đầu tiên và kỳ nghỉ của bạn sẽ hiện ở đây."
                actionLabel="Tìm phòng ngay"
                onAction={() => router.navigate('/(tabs)/search')}
              />
            ) : (
              <EmptyState icon="file-tray-outline" title="Không có đơn nào" description="Thử chọn bộ lọc khác nhé." />
            )
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <BookingCard booking={item} onPress={() => router.push(`/booking/${item.bookingId}`)} />
            </View>
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { alignSelf: 'center', paddingBottom: Space['3xl'] },
  header: { paddingTop: Space.sm, gap: Space.lg, marginBottom: Space.lg },
  titles: { gap: Space.xs, paddingHorizontal: GUTTER },
  filterScroll: { flexGrow: 0 },
  filters: { gap: Space.sm, paddingHorizontal: GUTTER, paddingVertical: Space.xs },
  skeletons: { gap: Space.lg, paddingHorizontal: GUTTER },
  cardWrapper: { paddingHorizontal: GUTTER, marginBottom: Space.lg },
});
