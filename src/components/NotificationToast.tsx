import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { openNotificationTarget, useNotificationStyle } from '@/constants/notificationTypes';
import { MaxContentWidth, Radius, Space } from '@/constants/theme';
import { toastEntering, toastExiting } from '@/constants/toastAnimation';
import { useShadows, useTheme } from '@/hooks/use-theme';
import { useNotificationStore } from '@/store/notificationStore';

const AUTO_HIDE_MS = 5000;

/** In-app banner for a notification pushed over the socket while the app is open. */
export function NotificationToast() {
  const { t } = useTranslation();
  const theme = useTheme();
  const shadows = useShadows();
  const insets = useSafeAreaInsets();
  const styleFor = useNotificationStyle();
  const toast = useNotificationStore((s) => s.toast);
  const dismissToast = useNotificationStore((s) => s.dismissToast);

  useEffect(() => {
    if (!toast) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const timer = setTimeout(dismissToast, AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [toast, dismissToast]);

  if (!toast) return null;
  const { icon, color } = styleFor(toast.type);

  const handleOpen = () => {
    dismissToast();
    useNotificationStore.getState().markRead(toast.id);
    openNotificationTarget(toast);
  };

  return (
    <Animated.View
      key={toast.id}
      entering={toastEntering}
      exiting={toastExiting}
      style={[styles.wrapper, { top: insets.top + Space.sm }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${toast.title}. ${toast.body}`}
        accessibilityHint={t('notifications.toastHint')}
        onPress={handleOpen}
        style={({ pressed }) => [
          styles.card,
          shadows.floating,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.92 : 1 },
        ]}>
        <View style={[styles.icon, { backgroundColor: `${color}1F` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={styles.body}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {toast.title}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2}>
            {toast.body}
          </ThemedText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={dismissToast}
          hitSlop={12}
          style={styles.close}>
          <Ionicons name="close" size={18} color={theme.textSecondary} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: Space.md,
    right: Space.md,
    alignItems: 'center',
    zIndex: 1000,
    pointerEvents: 'box-none',
  },
  card: {
    width: '100%',
    maxWidth: MaxContentWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    padding: Space.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  close: { padding: Space.xs },
});
