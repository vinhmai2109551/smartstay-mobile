import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { promotionsApi } from '@/api/promotions';
import { roomTypesApi } from '@/api/roomTypes';
import { Avatar } from '@/components/Avatar';
import { FeaturedRoomCard } from '@/components/FeaturedRoomCard';
import { PromoTicket } from '@/components/PromoTicket';
import { RoomTypeCard } from '@/components/RoomTypeCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ErrorView } from '@/components/ui/ErrorView';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { RoomCardSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { HeroImage } from '@/constants/demoImages';
import { MaxContentWidth, MinTouch, Radius, Space } from '@/constants/theme';
import { useApi } from '@/hooks/useApi';
import { useShadows, useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import { RoomType } from '@/types/room';

const GUTTER = Space.lg;
const CAROUSEL_GAP = Space.md;
const SEARCH_OVERLAP = 28;
const FEATURED_COUNT = 5;

export default function HomeScreen() {
  const theme = useTheme();
  const shadows = useShadows();
  const { width: windowWidth } = useWindowDimensions();
  const user = useAuthStore((s) => s.user);

  const fetchRoomTypes = useCallback(() => roomTypesApi.list(), []);
  const roomTypes = useApi(fetchRoomTypes);
  const fetchPromotions = useCallback(() => promotionsApi.listActive(), []);
  const promotions = useApi(fetchPromotions);

  // Content is capped and centred on tablets; everything below derives from this width.
  const contentWidth = Math.min(windowWidth, MaxContentWidth);
  const innerWidth = contentWidth - GUTTER * 2;
  const heroHeight = Math.round(Math.min(Math.max(innerWidth * 0.62, 210), 320));
  const featuredCardWidth = Math.round(Math.min(innerWidth * 0.78, 320));

  const firstName = user?.fullName ? user.fullName.trim().split(/\s+/).at(-1) : undefined;
  const featured = useMemo(
    () => [...(roomTypes.data ?? [])].sort((a, b) => b.basePrice - a.basePrice).slice(0, FEATURED_COUNT),
    [roomTypes.data],
  );
  const promotion = promotions.data?.[0];

  const openRoom = (roomType: RoomType) => router.push(`/room/${roomType.roomTypeId}`);
  const goToSearch = () => router.navigate('/(tabs)/search');
  const refreshing = roomTypes.refreshing || promotions.refreshing;
  const onRefresh = () => {
    roomTypes.refresh();
    promotions.refresh();
  };

  if (roomTypes.error && !roomTypes.data) {
    return <ErrorView message={roomTypes.error} onRetry={roomTypes.refetch} />;
  }

  const header = (
    <View style={styles.headerBlock}>
      <View style={styles.topBar}>
        <View style={styles.greeting}>
          <ThemedText type="small" themeColor="textSecondary">
            Xin chào{firstName ? ',' : ''}
          </ThemedText>
          <ThemedText type="title" numberOfLines={1}>
            {firstName ?? 'Quý khách'}
          </ThemedText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Thông báo"
          onPress={() => router.push('/notifications')}
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
          ]}>
          <Ionicons name="notifications-outline" size={22} color={theme.text} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tài khoản"
          onPress={() => router.navigate('/(tabs)/profile')}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Avatar name={user?.fullName} size={MinTouch} />
        </Pressable>
      </View>

      <View style={[styles.hero, { height: heroHeight }]}>
        <Image source={HeroImage} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient
          colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.7)']}
          locations={[0.3, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={[styles.heroText, { paddingBottom: SEARCH_OVERLAP + Space.lg }]}>
          <ThemedText type="caption" style={styles.heroEyebrow}>
            SMARTSTAY
          </ThemedText>
          <ThemedText type="display" style={styles.heroTitle}>
            Kỳ nghỉ của bạn{'\n'}bắt đầu từ đây
          </ThemedText>
        </View>
      </View>

      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Tìm phòng trống"
        onPress={goToSearch}
        style={({ pressed }) => [
          styles.searchBar,
          shadows.floating,
          { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.95 : 1 },
        ]}>
        <View style={[styles.searchIcon, { backgroundColor: theme.primarySoft }]}>
          <Ionicons name="search" size={20} color={theme.primary} />
        </View>
        <View style={styles.searchText}>
          <ThemedText type="smallBold">Bạn muốn nghỉ khi nào?</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
            Chọn ngày nhận phòng · trả phòng · số khách
          </ThemedText>
        </View>
        <Ionicons name="options-outline" size={20} color={theme.textSecondary} />
      </Pressable>

      {promotion ? <PromoTicket promotion={promotion} /> : null}

      <SectionHeader title="Loại phòng nổi bật" onAction={goToSearch} />
    </View>
  );

  const featuredCarousel = roomTypes.loading ? (
    <View style={[styles.carouselContent, styles.row]}>
      <Skeleton width={featuredCardWidth} height={200} radius={Radius.lg} />
      <Skeleton width={featuredCardWidth} height={200} radius={Radius.lg} />
    </View>
  ) : (
    <FlatList
      horizontal
      data={featured}
      keyExtractor={(item) => item.roomTypeId}
      renderItem={({ item }) => (
        <FeaturedRoomCard roomType={item} width={featuredCardWidth} onPress={() => openRoom(item)} />
      )}
      showsHorizontalScrollIndicator={false}
      snapToInterval={featuredCardWidth + CAROUSEL_GAP}
      snapToAlignment="start"
      decelerationRate="fast"
      contentContainerStyle={styles.carouselContent}
      ItemSeparatorComponent={() => <View style={{ width: CAROUSEL_GAP }} />}
      // Room for the card shadows, which would otherwise be clipped by the list.
      style={styles.carousel}
    />
  );

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <FlatList
          data={roomTypes.loading ? [] : (roomTypes.data ?? [])}
          keyExtractor={(item) => item.roomTypeId}
          contentContainerStyle={[styles.list, { width: contentWidth }]}
          style={styles.flex}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          ListHeaderComponent={
            <>
              {header}
              {featuredCarousel}
              <View style={styles.suggestHeader}>
                <SectionHeader title="Gợi ý cho bạn" subtitle="Những lựa chọn được yêu thích tại SmartStay" />
              </View>
              {roomTypes.loading ? (
                <View style={styles.skeletonList}>
                  <RoomCardSkeleton />
                  <RoomCardSkeleton />
                </View>
              ) : null}
            </>
          }
          renderItem={({ item }) => (
            <View style={styles.suggestItem}>
              <RoomTypeCard roomType={item} onPress={() => openRoom(item)} />
            </View>
          )}
          ListEmptyComponent={
            roomTypes.loading ? null : (
              <ThemedText themeColor="textSecondary" style={styles.empty}>
                Chưa có loại phòng nào.
              </ThemedText>
            )
          }
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hỏi trợ lý AI"
          onPress={() => router.navigate('/(tabs)/chat')}
          style={({ pressed }) => [
            styles.fab,
            shadows.floating,
            { backgroundColor: theme.primary, transform: [{ scale: pressed ? 0.96 : 1 }] },
          ]}>
          <Ionicons name="sparkles" size={18} color={theme.primaryText} />
          <ThemedText type="smallBold" style={{ color: theme.primaryText }}>
            Hỏi trợ lý AI
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: {
    alignSelf: 'center',
    // Leaves space so the last card isn't hidden behind the floating AI button.
    paddingBottom: Space['4xl'] + Space['3xl'],
  },
  headerBlock: {
    paddingHorizontal: GUTTER,
    paddingTop: Space.sm,
    gap: Space.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
  },
  greeting: { flex: 1 },
  iconButton: {
    width: MinTouch,
    height: MinTouch,
    borderRadius: MinTouch / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroText: {
    paddingHorizontal: Space.xl,
    gap: Space.xs,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 2,
  },
  heroTitle: {
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    minHeight: 64,
    marginTop: -(SEARCH_OVERLAP + Space.xl),
    marginHorizontal: Space.md,
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
    borderRadius: Radius.full,
  },
  searchIcon: {
    width: MinTouch,
    height: MinTouch,
    borderRadius: MinTouch / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchText: { flex: 1 },
  carousel: {
    marginTop: Space.md,
  },
  carouselContent: {
    paddingHorizontal: GUTTER,
    paddingVertical: Space.sm,
  },
  row: { flexDirection: 'row', gap: CAROUSEL_GAP },
  suggestHeader: {
    paddingHorizontal: GUTTER,
    marginTop: Space['2xl'],
    marginBottom: Space.lg,
  },
  skeletonList: {
    paddingHorizontal: GUTTER,
    gap: Space['2xl'],
  },
  suggestItem: {
    paddingHorizontal: GUTTER,
    marginBottom: Space.xl,
  },
  empty: {
    textAlign: 'center',
    paddingHorizontal: GUTTER,
  },
  fab: {
    position: 'absolute',
    right: GUTTER,
    bottom: Space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    minHeight: 48,
    paddingHorizontal: Space.xl,
    borderRadius: Radius.full,
  },
});
