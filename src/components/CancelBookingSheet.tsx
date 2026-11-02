import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { bookingsApi } from '@/api/bookings';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Skeleton } from '@/components/ui/Skeleton';
import { TextField } from '@/components/ui/TextField';
import { Radius, Space } from '@/constants/theme';
import { useShadows, useTheme } from '@/hooks/use-theme';
import { CancellationPreview } from '@/types/refund';
import { formatVND } from '@/utils/currency';
import { describeCancellationPreview } from '@/utils/refund';

const REASON_MAX = 500;

type CancelBookingSheetProps = {
  visible: boolean;
  bookingId: string;
  paidAmount: number;
  loading: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
};

export function CancelBookingSheet({
  visible,
  bookingId,
  paidAmount,
  loading,
  onConfirm,
  onCancel,
}: CancelBookingSheetProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const shadows = useShadows();

  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState<CancellationPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  // Reset ô lý do + xem trước mỗi lần dialog mở lại — tránh lý do/mức hoàn tiền của lần
  // huỷ trước (đơn khác) còn sót lại, đúng cách BookingHistoryPage.jsx (web) đang làm.
  useEffect(() => {
    function run() {
      if (!visible) return;
      setReason('');
      setPreview(null);
      setPreviewError(false);
      if (paidAmount <= 0) return;
      setPreviewLoading(true);
      bookingsApi
        .cancellationPreview(bookingId)
        .then(setPreview)
        .catch(() => setPreviewError(true))
        .finally(() => setPreviewLoading(false));
    }
    run();
  }, [visible, bookingId, paidAmount]);

  const chips: { label: string; key: string }[] = [
    { key: 'scheduleChange', label: t('booking.cancelReasonChipScheduleChange') },
    { key: 'wrongBooking', label: t('booking.cancelReasonChipWrongBooking') },
    { key: 'foundElsewhere', label: t('booking.cancelReasonChipFoundElsewhere') },
    { key: 'other', label: t('booking.cancelReasonChipOther') },
  ];

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onConfirm(reason.trim() || t('booking.cancelReasonDefault'));
  };

  const previewState = preview ? describeCancellationPreview(preview, paidAmount) : null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          style={StyleSheet.absoluteFill}
          onPress={loading ? undefined : onCancel}
        />
        <View style={[styles.card, shadows.floating, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="heading" style={styles.center}>
            {t('booking.cancelTitle')}
          </ThemedText>
          <ThemedText type="body" themeColor="textSecondary" style={styles.center}>
            {t('booking.cancelMessage')}
          </ThemedText>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {paidAmount > 0 ? (
              previewLoading ? (
                <Skeleton height={56} radius={Radius.md} />
              ) : previewError ? (
                <ThemedText type="caption" themeColor="textSecondary">
                  {t('booking.cancelPreviewError')}
                </ThemedText>
              ) : preview ? (
                <>
                  {previewState === 'full' ? (
                    <View style={[styles.previewBox, { backgroundColor: theme.successSoft }]}>
                      <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                      <ThemedText type="small" themeColor="success" style={styles.flexShrink}>
                        {t('booking.cancellationPreviewFull', {
                          amount: formatVND(preview.refundAmount),
                          hours: Math.floor(preview.hoursUntilCheckIn),
                        })}
                      </ThemedText>
                    </View>
                  ) : previewState === 'partial' ? (
                    <View style={[styles.previewBox, { backgroundColor: theme.accentSoft }]}>
                      <Ionicons name="alert-circle" size={16} color={theme.accentText} />
                      <ThemedText type="small" themeColor="accentText" style={styles.flexShrink}>
                        {t('booking.cancellationPreviewPartial', {
                          percent: preview.refundPercent,
                          amount: formatVND(preview.refundAmount),
                          paidAmount: formatVND(paidAmount),
                          freeHours: preview.freeCancellationHours,
                        })}
                      </ThemedText>
                    </View>
                  ) : previewState === 'none' ? (
                    <View style={[styles.previewBox, { backgroundColor: `${theme.danger}18` }]}>
                      <Ionicons name="warning" size={16} color={theme.danger} />
                      <ThemedText type="small" themeColor="danger" style={styles.flexShrink}>
                        {t('booking.cancellationPreviewNone')}
                      </ThemedText>
                    </View>
                  ) : null}
                  <ThemedText type="caption" themeColor="textSecondary">
                    {t('booking.cancelRefundProcessNote')}
                  </ThemedText>
                </>
              ) : null
            ) : null}

            <View style={styles.chips}>
              {chips.map((chip) => (
                <Chip key={chip.key} label={chip.label} onPress={() => setReason(chip.label)} />
              ))}
            </View>

            <TextField
              label={t('booking.cancelReasonInputLabel')}
              placeholder={t('booking.cancelReasonInputPlaceholder')}
              value={reason}
              onChangeText={(v) => setReason(v.slice(0, REASON_MAX))}
              maxLength={REASON_MAX}
              multiline
            />
            <ThemedText type="caption" themeColor="textSecondary">
              {t('booking.cancelReasonCount', { count: reason.length, max: REASON_MAX })}
            </ThemedText>
          </ScrollView>

          <View style={styles.actions}>
            <View style={styles.actionButton}>
              <Button label={t('booking.cancelDismiss')} variant="outline" onPress={onCancel} disabled={loading} />
            </View>
            <View style={styles.actionButton}>
              <Button label={t('booking.cancelConfirm')} variant="danger" onPress={handleConfirm} loading={loading} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Space['2xl'],
  },
  card: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    borderRadius: Radius.lg,
    padding: Space['2xl'],
    gap: Space.md,
  },
  center: { textAlign: 'center' },
  scroll: { flexGrow: 0 },
  scrollContent: { gap: Space.md, paddingVertical: Space.xs },
  flexShrink: { flexShrink: 1 },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Space.sm,
    borderRadius: Radius.md,
    padding: Space.md,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  actions: { flexDirection: 'row', gap: Space.md, marginTop: Space.sm },
  actionButton: { flex: 1 },
});
