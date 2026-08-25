import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { promotionsApi } from '@/api/promotions';
import { roomTypesApi } from '@/api/roomTypes';
import { RoomTypeCard } from '@/components/RoomTypeCard';
import { ThemedText } from '@/components/themed-text';
import { ErrorView } from '@/components/ui/ErrorView';
import { LoadingView } from '@/components/ui/LoadingView';
import { Screen } from '@/components/ui/Screen';
import { Spacing } from '@/constants/theme';
import { useApi } from '@/hooks/useApi';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';

export default function HomeScreen() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const fetchRoomTypes = useCallback(() => roomTypesApi.list(), []);
  const roomTypes = useApi(fetchRoomTypes);

  const fetchPromotions = useCallback(() => promotionsApi.listActive(), []);
  const promotions = useApi(fetchPromotions);

  const greeting = useMemo(() => (user?.fullName ? `Xin chào, ${user.fullName.split(' ').at(-1)}` : 'Xin chào'), [
    user,
  ]);

  if (roomTypes.loading) return <LoadingView />;
  if (roomTypes.error) return <ErrorView message={roomTypes.error} onRetry={roomTypes.refetch} />;

  return (
    <Screen scroll={false} padded={false}>
      <FlatList
        data={roomTypes.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              {greeting}
            </ThemedText>
            <ThemedText themeColor="textSecondary">Tìm và đặt phòng nhanh chóng cùng SmartStay</ThemedText>

            {promotions.data && promotions.data.length > 0 ? (
              <View style={[styles.promoBanner, { backgroundColor: theme.accent }]}>
                <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                  🎉 {promotions.data[0].description}
                </ThemedText>
                <ThemedText type="small" style={{ color: '#FFFFFF' }}>
                  Mã: {promotions.data[0].code}
                </ThemedText>
              </View>
            ) : null}

            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Loại phòng nổi bật
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <RoomTypeCard roomType={item} onPress={() => router.push(`/room/${item.id}`)} />
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.three, gap: Spacing.three },
  header: { gap: Spacing.two, marginBottom: Spacing.two },
  title: { fontSize: 28, lineHeight: 34 },
  sectionTitle: { fontSize: 20, lineHeight: 26, marginTop: Spacing.two },
  promoBanner: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: 2,
  },
  cardWrapper: { marginBottom: Spacing.three },
});
