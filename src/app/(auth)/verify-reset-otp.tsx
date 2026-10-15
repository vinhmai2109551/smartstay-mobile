import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { authApi } from '@/api/auth';
import { getApiErrorMessage } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { OtpInput } from '@/components/ui/OtpInput';
import { Screen } from '@/components/ui/Screen';
import { MinTouch, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { toast } from '@/store/toastStore';

const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyResetOtpScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [otp, setOtp] = useState('');
  const [hasError, setHasError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleVerify = async () => {
    if (otp.trim().length !== 6) {
      setHasError(true);
      toast.error(t('auth.verifyResetOtp.otpInvalid'));
      return;
    }
    setHasError(false);
    setSubmitting(true);
    try {
      await authApi.verifyResetOtp({ email, otp: otp.trim() });
      router.push({ pathname: '/(auth)/reset-password', params: { email, otp: otp.trim() } });
    } catch (err) {
      setHasError(true);
      toast.error(getApiErrorMessage(err, t('auth.verifyResetOtp.otpWrongOrExpired')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResending(true);
    try {
      await authApi.forgotPassword({ email });
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
      toast.error(getApiErrorMessage(err, t('auth.verifyResetOtp.resendFailed')));
    } finally {
      setResending(false);
    }
  };

  return (
    <Screen decorated contentContainerStyle={styles.content}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
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
        <ThemedText type="title">{t('auth.verifyResetOtp.title')}</ThemedText>
        <ThemedText type="body" themeColor="textSecondary">
          {t('auth.verifyResetOtp.subtitle', { email })}
        </ThemedText>
      </View>

      <OtpInput
        value={otp}
        onChange={(value) => {
          setOtp(value);
          setHasError(false);
        }}
        error={hasError}
      />

      <Button label={t('auth.verifyResetOtp.verifyButton')} onPress={handleVerify} loading={submitting} disabled={otp.length !== 6} />

      <View style={styles.resendRow}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('auth.verifyResetOtp.notReceived')}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={handleResend}
          disabled={resendCooldown > 0 || resending}
          hitSlop={10}>
          <ThemedText type="smallBold" themeColor={resendCooldown > 0 ? 'textSecondary' : 'primary'}>
            {resendCooldown > 0
              ? t('auth.verifyResetOtp.resendIn', { seconds: resendCooldown })
              : resending
                ? t('auth.verifyResetOtp.sending')
                : t('auth.verifyResetOtp.resend')}
          </ThemedText>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: Space.xl },
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
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Space.xs },
});
