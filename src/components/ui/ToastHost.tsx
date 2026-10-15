import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Space } from '@/constants/theme';
import { toastEntering, toastExiting } from '@/constants/toastAnimation';
import { useShadows, useTheme } from '@/hooks/use-theme';
import { ToastItem, ToastVariant, useToastStore } from '@/store/toastStore';

type IconName = keyof typeof Ionicons.glyphMap;

const VARIANT: Record<ToastVariant, { icon: IconName; haptic: Haptics.NotificationFeedbackType }> = {
  success: { icon: 'checkmark-circle', haptic: Haptics.NotificationFeedbackType.Success },
  error: { icon: 'alert-circle', haptic: Haptics.NotificationFeedbackType.Error },
  warning: { icon: 'warning', haptic: Haptics.NotificationFeedbackType.Warning },
  info: { icon: 'information-circle', haptic: Haptics.NotificationFeedbackType.Success },
};

// Dragging up by this much dismisses, like a system banner.
const SWIPE_DISMISS_DISTANCE = 24;

/**
 * Renders the current toast (see store/toastStore) as a banner sliding down from the
 * top, the way iOS/Android system notifications appear. Mount once at the app root.
 */
export function ToastHost() {
  const current = useToastStore((s) => s.current);
  if (!current) return null;
  // Keyed so each new toast replays the enter animation and restarts its timer.
  return <ToastBanner key={current.id} toast={current} />;
}

function ToastBanner({ toast }: { toast: ToastItem }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const shadows = useShadows();
  const insets = useSafeAreaInsets();
  const hide = useToastStore((s) => s.hide);
  const touchStartY = useRef(0);

  const color = { success: theme.success, error: theme.danger, warning: theme.warning, info: theme.primary }[
    toast.variant
  ];
  const { icon, haptic } = VARIANT[toast.variant];
  const title = toast.title ?? t(`toast.${toast.variant}Title`);

  useEffect(() => {
    Haptics.notificationAsync(haptic);
    const timer = setTimeout(() => hide(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, haptic, hide]);

  return (
    <Animated.View
      entering={toastEntering}
      exiting={toastExiting}
      style={[styles.wrapper, { top: insets.top + Space.sm }]}
      accessibilityLiveRegion="polite">
      <View
        accessible
        accessibilityRole="alert"
        accessibilityLabel={`${title}. ${toast.message}`}
        // Swipe up to dismiss. Only claims moves, so the close button still gets taps.
        onMoveShouldSetResponder={() => true}
        onTouchStart={(event) => {
          touchStartY.current = event.nativeEvent.pageY;
        }}
        onResponderMove={(event) => {
          if (event.nativeEvent.pageY - touchStartY.current < -SWIPE_DISMISS_DISTANCE) hide(toast.id);
        }}
        style={[styles.card, shadows.floating, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={[styles.accent, { backgroundColor: color }]} />
        <View style={[styles.icon, { backgroundColor: `${color}1F` }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <View style={styles.body}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {title}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={3}>
            {toast.message}
          </ThemedText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={() => hide(toast.id)}
          hitSlop={12}
          style={styles.close}>
          <Ionicons name="close" size={18} color={theme.textSecondary} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: Space.md,
    right: Space.md,
    alignItems: 'center',
    zIndex: 2000,
    elevation: 2000,
    pointerEvents: 'box-none',
  },
  card: {
    width: '100%',
    maxWidth: MaxContentWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    paddingVertical: Space.md,
    paddingLeft: Space.lg,
    paddingRight: Space.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  close: { padding: Space.xs, alignSelf: 'flex-start' },
});
