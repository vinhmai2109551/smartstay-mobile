import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { authApi } from '@/api/auth';
import { getApiErrorMessage } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { Spacing } from '@/constants/theme';
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
        <View style={[styles.successBadge, { backgroundColor: theme.backgroundSelected }]}>
          <Ionicons name="checkmark-circle" size={48} color={theme.primary} />
        </View>
        <ThemedText type="title" style={styles.center}>
          Đăng ký thành công
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.center}>
          Hãy đăng nhập bằng tài khoản vừa tạo.
        </ThemedText>
        <Button label="Đến trang đăng nhập" onPress={() => router.replace('/(auth)/login')} />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <ThemedText type="title" style={styles.heroTitle}>
          Nhập mã xác minh
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          Mình đã gửi mã OTP gồm 6 chữ số tới {email}. Vui lòng kiểm tra email (kể cả thư mục spam).
        </ThemedText>
      </View>

      <TextField
        label="Mã OTP"
        placeholder="000000"
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
        error={error ?? undefined}
      />

      <Button label="Xác minh" onPress={handleVerify} loading={submitting} />

      <ThemedText
        type="link"
        themeColor={resendCooldown > 0 ? 'textSecondary' : 'primary'}
        style={styles.resendLink}
        onPress={handleResend}>
        {resendCooldown > 0 ? `Gửi lại mã sau ${resendCooldown}s` : resending ? 'Đang gửi lại...' : 'Gửi lại mã OTP'}
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: Spacing.three },
  hero: { gap: Spacing.one },
  heroTitle: { textAlign: 'left' },
  resendLink: { alignSelf: 'center' },
  successContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.three },
  successBadge: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});
