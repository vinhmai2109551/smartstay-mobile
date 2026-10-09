import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { DateField } from '@/components/DateField';
import { Stepper } from '@/components/Stepper';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import { BookingFormRequest } from '@/types/chat';
import { toIsoDate } from '@/utils/date';

type PaymentMethod = 'CASH' | 'PAYOS';

/**
 * The guest's details for an AI booking, asked for when the assistant calls
 * `request_booking_form`. Mirrors the web's BookingInfoForm (AiChatWidgets.jsx): fields
 * the AI already knows are prefilled, the name/phone come from the account, and
 * submitting sends one plain sentence back to the AI, which then proposes the booking.
 */
export function ChatBookingForm({
  request,
  disabled,
  onSubmit,
  onCancel,
}: {
  request: BookingFormRequest;
  disabled?: boolean;
  onSubmit: (message: string) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);

  const today = dayjs().startOf('day');
  const initialCheckIn = request.checkIn && dayjs(request.checkIn).isValid() ? dayjs(request.checkIn) : today;
  const initialCheckOut =
    request.checkOut && dayjs(request.checkOut).isAfter(initialCheckIn) ? dayjs(request.checkOut) : initialCheckIn.add(1, 'day');

  const [checkIn, setCheckIn] = useState(initialCheckIn.toDate());
  const [checkOut, setCheckOut] = useState(initialCheckOut.toDate());
  const [guests, setGuests] = useState(request.guests && request.guests > 0 ? request.guests : 2);
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  // No default, like the web: the guest has to pick how they'll pay.
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  const changeCheckIn = (date: Date) => {
    setCheckIn(date);
    // Keep at least one night.
    if (!dayjs(checkOut).isAfter(date, 'day')) setCheckOut(dayjs(date).add(1, 'day').toDate());
  };

  const canSubmit = !!fullName.trim() && !!phone.trim() && !!paymentMethod && !disabled;

  // Same sentence the web builds (handleSubmitBookingForm in AiChatbot.jsx) — the AI is
  // tuned to read it, so it stays in Vietnamese whatever the app language is.
  const handleSubmit = () => {
    if (!canSubmit) return;
    const room = request.roomTypeName ? `phòng ${request.roomTypeName}` : 'phòng đã chọn';
    const parts = [
      `Tôi muốn đặt ${room}`,
      `nhận phòng ngày ${toIsoDate(checkIn)}`,
      `trả phòng ngày ${toIsoDate(checkOut)}`,
      `${guests} khách`,
      `họ tên ${fullName.trim()}`,
      `số điện thoại ${phone.trim()}`,
    ];
    if (email.trim()) parts.push(`email ${email.trim()}`);
    parts.push(`thanh toán bằng ${paymentMethod === 'PAYOS' ? 'chuyển khoản' : 'tiền mặt'}`);
    onSubmit(`${parts.join(', ')}.`);
  };

  const paymentOptions: { value: PaymentMethod; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { value: 'CASH', icon: 'cash-outline', label: t('chatForm.payCash') },
    { value: 'PAYOS', icon: 'qr-code-outline', label: t('chatForm.payTransfer') },
  ];

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: theme.primarySoft }]}>
          <Ionicons name="create-outline" size={16} color={theme.primary} />
        </View>
        <View style={styles.flex}>
          <ThemedText type="smallBold">{t('chatForm.title')}</ThemedText>
          {request.roomTypeName ? (
            <ThemedText type="caption" themeColor="textSecondary">
              {request.roomTypeName}
            </ThemedText>
          ) : null}
        </View>
      </View>

      <View style={styles.row}>
        <DateField label={t('chatForm.checkIn')} value={checkIn} onChange={changeCheckIn} minimumDate={today.toDate()} />
        <DateField
          label={t('chatForm.checkOut')}
          value={checkOut}
          onChange={setCheckOut}
          minimumDate={dayjs(checkIn).add(1, 'day').toDate()}
        />
      </View>

      <Stepper label={t('chatForm.guests')} value={guests} onChange={setGuests} max={20} />

      <TextField
        leftIcon="person-outline"
        placeholder={t('chatForm.fullName')}
        value={fullName}
        onChangeText={setFullName}
        autoComplete="name"
        textContentType="name"
      />
      <TextField
        leftIcon="call-outline"
        placeholder={t('chatForm.phone')}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
      />
      <TextField
        leftIcon="mail-outline"
        placeholder={t('chatForm.email')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        textContentType="emailAddress"
      />

      <View style={styles.gapSm}>
        <ThemedText type="smallBold">{t('chatForm.paymentMethod')}</ThemedText>
        <View style={styles.row}>
          {paymentOptions.map((option) => {
            const selected = paymentMethod === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setPaymentMethod(option.value)}
                style={[
                  styles.payOption,
                  {
                    borderColor: selected ? theme.primary : theme.border,
                    backgroundColor: selected ? theme.primarySoft : 'transparent',
                  },
                ]}>
                <Ionicons name={option.icon} size={18} color={selected ? theme.primary : theme.textSecondary} />
                <ThemedText type="smallBold" style={{ color: selected ? theme.primary : theme.text }}>
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.flex}>
          <Button label={t('common.cancel')} variant="outline" size="sm" onPress={onCancel} disabled={disabled} />
        </View>
        <View style={styles.flex}>
          <Button label={t('chatForm.submit')} size="sm" icon="send" onPress={handleSubmit} disabled={!canSubmit} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Space.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  headerIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: Space.sm },
  gapSm: { gap: Space.sm },
  payOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.xs,
    minHeight: 44,
    paddingHorizontal: Space.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
});
