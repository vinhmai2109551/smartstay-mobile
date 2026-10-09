import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { authApi } from '@/api/auth';
import { getApiErrorMessage } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { toast } from '@/store/toastStore';

type FormValues = { newPassword: string; confirmPassword: string };

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { email, otp } = useLocalSearchParams<{ email: string; otp: string }>();
  const [success, setSuccess] = useState(false);

  const schema = useMemo(
    () =>
      z
        .object({
          newPassword: z.string().min(6, t('auth.register.passwordMinLength')),
          confirmPassword: z.string().min(1, t('auth.passwordRequired')),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: t('auth.resetPassword.passwordMismatch'),
          path: ['confirmPassword'],
        }),
    [t],
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { newPassword: '', confirmPassword: '' } });

  const onSubmit = async ({ newPassword }: FormValues) => {
    try {
      await authApi.resetPassword({ email, otp, newPassword });
      setSuccess(true);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('auth.resetPassword.resetFailed')));
    }
  };

  if (success) {
    return (
      <Screen decorated contentContainerStyle={styles.successContent}>
        <View style={[styles.successBadge, { backgroundColor: theme.primarySoft }]}>
          <View style={[styles.successInner, { backgroundColor: theme.success }]}>
            <Ionicons name="checkmark" size={40} color="#FFFFFF" />
          </View>
        </View>
        <View style={styles.successText}>
          <ThemedText type="title" style={styles.center}>
            {t('auth.resetPassword.successTitle')}
          </ThemedText>
          <ThemedText type="body" themeColor="textSecondary" style={styles.center}>
            {t('auth.resetPassword.successSubtitle')}
          </ThemedText>
        </View>
        <Button
          label={t('auth.resetPassword.goToLogin')}
          icon="arrow-forward"
          onPress={() => router.replace('/(auth)/login')}
        />
      </Screen>
    );
  }

  return (
    <Screen decorated contentContainerStyle={styles.content}>
      <View style={[styles.iconCircle, { backgroundColor: theme.primarySoft }]}>
        <Ionicons name="lock-closed-outline" size={28} color={theme.primary} />
      </View>

      <View style={styles.hero}>
        <ThemedText type="title">{t('auth.resetPassword.title')}</ThemedText>
        <ThemedText type="body" themeColor="textSecondary">
          {t('auth.resetPassword.subtitle')}
        </ThemedText>
      </View>

      <Controller
        control={control}
        name="newPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t('auth.resetPassword.newPasswordLabel')}
            leftIcon="lock-closed-outline"
            placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
            autoComplete="new-password"
            textContentType="newPassword"
            secureTextEntry
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.newPassword?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t('auth.resetPassword.confirmPasswordLabel')}
            leftIcon="lock-closed-outline"
            placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
            autoComplete="new-password"
            textContentType="newPassword"
            secureTextEntry
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.confirmPassword?.message}
          />
        )}
      />

      <Button label={t('auth.resetPassword.submitButton')} onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: Space.xl },
  center: { textAlign: 'center' },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  hero: { gap: Space.sm },
  successContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: Space['2xl'] },
  successBadge: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center' },
  successInner: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  successText: { gap: Space.sm, maxWidth: 340 },
});
