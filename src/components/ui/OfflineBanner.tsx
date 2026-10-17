import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Space } from '@/constants/theme';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useTheme } from '@/hooks/use-theme';

// How long "Đã kết nối lại" stays up before the banner disappears on its own.
const RECONNECTED_DISPLAY_MS = 2000;

/** Persistent connectivity banner — mounted once, in TopOverlay, above everything. */
export function OfflineBanner() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isOnline = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      // No setState here: while offline, `isOnline` alone already makes the render
      // below show the offline banner regardless of showReconnected's value — it only
      // matters for the early-return just below, which doesn't apply while offline.
      wasOfflineRef.current = true;
      return;
    }
    if (!wasOfflineRef.current) return;
    wasOfflineRef.current = false;
    setShowReconnected(true);
    const timer = setTimeout(() => setShowReconnected(false), RECONNECTED_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [isOnline]);

  if (isOnline && !showReconnected) return null;

  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.banner,
        { paddingTop: insets.top + Space.xs, backgroundColor: isOnline ? theme.success : theme.danger },
      ]}>
      <ThemedText type="caption" style={styles.text}>
        {isOnline ? t('common.reconnected') : t('common.offline')}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: Space.xs,
    alignItems: 'center',
    zIndex: 1900,
    elevation: 1900,
  },
  text: { color: '#FFFFFF' },
});
