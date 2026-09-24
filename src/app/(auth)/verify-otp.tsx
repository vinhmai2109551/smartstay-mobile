import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { authApi } from '@/api/auth';
import { getApiErrorMessage } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { OtpInput } from '@/components/ui/OtpInput';
import { MinTouch, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyOtpScreen() {
  const theme = useTheme();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleVerify = async () => {
    if (otp.trim().length !== 6) {
      setError('Mã OTP gồm 6 chữ số.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await authApi.verifyOtp({ email, otp: otp.trim() });
      setSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Mã OTP không đúng hoặc đã hết hạn.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setResending(true);
    try {
      await authApi.resendOtp({ email });
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể gửi lại mã, vui lòng thử lại sau.'));
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <Screen contentContainerStyle={styles.successContent}>
        <View style={[styles.successBadge, { backgroundColor: theme.primarySoft }]}>
          <View style={[styles.successInner, { backgroundColor: theme.success }]}>
            <Ionicons name="checkmark" size={40} color="#FFFFFF" />
          </View>
        </View>
        <View style={styles.successText}>
          <ThemedText type="title" style={styles.center}>
            Đăng ký thành công
          </ThemedText>
          <ThemedText type="body" themeColor="textSecondary" style={styles.center}>
            Tài khoản của bạn đã sẵn sàng. Hãy đăng nhập để bắt đầu đặt phòng.
          </ThemedText>
        </View>
        <Button label="Đến trang đăng nhập" icon="arrow-forward" onPress={() => router.replace('/(auth)/login')} />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quay lại"
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.backButton,
          { borderColor: theme.border, backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
        ]}>
        <Ionicons name="chevron-back" size={22} color={theme.text} />
      </Pressable>

      <View style={[styles.iconCircle, { backgroundColor: theme.primarySoft }]}>
        <Ionicons name="mail-unread-outline" size={28} color={theme.primary} />
      </View>

      <View style={styles.hero}>
        <ThemedText type="title">Nhập mã xác minh</ThemedText>
        <ThemedText type="body" themeColor="textSecondary">
          Mã gồm 6 chữ số đã được gửi tới{' '}
          <ThemedText type="bodyBold">{email}</ThemedText>. Kiểm tra cả thư mục spam nhé.
        </ThemedText>
      </View>

      <OtpInput value={otp} onChange={setOtp} error={!!error} />

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={16} color={theme.danger} />
          <ThemedText type="small" themeColor="danger" style={styles.flexShrink}>
            {error}
          </ThemedText>
        </View>
      ) : null}

      <Button label="Xác minh" onPress={handleVerify} loading={submitting} disabled={otp.length !== 6} />

      <View style={styles.resendRow}>
        <ThemedText type="small" themeColor="textSecondary">
          Chưa nhận được mã?
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={handleResend}
          disabled={resendCooldown > 0 || resending}
          hitSlop={10}>
          <ThemedText type="smallBold" themeColor={resendCooldown > 0 ? 'textSecondary' : 'primary'}>
            {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : resending ? 'Đang gửi…' : 'Gửi lại mã'}
          </ThemedText>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: Space.xl },
  flexShrink: { flexShrink: 1 },
  backButton: {
    width: MinTouch,
    height: MinTouch,
    borderRadius: MinTouch / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  hero: { gap: Space.sm },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: Space.xs },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Space.xs },
  successContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: Space['2xl'] },
  successBadge: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center' },
  successInner: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  successText: { gap: Space.sm, maxWidth: 340 },
  center: { textAlign: 'center' },
});
