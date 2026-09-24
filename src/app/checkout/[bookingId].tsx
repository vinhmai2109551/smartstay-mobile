import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import QRCode from 'react-native-qrcode-svg';
import { StyleSheet, View } from 'react-native';

import { getApiErrorMessage } from '@/api/client';
import { paymentsApi } from '@/api/payments';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { ErrorView } from '@/components/ui/ErrorView';
import { LoadingView } from '@/components/ui/LoadingView';
import { Screen } from '@/components/ui/Screen';
import { Spacing } from '@/constants/theme';
import { CreatePayosLinkResponse } from '@/types/payment';
import { formatVND } from '@/utils/currency';

const POLL_INTERVAL_MS = 4000;

export default function CheckoutScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [link, setLink] = useState<CreatePayosLinkResponse | null>(null);
  const [paid, setPaid] = useState(false);
  const [expired, setExpired] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  if (loading) return <LoadingView />;
  if (error || !link) return <ErrorView message={error ?? 'Không thể tạo link thanh toán.'} />;

  if (paid) {
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
      {amount != null ? (
        <>
          <ThemedText themeColor="textSecondary" style={styles.centerText}>
            Số tiền cần thanh toán
          </ThemedText>
          <ThemedText type="title" themeColor="primary" style={styles.amount}>
            {formatVND(amount)}
          </ThemedText>
        </>
      ) : null}

      <ThemedView type="backgroundElement" style={styles.qrCard}>
        <QRCode value={link.qrCode} size={220} />
      </ThemedView>

      <View style={styles.statusRow}>
        {expired ? (
          <ThemedText themeColor="danger">Mã QR đã hết hạn, vui lòng quay lại tạo đơn mới.</ThemedText>
        ) : (
          <ThemedText themeColor="textSecondary">Đang chờ xác nhận thanh toán…</ThemedText>
        )}
      </View>

      <Button label="Mở trang thanh toán" variant="outline" onPress={() => WebBrowser.openBrowserAsync(link.checkoutUrl)} />
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
  statusRow: { marginBottom: Spacing.two },
});
