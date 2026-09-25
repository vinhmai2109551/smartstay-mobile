import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInRight, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { promotionsApi } from '@/api/promotions';
import { roomTypesApi } from '@/api/roomTypes';
import { Avatar } from '@/components/Avatar';
import { ExperienceGallery } from '@/components/ExperienceGallery';
import { FeaturedRoomCard } from '@/components/FeaturedRoomCard';
import { HeroCarousel } from '@/components/HeroCarousel';
import { PerkRow } from '@/components/PerkRow';
import { PromoTicket } from '@/components/PromoTicket';
import { RoomTypeCard } from '@/components/RoomTypeCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { CountBadge } from '@/components/ui/CountBadge';
import { ErrorView } from '@/components/ui/ErrorView';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { RoomCardSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { HomeHeroSlides } from '@/constants/demoImages';
import { MaxContentWidth, MinTouch, Radius, Space } from '@/constants/theme';
import { useApi } from '@/hooks/useApi';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useShadows, useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import { RoomType } from '@/types/room';

const GUTTER = Space.lg;
const CAROUSEL_GAP = Space.md;
const SEARCH_OVERLAP = 28;
const FEATURED_COUNT = 5;

type IconName = keyof typeof Ionicons.glyphMap;

function SearchField({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.searchField}>
      <View style={[styles.searchFieldIcon, { backgroundColor: theme.primarySoft }]}>
        <Ionicons name={icon} size={18} color={theme.primary} />
      </View>
      <View style={styles.searchFieldText}>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          {label}
        </ThemedText>
        <ThemedText type="smallBold" numberOfLines={1}>
          {value}
        </ThemedText>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const shadows = useShadows();
  const { width: windowWidth } = useWindowDimensions();
  const user = useAuthStore((s) => s.user);
  const unreadCount = useUnreadNotifications();

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
          accessibilityLabel={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
          onPress={() => router.push('/notifications')}
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
          ]}>
          <Ionicons name={unreadCount > 0 ? 'notifications' : 'notifications-outline'} size={22} color={theme.text} />
          <CountBadge count={unreadCount} style={styles.bellBadge} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tài khoản"
          onPress={() => router.navigate('/(tabs)/profile')}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Avatar name={user?.fullName} size={MinTouch} />
        </Pressable>
      </View>

      <Animated.View entering={FadeIn.duration(600)}>
        <HeroCarousel slides={HomeHeroSlides} height={heroHeight} captionInset={SEARCH_OVERLAP} />
      </Animated.View>

      {/* Entering animation lives on a plain Animated.View: Reanimated drops function
          styles on animated Pressables, which left this card unstyled. */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(200)}
        style={[
          styles.searchCard,
          shadows.floating,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        <ThemedText type="bodyBold">Bạn muốn nghỉ khi nào?</ThemedText>
        <Pressable
          accessibilityRole="search"
          accessibilityLabel="Chọn ngày lưu trú và số khách"
          onPress={goToSearch}
          style={({ pressed }) => [
            styles.searchFields,
            { borderColor: theme.border, backgroundColor: theme.background, opacity: pressed ? 0.8 : 1 },
          ]}>
          <SearchField icon="calendar-outline" label="Ngày lưu trú" value="Chọn ngày" />
          <View style={[styles.searchDivider, { backgroundColor: theme.border }]} />
          <SearchField icon="people-outline" label="Số khách" value="Thêm khách" />
        </Pressable>
        <Button label="Tìm phòng trống" icon="search" onPress={goToSearch} />
      </Animated.View>

      <PerkRow />

      {promotion ? (
        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <PromoTicket promotion={promotion} />
        </Animated.View>
      ) : null}

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
      renderItem={({ item, index }) => (
        <Animated.View entering={FadeInRight.duration(500).delay(index * 90)}>
          <FeaturedRoomCard roomType={item} width={featuredCardWidth} onPress={() => openRoom(item)} />
        </Animated.View>
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
              <View style={styles.gallerySection}>
                <SectionHeader title="Trải nghiệm tại Vika Hotel" subtitle="Không gian nghỉ dưỡng ven biển Đà Nẵng" />
                <ExperienceGallery width={innerWidth} />
              </View>
              <View style={styles.suggestHeader}>
                <SectionHeader title="Gợi ý cho bạn" subtitle="Những lựa chọn được yêu thích tại Vika Hotel" />
              </View>
              {roomTypes.loading ? (
                <View style={styles.skeletonList}>
                  <RoomCardSkeleton />
                  <RoomCardSkeleton />
                </View>
              ) : null}
            </>
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.duration(500).delay(Math.min(index, 4) * 80)}
              style={styles.suggestItem}>
              <RoomTypeCard roomType={item} onPress={() => openRoom(item)} />
            </Animated.View>
          )}
          ListEmptyComponent={
            roomTypes.loading ? null : (
              <ThemedText themeColor="textSecondary" style={styles.empty}>
                Chưa có loại phòng nào.
              </ThemedText>
            )
          }
        />

        <Animated.View entering={ZoomIn.springify().damping(14).delay(600)} style={[styles.fab, shadows.floating]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hỏi trợ lý AI"
            onPress={() => router.navigate('/(tabs)/chat')}
            style={({ pressed }) => [
              styles.fabButton,
              { backgroundColor: theme.primary, transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}>
            <Ionicons name="sparkles" size={18} color={theme.primaryText} />
            <ThemedText type="smallBold" style={{ color: theme.primaryText }}>
              Hỏi trợ lý AI
            </ThemedText>
          </Pressable>
        </Animated.View>
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
  bellBadge: { position: 'absolute', top: -4, right: -4 },
  searchCard: {
    // Pulls the card up so it overlaps the bottom edge of the hero.
    marginTop: -(SEARCH_OVERLAP + Space.xl),
    marginHorizontal: Space.sm,
    padding: Space.lg,
    gap: Space.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchFields: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', marginVertical: Space.md },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
  },
  searchFieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchFieldText: { flex: 1 },
  carousel: {
    marginTop: Space.md,
  },
  carouselContent: {
    paddingHorizontal: GUTTER,
    paddingVertical: Space.sm,
  },
  row: { flexDirection: 'row', gap: CAROUSEL_GAP },
  gallerySection: {
    paddingHorizontal: GUTTER,
    marginTop: Space['2xl'],
    gap: Space.lg,
  },
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
    borderRadius: Radius.full,
  },
  fabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    minHeight: 48,
    paddingHorizontal: Space.xl,
    borderRadius: Radius.full,
  },
});
