import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { bookingsApi } from '@/api/bookings';
import { getApiErrorMessage } from '@/api/client';
import { paymentsApi } from '@/api/payments';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { ErrorView } from '@/components/ui/ErrorView';
import { LoadingView } from '@/components/ui/LoadingView';
import { Screen } from '@/components/ui/Screen';
import { Spacing } from '@/constants/theme';
import { CreatePaymentLinkResponse, PaymentStatus } from '@/types/payment';
import { formatVND } from '@/utils/currency';

const POLL_INTERVAL_MS = 4000;

export default function CheckoutScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [payment, setPayment] = useState<CreatePaymentLinkResponse | null>(null);
  const [status, setStatus] = useState<PaymentStatus>('PENDING');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        const booking = await bookingsApi.detail(bookingId);
        const bookingAmount = booking.totalAmount ?? 0;
        if (cancelled) return;
        setAmount(bookingAmount);

        const link = await paymentsApi.createLink({ bookingId, amount: bookingAmount });
        if (cancelled) return;
        setPayment(link);
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
    if (!payment) return;

    pollRef.current = setInterval(async () => {
      try {
        const result = await paymentsApi.status(bookingId);
        setStatus(result.status);
        if (result.status !== 'PENDING' && pollRef.current) {
          clearInterval(pollRef.current);
        }
      } catch {
        // ignore transient polling errors
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [payment, bookingId]);

  if (loading) return <LoadingView />;
  if (error || !payment) return <ErrorView message={error ?? 'Không thể tạo link thanh toán.'} />;

  if (status === 'PAID') {
    return (
      <Screen contentContainerStyle={styles.centerContent}>
        <ThemedText type="title" style={styles.successTitle}>
          Thanh toán thành công 🎉
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centerText}>
          Đơn đặt phòng của bạn đã được xác nhận.
        </ThemedText>
        <Button label="Xem đơn đặt phòng" onPress={() => router.replace(`/booking/${bookingId}`)} />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <ThemedText type="title" style={styles.title}>
        Quét mã để thanh toán
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.centerText}>
        Số tiền cần thanh toán
      </ThemedText>
      <ThemedText type="title" themeColor="primary" style={styles.amount}>
        {formatVND(amount)}
      </ThemedText>

      <ThemedView type="backgroundElement" style={styles.qrCard}>
        <Image source={{ uri: payment.qrCode }} style={styles.qrImage} contentFit="contain" />
      </ThemedView>

      <View style={styles.statusRow}>
        {status === 'FAILED' ? (
          <ThemedText themeColor="danger">Thanh toán thất bại, vui lòng thử lại.</ThemedText>
        ) : (
          <ThemedText themeColor="textSecondary">Đang chờ xác nhận thanh toán…</ThemedText>
        )}
      </View>

      <Button label="Mở trang thanh toán" variant="outline" onPress={() => WebBrowser.openBrowserAsync(payment.checkoutUrl)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.four },
  centerContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
  title: { fontSize: 22, lineHeight: 28, textAlign: 'center' },
  successTitle: { fontSize: 24, lineHeight: 30, textAlign: 'center' },
  centerText: { textAlign: 'center' },
  amount: { fontSize: 28 },
  qrCard: { padding: Spacing.three, borderRadius: Spacing.three, marginVertical: Spacing.three },
  qrImage: { width: 220, height: 220 },
  statusRow: { marginBottom: Spacing.two },
});
