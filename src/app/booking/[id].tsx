import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { bookingsApi } from '@/api/bookings';
import { getApiErrorMessage } from '@/api/client';
import { reviewsApi } from '@/api/reviews';
import { roomImageSource } from '@/components/RoomTypeCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorView } from '@/components/ui/ErrorView';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TextField } from '@/components/ui/TextField';
import { FontFamily, MaxContentWidth, MinTouch, Radius, Space } from '@/constants/theme';
import { useApi } from '@/hooks/useApi';
import { useTheme } from '@/hooks/use-theme';
import { formatVND } from '@/utils/currency';
import { formatDate, nightsBetween } from '@/utils/date';

const CANCELLABLE_STATUSES = new Set(['PENDING', 'CONFIRMED']);
const RATING_LABELS = ['', 'Tệ', 'Chưa tốt', 'Bình thường', 'Tốt', 'Tuyệt vời'];

type IconName = keyof typeof Ionicons.glyphMap;

export default function BookingDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const fetchBooking = useCallback(() => bookingsApi.detail(id), [id]);
  // Staff confirm / check-in from the admin side, so reload whenever the screen is shown again.
  const { data: booking, loading, error, refetch, refreshing, refresh } = useApi(fetchBooking, { refetchOnFocus: true });

  const [cancelling, setCancelling] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (loading) {
    return (
      <ThemedView style={styles.skeleton}>
        <Skeleton height={180} radius={Radius.lg} />
        <Skeleton height={110} radius={Radius.lg} />
        <Skeleton height={160} radius={Radius.lg} />
      </ThemedView>
    );
  }
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

  const image = roomImageSource(booking.roomType);
  const nights = nightsBetween(booking.checkInDate, booking.checkOutDate);
  const isPaid = booking.paymentStatus === 'PAID';
  const needsPayment = booking.paymentMethod === 'PAYOS' && booking.paymentStatus === 'UNPAID' && booking.status !== 'CANCELLED';

  const priceLines: { label: string; value: number; tone?: 'success' }[] = [
    { label: `Tiền phòng (${nights} đêm)`, value: booking.roomAmount },
    ...(booking.serviceAmount > 0 ? [{ label: 'Dịch vụ', value: booking.serviceAmount }] : []),
    ...(booking.lateCheckoutFee > 0 ? [{ label: 'Phí trả phòng muộn', value: booking.lateCheckoutFee }] : []),
    ...(booking.discountAmount > 0 ? [{ label: 'Giảm giá', value: -booking.discountAmount, tone: 'success' as const }] : []),
    ...(booking.vatAmount > 0 ? [{ label: 'VAT', value: booking.vatAmount }] : []),
  ];

  return (
    <ThemedView style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.content}
        automaticallyAdjustKeyboardInsets
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} colors={[theme.primary]} />
        }>
        <View style={[styles.hero, { backgroundColor: theme.backgroundSelected }]}>
          {image ? <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.72)']}
            locations={[0.3, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.heroContent}>
            <View style={[styles.heroBadge, { backgroundColor: theme.backgroundElement }]}>
              <StatusBadge status={booking.status} />
            </View>
            <ThemedText type="title" style={styles.onImage} numberOfLines={2}>
              {booking.roomType.name}
            </ThemedText>
            <ThemedText type="caption" style={styles.onImageMuted}>
              Mã đơn #{booking.bookingId.slice(0, 8).toUpperCase()}
              {booking.room ? ` · Phòng ${booking.room.roomNumber}` : ''}
            </ThemedText>
          </View>
        </View>

        <Card style={styles.stay}>
          <View style={styles.stayCol}>
            <ThemedText type="caption" themeColor="textSecondary">
              Nhận phòng
            </ThemedText>
            <ThemedText type="heading">{formatDate(booking.checkInDate, 'DD/MM')}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {formatDate(booking.checkInDate, 'YYYY')}
            </ThemedText>
          </View>
          <View style={styles.stayMiddle}>
            <View style={[styles.stayLine, { backgroundColor: theme.border }]} />
            <View style={[styles.nightsPill, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="moon" size={12} color={theme.primary} />
              <ThemedText type="caption" themeColor="primary">
                {nights} đêm
              </ThemedText>
            </View>
            <View style={[styles.stayLine, { backgroundColor: theme.border }]} />
          </View>
          <View style={[styles.stayCol, styles.alignEnd]}>
            <ThemedText type="caption" themeColor="textSecondary">
              Trả phòng
            </ThemedText>
            <ThemedText type="heading">{formatDate(booking.checkOutDate, 'DD/MM')}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {formatDate(booking.checkOutDate, 'YYYY')}
            </ThemedText>
          </View>
        </Card>

        <Card style={styles.section}>
          <ThemedText type="bodyBold">Thông tin khách</ThemedText>
          <InfoRow icon="person-outline" label="Họ tên" value={booking.guestInfo.fullName} />
          <InfoRow icon="call-outline" label="Điện thoại" value={booking.guestInfo.phone} />
          <InfoRow
            icon={booking.paymentMethod === 'PAYOS' ? 'qr-code-outline' : 'cash-outline'}
            label="Thanh toán"
            value={
              booking.paymentMethod === 'PAYOS'
                ? `PayOS · ${isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}`
                : `Tiền mặt · ${isPaid ? 'Đã thanh toán' : 'Thanh toán tại khách sạn'}`
            }
          />
        </Card>

        {booking.serviceItems.length > 0 ? (
          <Card style={styles.section}>
            <ThemedText type="bodyBold">Dịch vụ đã dùng</ThemedText>
            {booking.serviceItems.map((item) => (
              <View key={item.bookingServiceId} style={styles.lineRow}>
                <ThemedText type="small" style={styles.flexShrink}>
                  {item.service.name} × {item.quantity}
                </ThemedText>
                <ThemedText type="small">{formatVND(item.unitPrice * item.quantity)}</ThemedText>
              </View>
            ))}
          </Card>
        ) : null}

        <Card style={styles.section}>
          <ThemedText type="bodyBold">Chi tiết giá</ThemedText>
          {priceLines.map((line) => (
            <View key={line.label} style={styles.lineRow}>
              <ThemedText type="small" themeColor={line.tone ?? 'textSecondary'}>
                {line.label}
              </ThemedText>
              <ThemedText type="small" themeColor={line.tone}>
                {line.value < 0 ? `-${formatVND(-line.value)}` : formatVND(line.value)}
              </ThemedText>
            </View>
          ))}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.lineRow}>
            <ThemedText type="bodyBold">Tổng cộng</ThemedText>
            <ThemedText style={[styles.total, { color: theme.primary }]}>{formatVND(booking.totalAmount)}</ThemedText>
          </View>
          {booking.paidAmount > 0 && booking.dueAmount > 0 ? (
            <>
              <View style={styles.lineRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  Đã thanh toán
                </ThemedText>
                <ThemedText type="small">{formatVND(booking.paidAmount)}</ThemedText>
              </View>
              <View style={styles.lineRow}>
                <ThemedText type="smallBold">Còn lại</ThemedText>
                <ThemedText type="smallBold">{formatVND(booking.dueAmount)}</ThemedText>
              </View>
            </>
          ) : null}
        </Card>

        {actionError ? (
          <View style={[styles.errorBox, { backgroundColor: `${theme.danger}14` }]}>
            <Ionicons name="alert-circle" size={18} color={theme.danger} />
            <ThemedText type="small" themeColor="danger" style={styles.flexShrink}>
              {actionError}
            </ThemedText>
          </View>
        ) : null}

        {needsPayment || CANCELLABLE_STATUSES.has(booking.status) ? (
          <View style={styles.actions}>
            {needsPayment ? (
              <Button
                label="Thanh toán ngay"
                icon="qr-code-outline"
                onPress={() => router.push(`/checkout/${booking.bookingId}`)}
              />
            ) : null}
            {CANCELLABLE_STATUSES.has(booking.status) ? (
              <Button label="Huỷ đơn" variant="outline" onPress={handleCancel} loading={cancelling} />
            ) : null}
          </View>
        ) : null}

        {booking.status === 'CHECKED_OUT' && !reviewDone ? (
          <Card style={styles.section}>
            <View style={styles.reviewHeader}>
              <ThemedText type="heading">Kỳ nghỉ của bạn thế nào?</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Đánh giá giúp Vika Hotel phục vụ bạn tốt hơn.
              </ThemedText>
            </View>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityLabel={`${value} sao`}
                  accessibilityState={{ selected: value === rating }}
                  onPress={() => setRating(value)}
                  style={styles.starButton}>
                  <Ionicons name={value <= rating ? 'star' : 'star-outline'} size={32} color={theme.accent} />
                </Pressable>
              ))}
            </View>
            <ThemedText type="smallBold" themeColor="accentText" style={styles.center}>
              {RATING_LABELS[rating]}
            </ThemedText>
            <TextField placeholder="Chia sẻ trải nghiệm của bạn..." value={comment} onChangeText={setComment} multiline />
            <Button label="Gửi đánh giá" onPress={handleSubmitReview} loading={reviewSubmitting} />
          </Card>
        ) : null}

        {reviewDone ? (
          <Card style={[styles.thanks, { backgroundColor: theme.primarySoft }]} elevation="none">
            <Ionicons name="heart" size={20} color={theme.primary} />
            <ThemedText type="smallBold" themeColor="primary">
              Cảm ơn bạn đã đánh giá!
            </ThemedText>
          </Card>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

function InfoRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: theme.backgroundSelected }]}>
        <Ionicons name={icon} size={16} color={theme.textSecondary} />
      </View>
      <View style={styles.flexShrink}>
        <ThemedText type="caption" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText type="small">{value}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  center: { textAlign: 'center' },
  skeleton: { flex: 1, padding: Space.lg, gap: Space.lg },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Space.lg,
    gap: Space.lg,
    paddingBottom: Space['4xl'],
  },
  hero: { height: 190, borderRadius: Radius.xl, overflow: 'hidden', justifyContent: 'flex-end' },
  heroContent: { padding: Space.lg, gap: Space.xs },
  heroBadge: { alignSelf: 'flex-start', borderRadius: Radius.full, marginBottom: Space.xs },
  onImage: { color: '#FFFFFF' },
  onImageMuted: { color: 'rgba(255,255,255,0.9)' },
  stay: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  stayCol: { gap: 2 },
  alignEnd: { alignItems: 'flex-end' },
  stayMiddle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Space.xs },
  stayLine: { flex: 1, height: 1 },
  nightsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    paddingHorizontal: Space.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  section: { gap: Space.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  infoIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Space.sm },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Space.xs },
  total: { fontFamily: FontFamily.bold, fontSize: 18, lineHeight: 24 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: Space.sm, padding: Space.md, borderRadius: Radius.md },
  actions: { gap: Space.md },
  reviewHeader: { gap: Space.xs },
  ratingRow: { flexDirection: 'row', justifyContent: 'center', gap: Space.xs },
  starButton: { width: MinTouch + 4, height: MinTouch + 4, alignItems: 'center', justifyContent: 'center' },
  thanks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Space.sm },
});
