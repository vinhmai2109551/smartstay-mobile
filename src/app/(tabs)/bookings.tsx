import { router } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { bookingsApi } from '@/api/bookings';
import { BookingCard } from '@/components/BookingCard';
import { ThemedText } from '@/components/themed-text';
import { ErrorView } from '@/components/ui/ErrorView';
import { LoadingView } from '@/components/ui/LoadingView';
import { Screen } from '@/components/ui/Screen';
import { Spacing } from '@/constants/theme';
import { useApi } from '@/hooks/useApi';

export default function BookingsScreen() {
  const fetchBookings = useCallback(() => bookingsApi.my(), []);
  const { data, loading, error, refetch } = useApi(fetchBookings);

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={refetch} />;

  return (
    <Screen scroll={false} padded={false}>
      <FlatList
        data={data?.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={loading}
        ListHeaderComponent={
          <ThemedText type="title" style={styles.title}>
            Đơn đặt phòng
          </ThemedText>
        }
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            Bạn chưa có đơn đặt phòng nào.
          </ThemedText>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <BookingCard booking={item} onPress={() => router.push(`/booking/${item.id}`)} />
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.three },
  title: { fontSize: 26, lineHeight: 32, marginBottom: Spacing.three },
  cardWrapper: { marginBottom: Spacing.three },
  empty: { textAlign: 'center', marginTop: Spacing.six },
});
