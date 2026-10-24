import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { getApiErrorMessage } from '@/api/client';
import { usersApi } from '@/api/users';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { VikaBrandColors } from '@/components/VikaBrand';
import { MaxContentWidth, MinTouch, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { strongPasswordSchema } from '@/utils/validation';

type FormValues = { oldPassword: string; newPassword: string; confirmPassword: string };

export default function ChangePasswordScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const clearSession = useAuthStore((s) => s.clearSession);

  const schema = useMemo(
    () =>
      z
        .object({
          oldPassword: z.string().min(1, t('auth.passwordRequired')),
          newPassword: strongPasswordSchema(t('profile.newPasswordHint')),
          confirmPassword: z.string().min(1, t('auth.passwordRequired')),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: t('profile.passwordMismatch'),
          path: ['confirmPassword'],
        }),
    [t],
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await usersApi.changePassword({ oldPassword: values.oldPassword, newPassword: values.newPassword });
      toast.success(t('profile.changePasswordSuccess'));
      reset();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('profile.changePasswordFailed')));
    }
  };

  return (
    <ThemedView style={styles.flex}>
      <View style={[styles.hero, { paddingTop: insets.top + Space.md }]}>
        <View style={styles.heroTop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>
          <ThemedText type="heading" style={styles.heroTitle}>
            {t('profile.changePassword')}
          </ThemedText>
        </View>
        <ThemedText type="small" style={styles.heroSubtitle}>
          {t('profile.changePasswordSubtitle')}
        </ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card elevation="none" style={[styles.tipCard, { backgroundColor: theme.backgroundSelected }]}>
          <View style={[styles.tipIcon, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={theme.textSecondary} />
          </View>
          <View style={styles.tipText}>
            <ThemedText type="smallBold">{t('profile.securityTipTitle')}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t('profile.securityTipDescription')}
            </ThemedText>
          </View>
        </Card>

        <Controller
          control={control}
          name="oldPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label={t('profile.currentPassword')}
              leftIcon="lock-closed-outline"
              placeholder={t('profile.currentPasswordPlaceholder')}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.oldPassword?.message}
            />
          )}
        />

        <View style={styles.sectionDivider}>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          <ThemedText type="caption" themeColor="textSecondary" style={styles.sectionLabel}>
            {t('profile.newPasswordSection')}
          </ThemedText>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        </View>

        <Controller
          control={control}
          name="newPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label={t('profile.newPassword')}
              leftIcon="key-outline"
              placeholder={t('profile.newPasswordPlaceholder')}
              hint={errors.newPassword ? undefined : t('profile.newPasswordHint')}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
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
              label={t('profile.confirmNewPasswordLabel')}
              leftIcon="shield-checkmark-outline"
              placeholder={t('profile.confirmNewPasswordPlaceholder')}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        <Pressable
          accessibilityRole="link"
          onPress={() => {
            // Resetting a password you can't recall means the current session
            // has to end too — sign out, then hand off to the forgot-password flow.
            clearSession();
            router.replace('/(auth)/forgot-password');
          }}
          hitSlop={8}
          style={styles.forgotLink}>
          <ThemedText type="smallBold" style={{ color: VikaBrandColors.gold }}>
            {t('profile.forgotCurrentPassword')}
          </ThemedText>
        </Pressable>

        <Button
          label={t('profile.updatePassword')}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: {
    backgroundColor: VikaBrandColors.navy,
    paddingHorizontal: Space.lg,
    paddingBottom: Space.xl,
    gap: Space.xs,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  backButton: {
    width: MinTouch,
    height: MinTouch,
    marginLeft: -Space.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { color: '#FFFFFF' },
  heroSubtitle: { color: 'rgba(255,255,255,0.75)', marginLeft: MinTouch - Space.sm },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Space.lg,
    gap: Space.lg,
    paddingBottom: Space['4xl'],
  },
  tipCard: { flexDirection: 'row', gap: Space.md, padding: Space.md, borderRadius: Radius.lg },
  tipIcon: { width: 34, height: 34, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  tipText: { flex: 1, gap: 2 },
  sectionDivider: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  sectionLabel: { letterSpacing: 1 },
  forgotLink: { alignSelf: 'center' },
});
