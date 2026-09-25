import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const POSITIVE_STATUSES = new Set(['CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'PAID']);
const NEGATIVE_STATUSES = new Set(['CANCELLED', 'FAILED']);
const NEUTRAL_STATUSES = new Set(['CHECKED_OUT']);

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const color = POSITIVE_STATUSES.has(status)
    ? theme.success
    : NEGATIVE_STATUSES.has(status)
      ? theme.danger
      : NEUTRAL_STATUSES.has(status)
        ? theme.textSecondary
        : theme.warning;

  return (
    // Tinted background (color + ~9% alpha) with full-strength text keeps AA contrast.
    <View style={[styles.badge, { backgroundColor: `${color}18` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <ThemedText type="caption" style={{ color }}>
        {t(`booking.status.${status}`, { defaultValue: status })}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs + 2,
    borderRadius: Radius.full,
    paddingHorizontal: Space.sm + 2,
    paddingVertical: Space.xs,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
