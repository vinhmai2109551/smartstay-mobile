import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { bookingsApi } from '@/api/bookings';
import { getApiErrorMessage } from '@/api/client';
import { promotionsApi } from '@/api/promotions';
import { roomTypesApi } from '@/api/roomTypes';
import { servicesApi } from '@/api/services';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { ErrorView } from '@/components/ui/ErrorView';
import { LoadingView } from '@/components/ui/LoadingView';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { Spacing } from '@/constants/theme';
import { useApi } from '@/hooks/useApi';
import { useTheme } from '@/hooks/use-theme';
import { formatVND } from '@/utils/currency';
import { nightsBetween } from '@/utils/date';

export default function NewBookingScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ roomTypeId: string; checkIn: string; checkOut: string; guests: string }>();

  const fetchRoomType = useCallback(() => roomTypesApi.detail(params.roomTypeId), [params.roomTypeId]);
  const roomType = useApi(fetchRoomType);

  const fetchServices = useCallback(() => servicesApi.list(), []);
  const services = useApi(fetchServices);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
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
      .filter((s) => selectedServiceIds.includes(s.id))
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
      const result = await promotionsApi.validate(promoCode.trim(), roomTotal + servicesTotal);
      if (result.valid) {
        setDiscountAmount(result.discountAmount);
        setPromoMessage(`Áp dụng thành công, giảm ${formatVND(result.discountAmount)}`);
      } else {
        setDiscountAmount(0);
        setPromoMessage('Mã khuyến mãi không hợp lệ.');
      }
    } catch (error) {
      setDiscountAmount(0);
      setPromoMessage(getApiErrorMessage(error, 'Mã khuyến mãi không hợp lệ.'));
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!fullName.trim() || !phone.trim()) {
      setSubmitError('Vui lòng nhập đầy đủ họ tên và số điện thoại.');
      return;
    }

    setSubmitting(true);
    try {
      const booking = await bookingsApi.create({
        roomTypeId: params.roomTypeId,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        guestInfo: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          guests: Number(params.guests) || 1,
          note: note.trim() || undefined,
        },
        extraServiceIds: selectedServiceIds,
        promotionCode: discountAmount > 0 ? promoCode.trim() : undefined,
      });
      router.replace(`/checkout/${booking.id}`);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Không thể tạo đơn đặt phòng, phòng có thể đã được đặt.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (roomType.loading) return <LoadingView />;
  if (roomType.error || !roomType.data) {
    return <ErrorView message={roomType.error ?? 'Không tìm thấy loại phòng.'} onRetry={roomType.refetch} />;
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <ThemedView type="backgroundElement" style={styles.summaryCard}>
        <ThemedText type="smallBold">{roomType.data.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {params.checkIn} → {params.checkOut} · {nights} đêm · {params.guests} khách
        </ThemedText>
      </ThemedView>

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Thông tin khách
      </ThemedText>
      <TextField label="Họ và tên" value={fullName} onChangeText={setFullName} />
      <TextField label="Số điện thoại" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      <TextField label="Ghi chú (tuỳ chọn)" value={note} onChangeText={setNote} multiline />

      {services.data && services.data.length > 0 ? (
        <View>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Dịch vụ đi kèm
          </ThemedText>
          {services.data.map((service) => {
            const selected = selectedServiceIds.includes(service.id);
            return (
              <Pressable
                key={service.id}
                onPress={() => toggleService(service.id)}
                style={[
                  styles.serviceRow,
                  { borderColor: selected ? theme.primary : theme.border, backgroundColor: theme.backgroundElement },
                ]}>
                <View style={styles.serviceInfo}>
                  <ThemedText type="small">{service.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatVND(service.price)} / {service.unit}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: theme.primary, backgroundColor: selected ? theme.primary : 'transparent' },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Mã khuyến mãi
      </ThemedText>
      <View style={styles.promoRow}>
        <View style={styles.promoInput}>
          <TextField placeholder="Nhập mã khuyến mãi" autoCapitalize="characters" value={promoCode} onChangeText={setPromoCode} />
        </View>
        <Button label="Áp dụng" variant="outline" onPress={handleValidatePromo} loading={validatingPromo} />
      </View>
      {promoMessage ? (
        <ThemedText type="small" themeColor={discountAmount > 0 ? 'success' : 'danger'}>
          {promoMessage}
        </ThemedText>
      ) : null}

      <ThemedView type="backgroundElement" style={styles.totalCard}>
        <View style={styles.totalRow}>
          <ThemedText type="small">Tiền phòng ({nights} đêm)</ThemedText>
          <ThemedText type="small">{formatVND(roomTotal)}</ThemedText>
        </View>
        {servicesTotal > 0 ? (
          <View style={styles.totalRow}>
            <ThemedText type="small">Dịch vụ</ThemedText>
            <ThemedText type="small">{formatVND(servicesTotal)}</ThemedText>
          </View>
        ) : null}
        {discountAmount > 0 ? (
          <View style={styles.totalRow}>
            <ThemedText type="small" themeColor="success">
              Giảm giá
            </ThemedText>
            <ThemedText type="small" themeColor="success">
              -{formatVND(discountAmount)}
            </ThemedText>
          </View>
        ) : null}
        <View style={styles.totalRow}>
          <ThemedText type="smallBold">Tổng cộng</ThemedText>
          <ThemedText type="smallBold" themeColor="primary">
            {formatVND(grandTotal)}
          </ThemedText>
        </View>
      </ThemedView>

      {submitError ? (
        <ThemedText type="small" themeColor="danger">
          {submitError}
        </ThemedText>
      ) : null}

      <Button label="Xác nhận đặt phòng" onPress={handleSubmit} loading={submitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing.six, gap: Spacing.two },
  summaryCard: { borderRadius: Spacing.three, padding: Spacing.three, gap: 4, marginBottom: Spacing.two },
  sectionTitle: { marginTop: Spacing.three, marginBottom: Spacing.one, fontSize: 16 },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    marginBottom: Spacing.two,
  },
  serviceInfo: { gap: 2 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2 },
  promoRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-end' },
  promoInput: { flex: 1 },
  totalCard: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.one, marginTop: Spacing.two },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
