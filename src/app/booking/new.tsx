import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { bookingsApi } from '@/api/bookings';
import { getApiErrorMessage } from '@/api/client';
import { promotionsApi } from '@/api/promotions';
import { roomTypesApi } from '@/api/roomTypes';
import { servicesApi } from '@/api/services';
import { roomImageSource } from '@/components/RoomTypeCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomBar } from '@/components/ui/BottomBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorView } from '@/components/ui/ErrorView';
import { Skeleton } from '@/components/ui/Skeleton';
import { TextField } from '@/components/ui/TextField';
import { FontFamily, MaxContentWidth, MinTouch, Radius, Space } from '@/constants/theme';
import { useApi } from '@/hooks/useApi';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import { formatVND } from '@/utils/currency';
import { formatDate, nightsBetween } from '@/utils/date';

type IconName = keyof typeof Ionicons.glyphMap;

function SectionTitle({ icon, title }: { icon: IconName; title: string }) {
  const theme = useTheme();
  return (
    <View style={styles.sectionTitle}>
      <Ionicons name={icon} size={18} color={theme.primary} />
      <ThemedText type="bodyBold">{title}</ThemedText>
    </View>
  );
}

export default function NewBookingScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const params = useLocalSearchParams<{ roomTypeId: string; checkIn: string; checkOut: string; guests: string }>();

  const fetchRoomType = useCallback(() => roomTypesApi.detail(params.roomTypeId), [params.roomTypeId]);
  const roomType = useApi(fetchRoomType);

  const fetchServices = useCallback(() => servicesApi.list(), []);
  const services = useApi(fetchServices);

  // Prefilled from the signed-in account; the guest can still edit them.
  const user = useAuthStore((s) => s.user);
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'PAYOS'>('CASH');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nights = useMemo(() => nightsBetween(params.checkIn, params.checkOut), [params.checkIn, params.checkOut]);

  const servicesTotal = useMemo(() => {
    if (!services.data) return 0;
    return services.data
      .filter((s) => selectedServiceIds.includes(s.serviceId))
      .reduce((sum, s) => sum + s.price, 0);
  }, [services.data, selectedServiceIds]);

  const roomTotal = (roomType.data?.basePrice ?? 0) * nights;
  const grandTotal = Math.max(0, roomTotal + servicesTotal - discountAmount);

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return;
    setValidatingPromo(true);
    setPromoMessage(null);
    try {
      const result = await promotionsApi.validate(promoCode.trim(), {
        roomTypeId: params.roomTypeId,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        serviceAmount: servicesTotal,
      });
      if (result.valid) {
        setDiscountAmount(result.discountAmount);
        setPromoMessage(t('booking.promoApplied', { amount: formatVND(result.discountAmount) }));
      } else {
        setDiscountAmount(0);
        setPromoMessage(t('booking.promoInvalid'));
      }
    } catch (error) {
      setDiscountAmount(0);
      setPromoMessage(getApiErrorMessage(error, t('booking.promoInvalid')));
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!fullName.trim() || !phone.trim()) {
      setSubmitError(t('booking.requireFullNamePhone'));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSubmitting(true);
    try {
      const booking = await bookingsApi.create({
        roomTypeId: params.roomTypeId,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        guestInfo: {
          fullName: fullName.trim(),
          phone: phone.trim(),
        },
        extraServiceIds: selectedServiceIds,
        promotionCode: discountAmount > 0 ? promoCode.trim() : undefined,
        paymentMethod,
      });
      if (paymentMethod === 'PAYOS') {
        router.replace(`/checkout/${booking.bookingId}`);
      } else {
        router.replace(`/booking/${booking.bookingId}`);
      }
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, t('booking.createFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  if (roomType.loading) {
    return (
      <ThemedView style={styles.skeleton}>
        <Skeleton height={96} radius={Radius.lg} />
        <Skeleton height={180} radius={Radius.lg} />
        <Skeleton height={140} radius={Radius.lg} />
      </ThemedView>
    );
  }
  if (roomType.error || !roomType.data) {
    return <ErrorView message={roomType.error ?? t('room.notFound')} onRetry={roomType.refetch} />;
  }

  const image = roomImageSource(roomType.data);
  const paymentOptions: { key: 'CASH' | 'PAYOS'; icon: IconName; title: string; description: string }[] = [
    { key: 'CASH', icon: 'cash-outline', title: t('booking.paymentCash'), description: t('booking.paymentCashDescription') },
    {
      key: 'PAYOS',
      icon: 'qr-code-outline',
      title: t('booking.paymentPayos'),
      description: t('booking.paymentPayosDescription'),
    },
  ];

  return (
    <ThemedView style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(220)} style={styles.contentInner}>
          <Card style={styles.summary}>
            <View style={[styles.thumb, { backgroundColor: theme.backgroundSelected }]}>
              {image ? <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
            </View>
            <View style={styles.summaryInfo}>
              <ThemedText type="bodyBold" numberOfLines={1}>
                {roomType.data.name}
              </ThemedText>
              <View style={styles.inline}>
                <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary">
                  {t('booking.summaryDate', {
                    checkIn: formatDate(params.checkIn, 'DD/MM'),
                    checkOut: formatDate(params.checkOut, 'DD/MM/YYYY'),
                  })}
                </ThemedText>
              </View>
              <View style={styles.inline}>
                <Ionicons name="moon-outline" size={14} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary">
                  {t('booking.summaryNightsGuests', { nights, guests: params.guests })}
                </ThemedText>
              </View>
            </View>
          </Card>

          <Card style={styles.section}>
            <SectionTitle icon="person-outline" title={t('booking.guestInfo')} />
            <TextField
              label={t('booking.fullNameLabel')}
              leftIcon="person-outline"
              placeholder={t('booking.fullNamePlaceholder')}
              textContentType="name"
              value={fullName}
              onChangeText={setFullName}
            />
            <TextField
              label={t('booking.phoneLabel')}
              leftIcon="call-outline"
              placeholder={t('booking.phonePlaceholder')}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              value={phone}
              onChangeText={setPhone}
            />
          </Card>

          {services.data && services.data.length > 0 ? (
            <Card style={styles.section}>
              <SectionTitle icon="sparkles-outline" title={t('booking.extraServices')} />
              {services.data.map((service) => {
                const selected = selectedServiceIds.includes(service.serviceId);
                return (
                  <Pressable
                    key={service.serviceId}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    onPress={() => toggleService(service.serviceId)}
                    style={({ pressed }) => [
                      styles.option,
                      {
                        borderColor: selected ? theme.primary : theme.border,
                        backgroundColor: selected ? theme.primarySoft : theme.backgroundElement,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}>
                    <View style={styles.optionText}>
                      <ThemedText type="smallBold">{service.name}</ThemedText>
                      <ThemedText type="caption" themeColor="textSecondary">
                        {formatVND(service.price)} / {service.unit}
                      </ThemedText>
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: selected ? theme.primary : theme.textSecondary,
                          backgroundColor: selected ? theme.primary : 'transparent',
                        },
                      ]}>
                      {selected ? <Ionicons name="checkmark" size={16} color={theme.primaryText} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </Card>
          ) : null}

          <Card style={styles.section}>
            <SectionTitle icon="pricetag-outline" title={t('booking.promoCode')} />
            <View style={styles.promoRow}>
              <View style={styles.promoInput}>
                <TextField
                  placeholder={t('booking.promoPlaceholder')}
                  leftIcon="ticket-outline"
                  autoCapitalize="characters"
                  value={promoCode}
                  onChangeText={setPromoCode}
                />
              </View>
              <Button
                label={t('booking.promoApply')}
                variant="secondary"
                fullWidth={false}
                onPress={handleValidatePromo}
                loading={validatingPromo}
                disabled={!promoCode.trim()}
              />
            </View>
            {promoMessage ? (
              <View style={styles.inline}>
                <Ionicons
                  name={discountAmount > 0 ? 'checkmark-circle' : 'alert-circle'}
                  size={16}
                  color={discountAmount > 0 ? theme.success : theme.danger}
                />
                <ThemedText type="small" themeColor={discountAmount > 0 ? 'success' : 'danger'} style={styles.flexShrink}>
                  {promoMessage}
                </ThemedText>
              </View>
            ) : null}
          </Card>

          <Card style={styles.section}>
            <SectionTitle icon="wallet-outline" title={t('booking.paymentMethod')} />
            {paymentOptions.map((option) => {
              const selected = paymentMethod === option.key;
              return (
                <Pressable
                  key={option.key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setPaymentMethod(option.key)}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      borderColor: selected ? theme.primary : theme.border,
                      backgroundColor: selected ? theme.primarySoft : theme.backgroundElement,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}>
                  <View style={[styles.optionIcon, { backgroundColor: theme.backgroundElement }]}>
                    <Ionicons name={option.icon} size={20} color={theme.primary} />
                  </View>
                  <View style={styles.optionText}>
                    <ThemedText type="smallBold">{option.title}</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {option.description}
                    </ThemedText>
                  </View>
                  <View style={[styles.radio, { borderColor: selected ? theme.primary : theme.textSecondary }]}>
                    {selected ? <View style={[styles.radioDot, { backgroundColor: theme.primary }]} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </Card>

          <Card style={styles.section}>
            <SectionTitle icon="receipt-outline" title={t('booking.priceDetails')} />
            <View style={styles.priceRow}>
              <ThemedText type="small" themeColor="textSecondary">
                {t('booking.roomPriceRow', { price: formatVND(roomType.data.basePrice), nights })}
              </ThemedText>
              <ThemedText type="small">{formatVND(roomTotal)}</ThemedText>
            </View>
            {servicesTotal > 0 ? (
              <View style={styles.priceRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('booking.services')}
                </ThemedText>
                <ThemedText type="small">{formatVND(servicesTotal)}</ThemedText>
              </View>
            ) : null}
            {discountAmount > 0 ? (
              <View style={styles.priceRow}>
                <ThemedText type="small" themeColor="success">
                  {t('booking.discount')}
                </ThemedText>
                <ThemedText type="small" themeColor="success">
                  -{formatVND(discountAmount)}
                </ThemedText>
              </View>
            ) : null}
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.priceRow}>
              <ThemedText type="bodyBold">{t('booking.total')}</ThemedText>
              <ThemedText style={[styles.total, { color: theme.primary }]}>{formatVND(grandTotal)}</ThemedText>
            </View>
          </Card>

          {submitError ? (
            <View style={[styles.errorBox, { backgroundColor: `${theme.danger}14` }]}>
              <Ionicons name="alert-circle" size={18} color={theme.danger} />
              <ThemedText type="small" themeColor="danger" style={styles.flexShrink}>
                {submitError}
              </ThemedText>
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>

      <BottomBar>
        <View style={styles.flex}>
          <ThemedText type="caption" themeColor="textSecondary">
            {t('booking.totalToPay')}
          </ThemedText>
          <ThemedText style={[styles.total, { color: theme.primary }]}>{formatVND(grandTotal)}</ThemedText>
        </View>
        <Button label={t('booking.confirmButton')} fullWidth={false} onPress={handleSubmit} loading={submitting} />
      </BottomBar>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  skeleton: { flex: 1, padding: Space.lg, gap: Space.lg },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  contentInner: {
    padding: Space.lg,
    gap: Space.lg,
    paddingBottom: Space['2xl'],
  },
  summary: { flexDirection: 'row', gap: Space.md, alignItems: 'center' },
  thumb: { width: 76, height: 76, borderRadius: Radius.md, overflow: 'hidden' },
  summaryInfo: { flex: 1, gap: Space.xs },
  inline: { flexDirection: 'row', alignItems: 'center', gap: Space.xs },
  section: { gap: Space.md },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    minHeight: MinTouch + Space.lg,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
  },
  optionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1, gap: 2 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  promoRow: { flexDirection: 'row', gap: Space.sm, alignItems: 'center' },
  promoInput: { flex: 1 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Space.sm },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Space.xs },
  total: { fontFamily: FontFamily.bold, fontSize: 18, lineHeight: 24 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    padding: Space.md,
    borderRadius: Radius.md,
  },
});
