import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { getApiErrorMessage } from '@/api/client';
import { paymentsApi } from '@/api/payments';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorView } from '@/components/ui/ErrorView';
import { Skeleton } from '@/components/ui/Skeleton';
import { FontFamily, MaxContentWidth, Radius, Space } from '@/constants/theme';
import { useShadows, useTheme } from '@/hooks/use-theme';
import { CreatePayosLinkResponse } from '@/types/payment';
import { formatVND } from '@/utils/currency';

const POLL_INTERVAL_MS = 4000;

const STEPS = [
  'Mở ứng dụng ngân hàng hoặc ví điện tử',
  'Chọn quét mã QR và quét mã bên trên',
  'Xác nhận chuyển khoản — đơn sẽ tự cập nhật',
];

export default function CheckoutScreen() {
  const theme = useTheme();
  const shadows = useShadows();
  const { width } = useWindowDimensions();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [link, setLink] = useState<CreatePayosLinkResponse | null>(null);
  const [paid, setPaid] = useState(false);
  const [expired, setExpired] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const qrSize = Math.round(Math.min(Math.min(width, MaxContentWidth) - Space['4xl'] * 2, 260));

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        const created = await paymentsApi.createPayosLink(bookingId);
        if (cancelled) return;
        setLink(created);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể khởi tạo thanh toán.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  useEffect(() => {
    if (!link) return;

    pollRef.current = setInterval(async () => {
      try {
        const booking = await paymentsApi.syncPayosStatus(bookingId);
        setAmount(booking.totalAmount);
        if (booking.paymentStatus === 'PAID') {
          setPaid(true);
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (Date.now() / 1000 > link.expiredAt) {
          setExpired(true);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // ignore transient polling errors
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [link, bookingId]);

  if (loading) {
    return (
      <ThemedView style={styles.loading}>
        <Skeleton width={qrSize + Space['2xl']} height={qrSize + Space['2xl']} radius={Radius.lg} />
        <Skeleton width="60%" height={20} />
      </ThemedView>
    );
  }
  if (error || !link) return <ErrorView message={error ?? 'Không thể tạo link thanh toán.'} />;

  if (paid) {
    return (
      <ThemedView style={styles.success}>
        <Animated.View entering={ZoomIn.springify().damping(14)} style={[styles.successCircle, { backgroundColor: theme.primarySoft }]}>
          <View style={[styles.successInner, { backgroundColor: theme.success }]}>
            <Ionicons name="checkmark" size={44} color="#FFFFFF" />
          </View>
        </Animated.View>
        <View style={styles.successText}>
          <ThemedText type="title" style={styles.center}>
            Thanh toán thành công
          </ThemedText>
          <ThemedText type="body" themeColor="textSecondary" style={styles.center}>
            Đơn đặt phòng của bạn đã được xác nhận. Hẹn gặp bạn tại SmartStay!
          </ThemedText>
        </View>
        <Button label="Xem đơn đặt phòng" onPress={() => router.replace(`/booking/${bookingId}`)} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.center}>
            Quét mã để thanh toán
          </ThemedText>
          {amount != null ? (
            <View style={styles.amountBlock}>
              <ThemedText type="small" themeColor="textSecondary">
                Số tiền cần thanh toán
              </ThemedText>
              <ThemedText style={[styles.amount, { color: theme.primary }]}>{formatVND(amount)}</ThemedText>
            </View>
          ) : null}
        </View>

        {/* QR codes must stay dark-on-white to scan reliably, even in dark mode. */}
        <View style={[styles.qrCard, shadows.floating, expired && styles.qrExpired]}>
          <QRCode value={link.qrCode} size={qrSize} backgroundColor="#FFFFFF" color="#111827" />
          <View style={styles.payosRow}>
            <Ionicons name="shield-checkmark" size={14} color="#047857" />
            <ThemedText type="caption" style={styles.payosText}>
              Thanh toán an toàn qua PayOS
            </ThemedText>
          </View>
        </View>

        <View
          style={[
            styles.statusPill,
            { backgroundColor: expired ? `${theme.danger}14` : theme.primarySoft },
          ]}>
          {expired ? (
            <Ionicons name="time-outline" size={16} color={theme.danger} />
          ) : (
            <ActivityIndicator size="small" color={theme.primary} />
          )}
          <ThemedText type="small" themeColor={expired ? 'danger' : 'primary'} style={styles.flexShrink}>
            {expired ? 'Mã QR đã hết hạn, vui lòng quay lại tạo đơn mới.' : 'Đang chờ xác nhận thanh toán…'}
          </ThemedText>
        </View>

        <Card style={styles.steps}>
          <ThemedText type="bodyBold">Hướng dẫn</ThemedText>
          {STEPS.map((step, index) => (
            <View key={step} style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
                <ThemedText type="caption" style={{ color: theme.primaryText }}>
                  {index + 1}
                </ThemedText>
              </View>
              <ThemedText type="small" style={styles.flexShrink}>
                {step}
              </ThemedText>
            </View>
          ))}
        </Card>

        <Button
          label="Mở trang thanh toán"
          icon="open-outline"
          variant="outline"
          onPress={() => WebBrowser.openBrowserAsync(link.checkoutUrl)}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  center: { textAlign: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Space.xl },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    alignItems: 'stretch',
    padding: Space.lg,
    paddingTop: Space['2xl'],
    gap: Space.xl,
    paddingBottom: Space['4xl'],
  },
  header: { gap: Space.md, alignItems: 'center' },
  amountBlock: { alignItems: 'center', gap: 2 },
  amount: { fontFamily: FontFamily.bold, fontSize: 30, lineHeight: 38 },
  qrCard: {
    alignSelf: 'center',
    alignItems: 'center',
    gap: Space.md,
    padding: Space.lg,
    borderRadius: Radius.lg,
    backgroundColor: '#FFFFFF',
  },
  qrExpired: { opacity: 0.35 },
  payosRow: { flexDirection: 'row', alignItems: 'center', gap: Space.xs },
  payosText: { color: '#374151' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.sm,
    paddingHorizontal: Space.lg,
    paddingVertical: Space.md,
    borderRadius: Radius.full,
  },
  steps: { gap: Space.md },
  step: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  stepNumber: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  success: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space['2xl'],
    padding: Space['2xl'],
  },
  successCircle: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  successInner: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  successText: { gap: Space.sm, maxWidth: 340 },
});
