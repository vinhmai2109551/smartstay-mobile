import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { bookingsApi } from '@/api/bookings';
import { getApiErrorMessage } from '@/api/client';
import { reviewsApi } from '@/api/reviews';
import { ReviewCard } from '@/components/ReviewCard';
import { StarRatingInput } from '@/components/StarRatingInput';
import { roomImageSource } from '@/components/RoomTypeCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ErrorView } from '@/components/ui/ErrorView';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TextField } from '@/components/ui/TextField';
import { FontFamily, MaxContentWidth, Radius, Space } from '@/constants/theme';
import { useApi } from '@/hooks/useApi';
import { useTheme } from '@/hooks/use-theme';
import { formatVND } from '@/utils/currency';
import { Review, REVIEW_COMMENT_MAX, REVIEW_COMMENT_MIN } from '@/types/review';
import { formatDate, nightsBetween } from '@/utils/date';

const CANCELLABLE_STATUSES = new Set(['PENDING', 'CONFIRMED']);
const RATING_KEYS = ['', 'reviewRating1', 'reviewRating2', 'reviewRating3', 'reviewRating4', 'reviewRating5'] as const;

type IconName = keyof typeof Ionicons.glyphMap;

export default function BookingDetailScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { id, review: focusReview } = useLocalSearchParams<{ id: string; review?: string }>();
  const fetchBooking = useCallback(() => bookingsApi.detail(id), [id]);
  // Staff confirm / check-in from the admin side, so reload whenever the screen is shown again.
  const { data: booking, loading, error, refetch, refreshing, refresh } = useApi(fetchBooking, { refetchOnFocus: true });
  const fetchMyReviews = useCallback(() => reviewsApi.mine(), []);
  const myReviews = useApi(fetchMyReviews);

  // "Write a review" in the booking list opens this screen with ?review=1 — jump to the form.
  const scrollRef = useRef<ScrollView>(null);
  const [reviewY, setReviewY] = useState<number | null>(null);
  const hasScrolledRef = useRef(false);
  useEffect(() => {
    if (focusReview && reviewY !== null && !hasScrolledRef.current) {
      hasScrolledRef.current = true;
      scrollRef.current?.scrollTo({ y: Math.max(reviewY - Space.lg, 0), animated: true });
    }
  }, [focusReview, reviewY]);

  const onRefresh = () => {
    refresh();
    myReviews.refresh();
  };

  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  // Set right after a successful submit so the card shows without waiting for a refetch.
  const [submittedReview, setSubmittedReview] = useState<Review | null>(null);
  const [justReviewed, setJustReviewed] = useState(false);
  const existingReview = myReviews.data?.find((review) => review.bookingId === id) ?? null;
  const review = submittedReview ?? existingReview;
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
  if (error || !booking) return <ErrorView message={error ?? t('booking.notFound')} onRetry={refetch} />;

  const handleConfirmCancel = async () => {
    setCancelling(true);
    setActionError(null);
    try {
      await bookingsApi.cancel(id, { reason: 'Khách hàng yêu cầu huỷ' });
      setShowCancelConfirm(false);
      refetch();
    } catch (err) {
      setActionError(getApiErrorMessage(err, t('booking.cancelFailed')));
      setShowCancelConfirm(false);
    } finally {
      setCancelling(false);
    }
  };

  const handlePayNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/checkout/${booking.bookingId}`);
  };

  const handleSubmitReview = async () => {
    setReviewSubmitting(true);
    setActionError(null);
    try {
      setSubmittedReview(await reviewsApi.create({ bookingId: id, rating, comment: comment.trim() }));
      setJustReviewed(true);
    } catch (err) {
      setActionError(getApiErrorMessage(err, t('booking.reviewFailed')));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const trimmedLength = comment.trim().length;
  const commentTooShort = trimmedLength < REVIEW_COMMENT_MIN;

  const image = roomImageSource(booking.roomType);
  const nights = nightsBetween(booking.checkInDate, booking.checkOutDate);
  const isPaid = booking.paymentStatus === 'PAID';
  const needsPayment = booking.paymentMethod === 'PAYOS' && booking.paymentStatus === 'UNPAID' && booking.status !== 'CANCELLED';

  const priceLines: { label: string; value: number; tone?: 'success' }[] = [
    { label: t('booking.roomAmountRow', { nights }), value: booking.roomAmount },
    ...(booking.serviceAmount > 0 ? [{ label: t('booking.services'), value: booking.serviceAmount }] : []),
    ...(booking.lateCheckoutFee > 0 ? [{ label: t('booking.lateCheckoutFee'), value: booking.lateCheckoutFee }] : []),
    ...(booking.discountAmount > 0
      ? [{ label: t('booking.discount'), value: -booking.discountAmount, tone: 'success' as const }]
      : []),
    ...(booking.vatAmount > 0 ? [{ label: t('booking.vat'), value: booking.vatAmount }] : []),
  ];

  const orderCode = booking.bookingId.slice(0, 8).toUpperCase();

  return (
    <ThemedView style={styles.flex}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        automaticallyAdjustKeyboardInsets
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />
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
              {booking.room
                ? t('booking.orderCodeWithRoom', { code: orderCode, room: booking.room.roomNumber })
                : t('booking.orderCode', { code: orderCode })}
            </ThemedText>
          </View>
        </View>

        <Card style={styles.stay}>
          <View style={styles.stayCol}>
            <ThemedText type="caption" themeColor="textSecondary">
              {t('room.checkIn')}
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
                {t('common.night', { count: nights })}
              </ThemedText>
            </View>
            <View style={[styles.stayLine, { backgroundColor: theme.border }]} />
          </View>
          <View style={[styles.stayCol, styles.alignEnd]}>
            <ThemedText type="caption" themeColor="textSecondary">
              {t('room.checkOut')}
            </ThemedText>
            <ThemedText type="heading">{formatDate(booking.checkOutDate, 'DD/MM')}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {formatDate(booking.checkOutDate, 'YYYY')}
            </ThemedText>
          </View>
        </Card>

        <Card style={styles.section}>
          <ThemedText type="bodyBold">{t('booking.guestInfo')}</ThemedText>
          <InfoRow icon="person-outline" label={t('booking.fullName')} value={booking.guestInfo.fullName} />
          <InfoRow icon="call-outline" label={t('booking.phone')} value={booking.guestInfo.phone} />
          <InfoRow
            icon={booking.paymentMethod === 'PAYOS' ? 'qr-code-outline' : 'cash-outline'}
            label={t('booking.paymentInfo')}
            value={
              booking.paymentMethod === 'PAYOS'
                ? isPaid
                  ? t('booking.paymentPayosPaid')
                  : t('booking.paymentPayosUnpaid')
                : isPaid
                  ? t('booking.paymentCashPaid')
                  : t('booking.paymentCashUnpaid')
            }
          />
        </Card>

        {booking.serviceItems.length > 0 ? (
          <Card style={styles.section}>
            <ThemedText type="bodyBold">{t('booking.servicesUsed')}</ThemedText>
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
          <ThemedText type="bodyBold">{t('booking.priceDetails')}</ThemedText>
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
            <ThemedText type="bodyBold">{t('booking.total')}</ThemedText>
            <ThemedText style={[styles.total, { color: theme.primary }]}>{formatVND(booking.totalAmount)}</ThemedText>
          </View>
          {booking.paidAmount > 0 && booking.dueAmount > 0 ? (
            <>
              <View style={styles.lineRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('booking.paidAmount')}
                </ThemedText>
                <ThemedText type="small">{formatVND(booking.paidAmount)}</ThemedText>
              </View>
              <View style={styles.lineRow}>
                <ThemedText type="smallBold">{t('booking.dueAmount')}</ThemedText>
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
              <Button label={t('booking.payNow')} icon="qr-code-outline" onPress={handlePayNow} />
            ) : null}
            {CANCELLABLE_STATUSES.has(booking.status) ? (
              <Button label={t('booking.cancelBooking')} variant="outline" onPress={() => setShowCancelConfirm(true)} />
            ) : null}
          </View>
        ) : null}

        {booking.status === 'CHECKED_OUT' ? (
          <View style={styles.reviewBlock} onLayout={(e) => setReviewY(e.nativeEvent.layout.y)}>
            {review ? (
              <>
                {justReviewed ? (
                  <Card style={[styles.thanks, { backgroundColor: theme.primarySoft }]} elevation="none">
                    <Ionicons name="heart" size={20} color={theme.primary} />
                    <ThemedText type="smallBold" themeColor="primary">
                      {t('booking.reviewThanks')}
                    </ThemedText>
                  </Card>
                ) : null}
                <ThemedText type="heading">{t('booking.reviewYours')}</ThemedText>
                <ReviewCard review={review} />
              </>
            ) : myReviews.loading ? (
              <Skeleton height={140} radius={Radius.lg} />
            ) : (
              <Card style={styles.section}>
                <View style={styles.reviewHeader}>
                  <ThemedText type="heading">{t('booking.reviewTitle')}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('booking.reviewSubtitle')}
                  </ThemedText>
                </View>
                <StarRatingInput
                  value={rating}
                  onChange={setRating}
                  accessibilityLabel={t('booking.reviewRatingLabel')}
                />
                <ThemedText type="smallBold" themeColor="accentText" style={styles.center}>
                  {/* Half stars share the label of the whole star they round up to (4.5 → "Tuyệt vời"). */}
                  {rating.toFixed(1)} · {t(`booking.${RATING_KEYS[Math.ceil(rating)]}`)}
                </ThemedText>
                <TextField
                  placeholder={t('booking.reviewPlaceholder')}
                  value={comment}
                  onChangeText={setComment}
                  maxLength={REVIEW_COMMENT_MAX}
                  multiline
                />
                <ThemedText type="caption" themeColor="textSecondary">
                  {commentTooShort
                    ? t('booking.reviewCommentHint', { min: REVIEW_COMMENT_MIN })
                    : t('booking.reviewCommentCount', { count: trimmedLength, max: REVIEW_COMMENT_MAX })}
                </ThemedText>
                <Button
                  label={t('booking.reviewSubmit')}
                  onPress={handleSubmitReview}
                  loading={reviewSubmitting}
                  disabled={commentTooShort}
                />
              </Card>
            )}
          </View>
        ) : null}
      </ScrollView>

      <ConfirmDialog
        visible={showCancelConfirm}
        title={t('booking.cancelTitle')}
        message={t('booking.cancelMessage')}
        confirmLabel={t('booking.cancelConfirm')}
        cancelLabel={t('booking.cancelDismiss')}
        destructive
        loading={cancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelConfirm(false)}
      />
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
  reviewBlock: { gap: Space.md },
  thanks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Space.sm },
});
