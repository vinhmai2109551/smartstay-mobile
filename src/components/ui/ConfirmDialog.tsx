import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Radius, Space } from '@/constants/theme';
import { useShadows, useTheme } from '@/hooks/use-theme';

export type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Confirm button reads as a dangerous/irreversible action (e.g. cancel booking, log out). */
  destructive?: boolean;
  loading?: boolean;
  /** Set false to show/hide the dialog instantly, skipping the fade/zoom entrance. */
  animated?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Centered, on-brand confirmation modal — the app's replacement for the native
 * `Alert.alert`, which can't be themed or styled to match the design system.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  loading = false,
  animated = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const shadows = useShadows();
  const resolvedCancelLabel = cancelLabel ?? t('common.cancel');

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onConfirm();
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onCancel}>
      <Animated.View
        entering={animated ? FadeIn.duration(180) : undefined}
        exiting={animated ? FadeOut.duration(150) : undefined}
        style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          style={StyleSheet.absoluteFill}
          onPress={loading ? undefined : onCancel}
        />
        <Animated.View
          entering={animated ? ZoomIn.duration(200).springify().damping(18) : undefined}
          exiting={animated ? ZoomOut.duration(150) : undefined}
          style={[styles.card, shadows.floating, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="heading" style={styles.center}>
            {title}
          </ThemedText>
          {message ? (
            <ThemedText type="body" themeColor="textSecondary" style={styles.center}>
              {message}
            </ThemedText>
          ) : null}
          <View style={styles.actions}>
            <View style={styles.actionButton}>
              <Button label={resolvedCancelLabel} variant="outline" onPress={onCancel} disabled={loading} />
            </View>
            <View style={styles.actionButton}>
              <Button
                label={confirmLabel}
                variant={destructive ? 'danger' : 'primary'}
                onPress={handleConfirm}
                loading={loading}
              />
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // A neutral black scrim reads correctly over either theme's content.
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Space['2xl'],
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radius.lg,
    padding: Space['2xl'],
    gap: Space.md,
  },
  center: { textAlign: 'center' },
  actions: { flexDirection: 'row', gap: Space.md, marginTop: Space.sm },
  actionButton: { flex: 1 },
});
