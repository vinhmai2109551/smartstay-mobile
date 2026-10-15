import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { authApi } from '@/api/auth';
import { getApiErrorMessage } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { MinTouch, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { toast } from '@/store/toastStore';

type FormValues = { email: string };

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  const schema = useMemo(
    () => z.object({ email: z.string().min(1, t('auth.emailRequired')).email(t('auth.emailInvalid')) }),
    [t],
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  const onSubmit = async ({ email }: FormValues) => {
    try {
      await authApi.forgotPassword({ email });
      router.push({ pathname: '/(auth)/verify-reset-otp', params: { email } });
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('auth.forgotPassword.sendFailed')));
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
        <Ionicons name="key-outline" size={28} color={theme.primary} />
      </View>

      <View style={styles.hero}>
        <ThemedText type="title">{t('auth.forgotPassword.title')}</ThemedText>
        <ThemedText type="body" themeColor="textSecondary">
          {t('auth.forgotPassword.subtitle')}
        </ThemedText>
      </View>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t('auth.emailLabel')}
            leftIcon="mail-outline"
            placeholder={t('auth.emailPlaceholder')}
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            keyboardType="email-address"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
          />
        )}
      />

      <Button label={t('auth.forgotPassword.submitButton')} onPress={handleSubmit(onSubmit)} loading={isSubmitting} />

      <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={10} style={styles.backLink}>
        <ThemedText type="smallBold" themeColor="primary">
          {t('auth.forgotPassword.backToLogin')}
        </ThemedText>
      </Pressable>
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
  backLink: { alignSelf: 'center' },
});
