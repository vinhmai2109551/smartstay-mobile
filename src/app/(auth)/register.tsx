import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';

import { authApi } from '@/api/auth';
import { getApiErrorMessage } from '@/api/client';
import { BrandMark } from '@/components/BrandMark';
import { GoogleLogo } from '@/components/GoogleLogo';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { OrDivider } from '@/components/ui/OrDivider';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { MinTouch, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FormValues = { fullName: string; email: string; phone: string; password: string; agree: boolean };

export default function RegisterScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showGoogleHint, setShowGoogleHint] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        fullName: z.string().min(1, t('auth.register.fullNameRequired')),
        email: z.string().min(1, t('auth.emailRequired')).email(t('auth.emailInvalid')),
        phone: z.string().min(8, t('auth.register.phoneInvalid')),
        password: z.string().min(6, t('auth.register.passwordMinLength')),
        agree: z.boolean().refine((v) => v === true, t('auth.register.agreeRequired')),
      }),
    [t],
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', phone: '', password: '', agree: false },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const { fullName, email, phone, password } = values;
      // Step 1/2: this only sends an OTP to the email — the account is not
      // created yet (doc/API.md 1.1). Verification happens on the next screen.
      await authApi.register({ fullName, email, phone, password });
      router.push({ pathname: '/(auth)/verify-otp', params: { email } });
    } catch (error) {
      setServerError(getApiErrorMessage(error, t('auth.register.registerFailed')));
    }
  };

  return (
    <Screen decorated contentContainerStyle={styles.content}>
      <View style={styles.header}>
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
        <ThemedText type="bodyBold">{t('auth.register.headerTitle')}</ThemedText>
      </View>

      <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
        <BrandMark size={64} />
        <ThemedText type="title">{t('auth.register.heroTitle')}</ThemedText>
        <ThemedText type="body" themeColor="textSecondary">
          {t('auth.register.heroSubtitle')}
        </ThemedText>
      </Animated.View>

      <View style={styles.fields}>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label={t('auth.register.fullNameLabel')}
              leftIcon="person-outline"
              textContentType="name"
              placeholder={t('auth.register.fullNamePlaceholder')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.fullName?.message}
            />
          )}
        />

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

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label={t('auth.register.phoneLabel')}
              leftIcon="call-outline"
              textContentType="telephoneNumber"
              placeholder={t('auth.register.phonePlaceholder')}
              keyboardType="phone-pad"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.phone?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label={t('auth.passwordLabel')}
              leftIcon="lock-closed-outline"
              placeholder={t('auth.register.passwordPlaceholder')}
              autoComplete="new-password"
              textContentType="newPassword"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
            />
          )}
        />
      </View>

      <Controller
        control={control}
        name="agree"
        render={({ field: { onChange, value } }) => (
          <View style={styles.agreeRow}>
            <Checkbox checked={value} onChange={onChange} />
            <Text style={styles.agreeText}>
              <ThemedText type="small" themeColor="textSecondary">
                {t('auth.register.agreePrefix')}{' '}
              </ThemedText>
              <ThemedText type="small" themeColor="primary">
                {t('auth.register.agreeTerms')}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {' '}
                {t('auth.register.agreeAnd')}{' '}
              </ThemedText>
              <ThemedText type="small" themeColor="primary">
                {t('auth.register.agreePrivacy')}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {' '}
                {t('auth.register.agreeSuffix')}
              </ThemedText>
            </Text>
          </View>
        )}
      />
      {errors.agree ? (
        <ThemedText type="small" themeColor="danger">
          {errors.agree.message}
        </ThemedText>
      ) : null}

      {serverError ? (
        <View style={[styles.errorBox, { backgroundColor: `${theme.danger}14` }]}>
          <Ionicons name="alert-circle" size={18} color={theme.danger} />
          <ThemedText type="small" themeColor="danger" style={styles.agreeText}>
            {serverError}
          </ThemedText>
        </View>
      ) : null}

      <Button
        label={t('auth.register.registerButton')}
        size="lg"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
      />

      <OrDivider />

      <Button
        label={t('auth.register.continueWithGoogle')}
        variant="outline"
        size="lg"
        leading={<GoogleLogo size={20} />}
        onPress={() => setShowGoogleHint(true)}
      />

      <View style={styles.spacer} />

      <View style={styles.footer}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('auth.register.haveAccount')}
        </ThemedText>
        <Link href="/(auth)/login" asChild>
          <Pressable accessibilityRole="link" hitSlop={10}>
            <ThemedText type="smallBold" themeColor="primary">
              {t('auth.register.loginNow')}
            </ThemedText>
          </Pressable>
        </Link>
      </View>

      <ConfirmDialog
        visible={showGoogleHint}
        title={t('auth.register.googleHintTitle')}
        message={t('auth.register.googleHintMessage')}
        confirmLabel={t('auth.register.googleHintConfirm')}
        cancelLabel={t('auth.register.googleHintCancel')}
        onConfirm={() => {
          setShowGoogleHint(false);
          router.replace('/(auth)/login');
        }}
        onCancel={() => setShowGoogleHint(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: Space.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  backButton: {
    width: MinTouch,
    height: MinTouch,
    borderRadius: MinTouch / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { gap: Space.sm },
  fields: { gap: Space.lg },
  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.md },
  agreeText: { flex: 1, flexShrink: 1 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: Space.sm, padding: Space.md, borderRadius: Radius.md },
  spacer: { flex: 1, minHeight: Space.lg },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Space.xs,
    paddingBottom: Space.lg,
  },
});
