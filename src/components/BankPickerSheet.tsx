import { Image } from 'expo-image';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
} from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VietQrBankApp } from '@/api/vietqrBanks';
import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { TextField } from '@/components/ui/TextField';
import { MaxContentWidth, Radius, Space } from '@/constants/theme';
import { useShadows, useTheme } from '@/hooks/use-theme';

type BankPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  banks: VietQrBankApp[];
  loading: boolean;
  recentAppId: string | null;
  onSelect: (app: VietQrBankApp) => void;
};

const DRAG_DISMISS_DISTANCE = 80;
const DRAG_CLOSE_SPRING = { damping: 20, stiffness: 260 };

export function BankPickerSheet({ visible, onClose, banks, loading, recentAppId, onSelect }: BankPickerSheetProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const shadows = useShadows();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const translateY = useSharedValue(0);
  const dragStartY = useRef(0);

  const numColumns = width >= 480 ? 4 : 3;
  const contentWidth = Math.min(width, MaxContentWidth) - Space.lg * 2;
  const itemWidth = (contentWidth - Space.md * (numColumns - 1)) / numColumns;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? banks.filter((bank) => bank.bankName.toLowerCase().includes(q) || bank.appName.toLowerCase().includes(q))
      : banks;
    // Stable sort: recently-used app first, then autofill-capable apps, original order otherwise.
    return [...matches].sort((a, b) => {
      if (a.appId === recentAppId) return -1;
      if (b.appId === recentAppId) return 1;
      if (a.autofill !== b.autofill) return a.autofill ? -1 : 1;
      return 0;
    });
  }, [banks, query, recentAppId]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
  }));

  const handleClose = () => {
    translateY.set(0);
    setQuery('');
    onClose();
  };

  const handleDragStart = (event: GestureResponderEvent) => {
    dragStartY.current = event.nativeEvent.pageY;
  };

  const handleDragMove = (event: GestureResponderEvent) => {
    const delta = event.nativeEvent.pageY - dragStartY.current;
    if (delta > 0) translateY.set(delta);
  };

  const handleDragEnd = () => {
    if (translateY.get() > DRAG_DISMISS_DISTANCE) {
      handleClose();
    } else {
      translateY.set(withSpring(0, DRAG_CLOSE_SPRING));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={handleClose}>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
        />
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[
            styles.sheet,
            shadows.floating,
            sheetAnimatedStyle,
            { backgroundColor: theme.backgroundElement, paddingBottom: Math.max(insets.bottom, Space.lg) },
          ]}>
          <View
            onStartShouldSetResponder={() => true}
            onResponderGrant={handleDragStart}
            onResponderMove={handleDragMove}
            onResponderRelease={handleDragEnd}
            style={styles.dragHandleArea}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
            <ThemedText type="heading" style={styles.center}>
              {t('checkout.bankSheetTitle')}
            </ThemedText>
          </View>

          <View style={styles.searchRow}>
            <TextField
              placeholder={t('checkout.bankSearchPlaceholder')}
              leftIcon="search-outline"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              accessibilityLabel={t('checkout.bankSearchPlaceholder')}
            />
          </View>

          {loading && banks.length === 0 ? (
            <View style={styles.loading}>
              <Skeleton width="100%" height={96} radius={Radius.lg} />
              <Skeleton width="100%" height={96} radius={Radius.lg} />
            </View>
          ) : filtered.length === 0 ? (
            <EmptyState icon="search-outline" title={t('checkout.noBanksFound')} />
          ) : (
            <FlatList
              data={filtered}
              key={numColumns}
              numColumns={numColumns}
              style={styles.flatList}
              keyExtractor={(item) => item.appId}
              contentContainerStyle={styles.grid}
              columnWrapperStyle={styles.gridRow}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${item.bankName} - ${item.appName}`}
                  onPress={() => onSelect(item)}
                  style={({ pressed }) => [
                    styles.bankItem,
                    { width: itemWidth, backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.85 : 1 },
                  ]}>
                  {item.autofill ? (
                    <View style={[styles.autofillBadge, { backgroundColor: theme.accentSoft }]}>
                      <ThemedText type="caption" themeColor="accentText">
                        {t('checkout.autofillBadge')}
                      </ThemedText>
                    </View>
                  ) : null}
                  <Image source={{ uri: item.appLogo }} style={styles.bankLogo} contentFit="contain" />
                  <ThemedText type="caption" numberOfLines={2} style={styles.center}>
                    {item.appName}
                  </ThemedText>
                </Pressable>
              )}
            />
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    maxHeight: '80%',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Space.sm,
    gap: Space.md,
  },
  dragHandleArea: { alignItems: 'center', gap: Space.sm, paddingBottom: Space.xs },
  handle: { width: 40, height: 5, borderRadius: 3 },
  center: { textAlign: 'center' },
  searchRow: { paddingHorizontal: Space.lg },
  flatList: { flexGrow: 1, flexShrink: 1 },
  loading: { paddingHorizontal: Space.lg, gap: Space.md, paddingBottom: Space.xl },
  grid: { paddingHorizontal: Space.lg, paddingBottom: Space.xl, gap: Space.md },
  gridRow: { gap: Space.md },
  bankItem: {
    alignItems: 'center',
    gap: Space.xs,
    padding: Space.md,
    borderRadius: Radius.lg,
    minHeight: 96,
  },
  autofillBadge: {
    position: 'absolute',
    top: Space.xs,
    right: Space.xs,
    paddingHorizontal: Space.xs,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  bankLogo: { width: 40, height: 40 },
});
