import dayjs from 'dayjs';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { roomsApi } from '@/api/rooms';
import { getApiErrorMessage } from '@/api/client';
import { RoomTypeCard } from '@/components/RoomTypeCard';
import { ThemedText } from '@/components/themed-text';
import { DateField } from '@/components/DateField';
import { Stepper } from '@/components/Stepper';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Spacing } from '@/constants/theme';
import { AvailableRoomType } from '@/types/room';
import { toIsoDate } from '@/utils/date';

export default function SearchScreen() {
  const [checkIn, setCheckIn] = useState(dayjs().add(1, 'day').toDate());
  const [checkOut, setCheckOut] = useState(dayjs().add(2, 'day').toDate());
  const [guests, setGuests] = useState(2);
  const [results, setResults] = useState<AvailableRoomType[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.form}>
        <ThemedText type="title" style={styles.title}>
          Tìm phòng trống
        </ThemedText>

        <View style={styles.row}>
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

        <Stepper label="Số khách" value={guests} onChange={setGuests} max={20} />

        {error ? (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
        ) : null}

        <Button label="Tìm phòng" onPress={handleSearch} loading={loading} />
      </View>

      <FlatList
        data={results ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          results !== null ? (
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              Không tìm thấy phòng trống phù hợp.
            </ThemedText>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <RoomTypeCard
              roomType={item}
              onPress={() =>
                router.push({
                  pathname: '/room/[id]',
                  params: { id: item.id, checkIn: toIsoDate(checkIn), checkOut: toIsoDate(checkOut), guests: String(guests) },
                })
              }
            />
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { padding: Spacing.three, gap: Spacing.three },
  title: { fontSize: 26, lineHeight: 32 },
  row: { flexDirection: 'row', gap: Spacing.three },
  list: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.four },
  cardWrapper: { marginBottom: Spacing.three },
  empty: { textAlign: 'center', marginTop: Spacing.four },
});
