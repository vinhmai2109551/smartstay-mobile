import dayjs from 'dayjs';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { roomsApi } from '@/api/rooms';
import { getApiErrorMessage } from '@/api/client';
import { toast } from '@/store/toastStore';
import { DateField } from '@/components/DateField';
import { HeroCarousel } from '@/components/HeroCarousel';
import { RoomTypeCard } from '@/components/RoomTypeCard';
import { Stepper } from '@/components/Stepper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { RoomCardSkeleton } from '@/components/ui/Skeleton';
import { getSearchHeroSlides } from '@/constants/demoImages';
import { MaxContentWidth, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSearchPrefsStore } from '@/store/searchPrefsStore';
import { AvailableRoomType } from '@/types/room';
import { nightsBetween, toIsoDate } from '@/utils/date';
import { filterRooms, PRICE_RANGES, PriceRangeKey } from '@/utils/roomFilter';

const GUTTER = Space.lg;
const FORM_OVERLAP = 36;

export default function SearchScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, MaxContentWidth);
  const heroHeight = Math.round(Math.min(Math.max((contentWidth - GUTTER * 2) * 0.58, 200), 300));
  const heroSlides = useMemo(() => getSearchHeroSlides(t), [t]);

  // Picks up where the guest left off if they already searched this session
  // (e.g. tapped the search card on the home tab), otherwise tomorrow/+1 night.
  const [checkIn, setCheckIn] = useState(() => {
    const last = useSearchPrefsStore.getState().checkIn;
    return last ? dayjs(last).toDate() : dayjs().add(1, 'day').toDate();
  });
  const [checkOut, setCheckOut] = useState(() => {
    const last = useSearchPrefsStore.getState().checkOut;
    return last ? dayjs(last).toDate() : dayjs().add(2, 'day').toDate();
  });
  const [guests, setGuests] = useState(() => useSearchPrefsStore.getState().guests ?? 2);
  const [results, setResults] = useState<AvailableRoomType[] | null>(null);
  const [loading, setLoading] = useState(false);
  const setSearchPrefs = useSearchPrefsStore((s) => s.setSearchPrefs);

  // Lọc trên kết quả đã tải, không gọi lại API — giống bộ lọc bên web.
  const [priceKey, setPriceKey] = useState<PriceRangeKey>('all');
  const [typeNames, setTypeNames] = useState<string[]>([]);
  const roomTypeNames = useMemo(() => [...new Set((results ?? []).map((r) => r.name))], [results]);
  const visibleResults = useMemo(
    () => (results ? filterRooms(results, priceKey, typeNames) : null),
    [results, priceKey, typeNames],
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = (priceKey !== 'all' ? 1 : 0) + typeNames.length;
  const filtersActive = activeFilterCount > 0;
  const resetFilters = () => {
    setPriceKey('all');
    setTypeNames([]);
  };
  const toggleTypeName = (name: string) =>
    setTypeNames((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));

  const nights = nightsBetween(checkIn, checkOut);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await roomsApi.searchAvailability({
        checkIn: toIsoDate(checkIn),
        checkOut: toIsoDate(checkOut),
        guests,
      });
      setResults(data);
      // Loại phòng đã chọn có thể không còn trong kết quả mới.
      setTypeNames((prev) => prev.filter((n) => data.some((r) => r.name === n)));
      setSearchPrefs({ checkIn: toIsoDate(checkIn), checkOut: toIsoDate(checkOut), guests });
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('search.searchFailed')));
    } finally {
      setLoading(false);
    }
  };

  const header = (
    <View style={styles.header}>
      <Animated.View entering={FadeIn.duration(600)}>
        <HeroCarousel slides={heroSlides} height={heroHeight} captionInset={FORM_OVERLAP} interval={4500} />
      </Animated.View>

      <Card elevation="floating" style={[styles.form, styles.formOverlap]}>
        <View style={styles.dates}>
          <DateField
            label={t('search.checkIn')}
            value={checkIn}
            minimumDate={new Date()}
            onChange={(date) => {
              setCheckIn(date);
              if (!dayjs(checkOut).isAfter(date)) setCheckOut(dayjs(date).add(1, 'day').toDate());
            }}
          />
          <DateField
            label={t('search.checkOut')}
            value={checkOut}
            minimumDate={dayjs(checkIn).add(1, 'day').toDate()}
            onChange={setCheckOut}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <Stepper
          label={t('search.guests')}
          hint={t('search.guestsHint')}
          value={guests}
          onChange={setGuests}
          max={20}
        />

        <Button
          label={t('search.searchButton', { count: nights })}
          icon="search"
          onPress={handleSearch}
          loading={loading}
        />
      </Card>

      {results !== null && results.length > 0 && !loading ? (
        <Card style={styles.filters}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: filtersOpen }}
            onPress={() => setFiltersOpen((open) => !open)}
            hitSlop={8}
            style={styles.filterHeader}
          >
            <ThemedText type="smallBold">
              {t('search.filter.title')}
              {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </ThemedText>
            <Ionicons
              name={filtersOpen ? 'chevron-up' : 'options-outline'}
              size={22}
              color={activeFilterCount > 0 || filtersOpen ? theme.primary : theme.text}
            />
          </Pressable>
          {filtersOpen ? (
            <Animated.View
              entering={FadeInDown.duration(200)}
              exiting={FadeOut.duration(150)}
              style={styles.filterBody}
            >
              <ThemedText type="caption" themeColor="textSecondary">
                {t('search.filter.priceRange')}
              </ThemedText>
              <View style={styles.chips}>
                {PRICE_RANGES.map((range) => (
                  <Chip
                    key={range.key}
                    label={t(`search.filter.price.${range.key}`)}
                    selected={priceKey === range.key}
                    onPress={() => setPriceKey(range.key)}
                  />
                ))}
              </View>
              {roomTypeNames.length > 1 ? (
                <>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {t('search.filter.roomType')}
                  </ThemedText>
                  <View style={styles.chips}>
                    {roomTypeNames.map((name) => (
                      <Chip
                        key={name}
                        label={name}
                        selected={typeNames.includes(name)}
                        onPress={() => toggleTypeName(name)}
                      />
                    ))}
                  </View>
                </>
              ) : null}
              {filtersActive ? (
                <ThemedText
                  type="smallBold"
                  style={[styles.filterReset, { color: theme.primary }]}
                  onPress={resetFilters}
                  accessibilityRole="button"
                >
                  {t('search.filter.reset')}
                </ThemedText>
              ) : null}
            </Animated.View>
          ) : null}
        </Card>
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
          data={loading ? [] : (visibleResults ?? [])}
          keyExtractor={(item) => item.roomTypeId}
          contentContainerStyle={[styles.list, { width: contentWidth }]}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={header}
          ListEmptyComponent={
            loading ? undefined : results === null ? (
              <EmptyState
                icon="calendar-outline"
                title={t('search.emptyInitialTitle')}
                description={t('search.emptyInitialDescription')}
              />
            ) : filtersActive && results.length > 0 ? (
              <EmptyState
                icon="funnel-outline"
                title={t('search.filter.emptyTitle')}
                description={t('search.filter.emptyDescription')}
                actionLabel={t('search.filter.reset')}
                onAction={resetFilters}
              />
            ) : (
              <EmptyState
                icon="bed-outline"
                title={t('search.emptyResultsTitle')}
                description={t('search.emptyResultsDescription')}
              />
            )
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.duration(450).delay(Math.min(index, 5) * 80)}
              style={styles.cardWrapper}
            >
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
  filters: { padding: Space.lg },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterBody: { gap: Space.sm, marginTop: Space.md },
  filterReset: { alignSelf: 'flex-end', marginTop: Space.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  skeletons: { gap: Space['2xl'] },
  cardWrapper: { paddingHorizontal: GUTTER, marginBottom: Space.xl },
});
