import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Google from 'expo-auth-session/providers/google';
import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { authApi } from '@/api/auth';
import { getApiErrorMessage } from '@/api/client';
import { AuthBackground } from '@/components/AuthBackground';
import { GoogleLogo } from '@/components/GoogleLogo';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { OrDivider } from '@/components/ui/OrDivider';
import { TextField } from '@/components/ui/TextField';
import { TurnstileWidget } from '@/components/TurnstileWidget';
import { VikaEmblem, VikaWordmark } from '@/components/VikaBrand';
import { FontFamily, Radius, Space } from '@/constants/theme';
import { useShadows, useTheme } from '@/hooks/use-theme';
import { GOOGLE_ANDROID_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '@/config/env';
import { useAuthStore } from '@/store/authStore';

WebBrowser.maybeCompleteAuthSession();

// Google.useAuthRequest throws when the current platform's client ID is
// missing, so a placeholder keeps the screen rendering and the button is
// disabled instead.
const PLATFORM_GOOGLE_CLIENT_ID = Platform.select({
  ios: GOOGLE_IOS_CLIENT_ID,
  android: GOOGLE_ANDROID_CLIENT_ID,
  default: GOOGLE_WEB_CLIENT_ID,
});
const GOOGLE_CLIENT_ID_ENV_NAME = Platform.select({
  ios: 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
  android: 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
  default: 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
});
const GOOGLE_PLACEHOLDER_CLIENT_ID = 'not-configured';

type FormValues = { email: string; password: string };

export default function LoginScreen() {
  const { t } = useTranslation();
  const schema = useMemo(
    () =>
      z.object({
        email: z.string().min(1, t('auth.emailRequired')).email(t('auth.emailInvalid')),
        password: z.string().min(1, t('auth.passwordRequired')),
      }),
    [t],
  );
  const theme = useTheme();
  const shadows = useShadows();
  const { width } = useWindowDimensions();
  // Emblem scales with the screen (≈ 104pt on a 390pt-wide phone), within sensible bounds.
  const emblemSize = Math.round(Math.min(Math.max(width * 0.27, 88), 124));
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    if (!turnstileToken) {
      setServerError(t('auth.login.waitVerification'));
      return;
    }
    try {
      const { accessToken, user } = await authApi.login({ ...values, turnstileToken });
      setSession(accessToken, user);
    } catch (error) {
      setServerError(getApiErrorMessage(error, t('auth.login.loginFailed')));
    } finally {
      // The token is spent after one attempt — reload the widget for a fresh one.
      setTurnstileToken('');
      setTurnstileResetKey((prev) => prev + 1);
    }
  };

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID || GOOGLE_PLACEHOLDER_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID || GOOGLE_PLACEHOLDER_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || GOOGLE_PLACEHOLDER_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type !== 'success') return;

    const idToken = response.authentication?.idToken ?? (response.params as Record<string, string>)?.id_token;

    (async () => {
      if (!idToken) {
        setServerError(t('auth.login.googleNoToken'));
        return;
      }
      setServerError(null);
      setSigningIn(true);
      try {
        const { accessToken, user } = await authApi.google({ idToken });
        setSession(accessToken, user);
      } catch (error) {
        setServerError(getApiErrorMessage(error, t('auth.login.googleFailed')));
      } finally {
        setSigningIn(false);
      }
    })();
  }, [response, setSession, t]);

  const googleNotConfigured = !PLATFORM_GOOGLE_CLIENT_ID;

  return (
    <View style={styles.flex}>
      <AuthBackground />
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}>
          <View style={styles.brand}>
            <Animated.View entering={ZoomIn.springify().damping(15)}>
              <VikaEmblem size={emblemSize} />
            </Animated.View>
            <Animated.View entering={FadeIn.duration(600).delay(250)}>
              <VikaWordmark size={emblemSize * 0.34} />
            </Animated.View>
          </View>

          <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.hero}>
            <ThemedText style={[styles.title, { color: theme.text }]}>{t('auth.login.title')}</ThemedText>
            <ThemedText type="body" themeColor="textSecondary" style={styles.center}>
              {t('auth.login.subtitle')}
            </ThemedText>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(550).delay(250)}
            style={[styles.card, shadows.floating, { backgroundColor: theme.backgroundElement }]}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  inlineLabel
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
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  inlineLabel
                  label={t('auth.passwordLabel')}
                  leftIcon="lock-closed-outline"
                  placeholder={t('auth.login.passwordPlaceholder')}
                  autoComplete="current-password"
                  textContentType="password"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            {serverError ? (
              <View style={[styles.errorBox, { backgroundColor: `${theme.danger}14` }]}>
                <Ionicons name="alert-circle" size={18} color={theme.danger} />
                <ThemedText type="small" themeColor="danger" style={styles.flexShrink}>
                  {serverError}
                </ThemedText>
              </View>
            ) : null}

            <TurnstileWidget action="login" onTokenChange={setTurnstileToken} resetKey={turnstileResetKey} />

            <Button
              label={t('auth.login.loginButton')}
              size="lg"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={signingIn || !turnstileToken}
            />

            <OrDivider />

            {googleNotConfigured ? (
              <ThemedText type="caption" themeColor="danger">
                {t('auth.login.googleNotConfigured', { envName: GOOGLE_CLIENT_ID_ENV_NAME })}
              </ThemedText>
            ) : null}

            <Button
              label={t('auth.login.continueWithGoogle')}
              variant="outline"
              size="lg"
              leading={<GoogleLogo size={20} />}
              disabled={!request || googleNotConfigured || isSubmitting}
              loading={signingIn}
              onPress={() => promptAsync()}
            />

            <View style={styles.footer}>
              <ThemedText type="small" themeColor="textSecondary">
                {t('auth.login.noAccount')}
              </ThemedText>
              <Link href="/(auth)/register" asChild>
                <Pressable accessibilityRole="link" hitSlop={10} style={styles.footerLink}>
                  <ThemedText type="smallBold" themeColor="primary">
                    {t('auth.login.registerNow')}
                  </ThemedText>
                </Pressable>
              </Link>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  scroll: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: Space.xl,
    paddingTop: Space.xl,
    paddingBottom: Space['2xl'],
    gap: Space.xl,
    justifyContent: 'center',
  },
  brand: { alignItems: 'center', gap: Space.lg, paddingTop: Space.lg },
  hero: { gap: Space.sm, alignItems: 'center' },
  title: { fontFamily: FontFamily.bold, fontSize: 24, lineHeight: 32, textAlign: 'center' },
  center: { textAlign: 'center', maxWidth: 300 },
  card: {
    borderRadius: Radius.xl,
    padding: Space.xl,
    gap: Space.lg,
  },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: Space.sm, padding: Space.md, borderRadius: Radius.md },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Space.xs,
    marginTop: Space.xs,
  },
  footerLink: { flexDirection: 'row', alignItems: 'center', gap: Space.xs },
});
