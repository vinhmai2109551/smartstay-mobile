import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { bookingsApi } from '@/api/bookings';
import { getApiErrorMessage } from '@/api/client';
import { reviewsApi } from '@/api/reviews';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { ErrorView } from '@/components/ui/ErrorView';
import { LoadingView } from '@/components/ui/LoadingView';
import { Screen } from '@/components/ui/Screen';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TextField } from '@/components/ui/TextField';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useApi } from '@/hooks/useApi';
import { formatVND } from '@/utils/currency';
import { formatDate } from '@/utils/date';

const CANCELLABLE_STATUSES = new Set(['PENDING', 'CONFIRMED']);

export default function BookingDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const fetchBooking = useCallback(() => bookingsApi.detail(id), [id]);
  const { data: booking, loading, error, refetch } = useApi(fetchBooking);

  const [cancelling, setCancelling] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (loading) return <LoadingView />;
  if (error || !booking) return <ErrorView message={error ?? 'Không tìm thấy đơn đặt phòng.'} onRetry={refetch} />;

  const handleCancel = () => {
    Alert.alert('Huỷ đơn đặt phòng', 'Bạn có chắc muốn huỷ đơn này?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Huỷ đơn',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          setActionError(null);
          try {
            await bookingsApi.cancel(id, { reason: 'Khách hàng yêu cầu huỷ' });
            refetch();
          } catch (err) {
            setActionError(getApiErrorMessage(err, 'Không thể huỷ đơn.'));
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  const handleSubmitReview = async () => {
    setReviewSubmitting(true);
    setActionError(null);
    try {
      await reviewsApi.create({ bookingId: id, rating, comment });
      setReviewDone(true);
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Không thể gửi đánh giá.'));
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <ThemedText type="title" style={styles.title}>
          {booking.roomTypeName ?? 'Đơn đặt phòng'}
        </ThemedText>
        <StatusBadge status={booking.status} />
      </View>

      <ThemedView type="backgroundElement" style={styles.card}>
        <Row icon="calendar-outline" label={`${formatDate(booking.checkIn)} → ${formatDate(booking.checkOut)}`} />
        <Row icon="people-outline" label={`${booking.guestInfo.guests} khách · ${booking.guestInfo.fullName}`} />
        <Row icon="call-outline" label={booking.guestInfo.phone} />
        {booking.totalAmount ? <Row icon="wallet-outline" label={formatVND(booking.totalAmount)} /> : null}
      </ThemedView>

      {booking.services && booking.services.length > 0 ? (
        <View>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Dịch vụ đã dùng
          </ThemedText>
          {booking.services.map((service, index) => (
            <View key={index} style={styles.serviceRow}>
              <ThemedText type="small">
                {service.name ?? service.serviceId} × {service.quantity}
              </ThemedText>
              {service.price ? <ThemedText type="small">{formatVND(service.price * service.quantity)}</ThemedText> : null}
            </View>
          ))}
        </View>
      ) : null}

      {booking.qrCode ? (
        <View style={styles.qrSection}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Mã QR check-in
          </ThemedText>
          <Image
            source={{ uri: booking.qrCode }}
            style={styles.qrImage}
            contentFit="contain"
          />
        </View>
      ) : null}

      {actionError ? (
        <ThemedText type="small" themeColor="danger">
          {actionError}
        </ThemedText>
      ) : null}

      {booking.paymentInfo && booking.paymentInfo.status !== 'PAID' && booking.status !== 'CANCELLED' ? (
        <Button label="Thanh toán ngay" onPress={() => router.push(`/checkout/${booking.id}`)} />
      ) : null}

      {CANCELLABLE_STATUSES.has(booking.status) ? (
        <Button label="Huỷ đơn" variant="outline" onPress={handleCancel} loading={cancelling} />
      ) : null}

      {booking.status === 'COMPLETED' && !reviewDone ? (
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">Đánh giá kỳ nghỉ của bạn</ThemedText>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable key={value} onPress={() => setRating(value)}>
                <Ionicons
                  name={value <= rating ? 'star' : 'star-outline'}
                  size={28}
                  color={theme.warning}
                />
              </Pressable>
            ))}
          </View>
          <TextField placeholder="Chia sẻ trải nghiệm của bạn..." value={comment} onChangeText={setComment} multiline />
          <Button label="Gửi đánh giá" onPress={handleSubmitReview} loading={reviewSubmitting} />
        </ThemedView>
      ) : null}

      {reviewDone ? (
        <ThemedText type="small" themeColor="success">
          Cảm ơn bạn đã đánh giá!
        </ThemedText>
      ) : null}
    </Screen>
  );
}

function Row({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={16} color={theme.textSecondary} />
      <ThemedText type="small">{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing.six, gap: Spacing.three },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  title: { fontSize: 22, lineHeight: 28, flex: 1 },
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  sectionTitle: { marginBottom: Spacing.one, fontSize: 16 },
  serviceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  qrSection: { alignItems: 'center', gap: Spacing.two },
  qrImage: { width: 200, height: 200 },
  ratingRow: { flexDirection: 'row', gap: Spacing.two },
});
