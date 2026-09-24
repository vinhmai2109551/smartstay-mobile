import dayjs from 'dayjs';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { roomsApi } from '@/api/rooms';
import { getApiErrorMessage } from '@/api/client';
import { DateField } from '@/components/DateField';
import { HeroCarousel } from '@/components/HeroCarousel';
import { RoomTypeCard } from '@/components/RoomTypeCard';
import { Stepper } from '@/components/Stepper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { RoomCardSkeleton } from '@/components/ui/Skeleton';
import { SearchHeroSlides } from '@/constants/demoImages';
import { MaxContentWidth, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AvailableRoomType } from '@/types/room';
import { nightsBetween, toIsoDate } from '@/utils/date';

const GUTTER = Space.lg;
const FORM_OVERLAP = 36;

export default function SearchScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, MaxContentWidth);
  const heroHeight = Math.round(Math.min(Math.max((contentWidth - GUTTER * 2) * 0.58, 200), 300));

  const [checkIn, setCheckIn] = useState(dayjs().add(1, 'day').toDate());
  const [checkOut, setCheckOut] = useState(dayjs().add(2, 'day').toDate());
  const [guests, setGuests] = useState(2);
  const [results, setResults] = useState<AvailableRoomType[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nights = nightsBetween(checkIn, checkOut);

  const handleSearch = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await roomsApi.searchAvailability({
        checkIn: toIsoDate(checkIn),
        checkOut: toIsoDate(checkOut),
        guests,
      });
      setResults(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tìm phòng, vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  const header = (
    <View style={styles.header}>
      <Animated.View entering={FadeIn.duration(600)}>
        <HeroCarousel slides={SearchHeroSlides} height={heroHeight} captionInset={FORM_OVERLAP} interval={4500} />
      </Animated.View>

      <Card elevation="floating" style={[styles.form, styles.formOverlap]}>
        <View style={styles.dates}>
          <DateField
            label="Nhận phòng"
            value={checkIn}
            minimumDate={new Date()}
            onChange={(date) => {
              setCheckIn(date);
              if (!dayjs(checkOut).isAfter(date)) setCheckOut(dayjs(date).add(1, 'day').toDate());
            }}
          />
          <DateField
            label="Trả phòng"
            value={checkOut}
            minimumDate={dayjs(checkIn).add(1, 'day').toDate()}
            onChange={setCheckOut}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <Stepper label="Số khách" hint="Người lớn và trẻ em" value={guests} onChange={setGuests} max={20} />

        {error ? (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
        ) : null}

        <Button label={`Tìm phòng · ${nights} đêm`} icon="search" onPress={handleSearch} loading={loading} />
      </Card>

      {results !== null && !loading ? (
        <ThemedText type="heading" style={styles.resultTitle}>
          {results.length > 0 ? `${results.length} loại phòng còn trống` : 'Kết quả'}
        </ThemedText>
      ) : null}

      {loading ? (
        <View style={styles.skeletons}>
          <RoomCardSkeleton />
          <RoomCardSkeleton />
        </View>
      ) : null}
    </View>
  );

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <FlatList
          data={loading ? [] : (results ?? [])}
          keyExtractor={(item) => item.roomTypeId}
          contentContainerStyle={[styles.list, { width: contentWidth }]}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={header}
          ListEmptyComponent={
            loading ? null : results === null ? (
              <EmptyState
                icon="calendar-outline"
                title="Sẵn sàng cho chuyến đi?"
                description="Kết quả phòng trống sẽ hiện ở đây sau khi bạn bấm Tìm phòng."
              />
            ) : (
              <EmptyState
                icon="bed-outline"
                title="Không còn phòng phù hợp"
                description="Thử đổi ngày khác hoặc giảm số khách nhé."
              />
            )
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.duration(450).delay(Math.min(index, 5) * 80)}
              style={styles.cardWrapper}>
              <RoomTypeCard
                roomType={item}
                onPress={() =>
                  router.push({
                    pathname: '/room/[id]',
                    params: {
                      id: item.roomTypeId,
                      checkIn: toIsoDate(checkIn),
                      checkOut: toIsoDate(checkOut),
                      guests: String(guests),
                    },
                  })
                }
              />
            </Animated.View>
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { alignSelf: 'center', paddingBottom: Space['3xl'] },
  header: { paddingHorizontal: GUTTER, paddingTop: Space.sm, gap: Space.xl, marginBottom: Space.lg },
  form: { gap: Space.lg, padding: Space.lg },
  // The form card rides up over the bottom of the hero photos.
  formOverlap: { marginTop: -(FORM_OVERLAP + Space.xl), marginHorizontal: Space.sm },
  dates: { flexDirection: 'row', gap: Space.md },
  divider: { height: StyleSheet.hairlineWidth },
  resultTitle: { marginTop: Space.sm },
  skeletons: { gap: Space['2xl'] },
  cardWrapper: { paddingHorizontal: GUTTER, marginBottom: Space.xl },
});
