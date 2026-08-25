import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const BOOKING_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đang lưu trú',
  CHECKED_OUT: 'Đã trả phòng',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã huỷ',
  PAID: 'Đã thanh toán',
  FAILED: 'Thất bại',
};

const POSITIVE_STATUSES = new Set(['CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'PAID']);
const NEGATIVE_STATUSES = new Set(['CANCELLED', 'FAILED']);

export function StatusBadge({ status }: { status: string }) {
  const theme = useTheme();
  const color = POSITIVE_STATUSES.has(status)
    ? theme.success
    : NEGATIVE_STATUSES.has(status)
      ? theme.danger
      : theme.warning;

  return (
    <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: color }]}>
      <ThemedText type="small" style={{ color }}>
        {BOOKING_STATUS_LABEL[status] ?? status}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
});
