import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BookingRefundRequest } from '@/types/refund';
import { formatVND } from '@/utils/currency';
import { getBookingCode } from '@/utils/bookingQr';
import { getRefundDisplayState } from '@/utils/refund';

type IconName = keyof typeof Ionicons.glyphMap;

type RefundStatusCardProps = {
  bookingId: string;
  refund: BookingRefundRequest;
};

const STATE_STYLE: Record<
  'pending' | 'overdue' | 'completed' | 'rejected',
  { icon: IconName; tone: 'warning' | 'danger' | 'success' }
> = {
  pending: { icon: 'time-outline', tone: 'warning' },
  overdue: { icon: 'alert-circle', tone: 'danger' },
  completed: { icon: 'checkmark-circle', tone: 'success' },
  rejected: { icon: 'close-circle', tone: 'danger' },
};

export function RefundStatusCard({ bookingId, refund }: RefundStatusCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [viewerVisible, setViewerVisible] = useState(false);
  const state = getRefundDisplayState(refund);
  if (!state) return null;

  const { icon, tone } = STATE_STYLE[state];
  const toneColor = tone === 'warning' ? theme.warning : tone === 'danger' ? theme.danger : theme.success;

  const handleContactReception = () => {
    const code = getBookingCode(bookingId);
    router.push({
      pathname: '/reception-chat',
      params: { prefill: t('booking.refundContactPrefill', { code }) },
    });
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <ThemedText type="bodyBold">{t('booking.refundTitle')}</ThemedText>
        <View style={styles.badge}>
          <Ionicons name={icon} size={14} color={toneColor} />
          <ThemedText
            type="caption"
            style={{ color: toneColor }}
            accessibilityLabel={t(`booking.refundState.${state}`)}
          >
            {t(`booking.refundState.${state}`)}
          </ThemedText>
        </View>
      </View>

      <ThemedText
        type="heading"
        accessibilityLabel={t('booking.refundAmountAccessibility', {
          amount: formatVND(refund.amount),
          percent: refund.refundPercent,
        })}
      >
        {formatVND(refund.amount)}
        <ThemedText type="small" themeColor="textSecondary">
          {' '}
          ({refund.refundPercent}%)
        </ThemedText>
      </ThemedText>

      <Timeline state={state} />

      {state === 'rejected' && refund.adminNote ? (
        <ThemedText type="small" themeColor="textSecondary">
          {t('booking.refundRejectedReason', { reason: refund.adminNote })}
        </ThemedText>
      ) : null}

      {state === 'completed' ? (
        <>
          {refund.proofImageUrl ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('booking.refundProofAccessibility')}
              onPress={() => setViewerVisible(true)}
              style={[styles.proofThumb, { backgroundColor: theme.backgroundSelected }]}
            >
              <Image source={{ uri: refund.proofImageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
            </Pressable>
          ) : null}
          {refund.adminNote ? (
            <ThemedText type="small" themeColor="textSecondary">
              {refund.adminNote}
            </ThemedText>
          ) : null}
        </>
      ) : null}

      {state === 'overdue' ? (
        <Button
          label={t('booking.refundContactReception')}
          icon="chatbubble-ellipses-outline"
          variant="outline"
          onPress={handleContactReception}
        />
      ) : null}

      {state === 'pending' ? (
        <View style={styles.hintRow}>
          <Ionicons name="information-circle-outline" size={16} color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.flexShrink}>
            {t('booking.refundQrHint')}
          </ThemedText>
        </View>
      ) : null}
      {state === 'pending' ? (
        <Button
          label={t('booking.refundOpenChat')}
          icon="chatbubble-ellipses-outline"
          variant="outline"
          onPress={() => router.push('/reception-chat')}
        />
      ) : null}

      {refund.proofImageUrl ? (
        <ProofImageViewer uri={refund.proofImageUrl} visible={viewerVisible} onClose={() => setViewerVisible(false)} />
      ) : null}
    </Card>
  );
}

function Timeline({ state }: { state: 'pending' | 'overdue' | 'completed' | 'rejected' }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const secondStepDone = state === 'completed' || state === 'rejected';
  const secondLabel =
    state === 'completed'
      ? t('booking.refundTimelineCompleted')
      : state === 'rejected'
        ? t('booking.refundTimelineRejected')
        : t('booking.refundTimelineProcessing');
  const secondColor = state === 'completed' ? theme.success : state === 'rejected' ? theme.danger : theme.textSecondary;

  return (
    <View style={styles.timeline}>
      <View style={styles.timelineStep}>
        <View style={[styles.timelineDot, { backgroundColor: theme.primary }]} />
        <ThemedText type="small">{t('booking.refundTimelineCreated')}</ThemedText>
      </View>
      <View style={[styles.timelineLine, { backgroundColor: secondStepDone ? secondColor : theme.border }]} />
      <View style={styles.timelineStep}>
        <View style={[styles.timelineDot, { backgroundColor: secondStepDone ? secondColor : theme.border }]} />
        <ThemedText type="small" style={{ color: secondStepDone ? secondColor : theme.textSecondary }}>
          {secondLabel}
        </ThemedText>
      </View>
    </View>
  );
}

function ProofImageViewer({ uri, visible, onClose }: { uri: string; visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.viewer}>
        <ScrollView
          style={{ width, height }}
          maximumZoomScale={3}
          centerContent
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={{ uri }}
            style={{ width, height }}
            contentFit="contain"
            accessibilityLabel={t('booking.refundProofAccessibility')}
          />
        </ScrollView>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={onClose}
          hitSlop={12}
          style={styles.viewerClose}
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: { gap: Space.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.sm },
  badge: { flexDirection: 'row', alignItems: 'center', gap: Space.xs },
  flexShrink: { flexShrink: 1 },
  timeline: { flexDirection: 'row', alignItems: 'center' },
  timelineStep: { flexDirection: 'row', alignItems: 'center', gap: Space.xs },
  timelineDot: { width: 8, height: 8, borderRadius: 4 },
  timelineLine: { flex: 1, height: 2, marginHorizontal: Space.sm },
  proofThumb: { height: 160, borderRadius: Radius.md, overflow: 'hidden' },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  viewer: { flex: 1, backgroundColor: '#000000' },
  viewerClose: { position: 'absolute', top: 48, right: Space.lg },
});
