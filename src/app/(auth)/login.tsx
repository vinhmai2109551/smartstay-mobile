import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Google from 'expo-auth-session/providers/google';
import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
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

const schema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const theme = useTheme();
  const shadows = useShadows();
  const { width } = useWindowDimensions();
  // Emblem scales with the screen (≈ 104pt on a 390pt-wide phone), within sensible bounds.
  const emblemSize = Math.round(Math.min(Math.max(width * 0.27, 88), 124));
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

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
    try {
      const { accessToken, user } = await authApi.login(values);
      setSession(accessToken, user);
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Đăng nhập thất bại, vui lòng thử lại.'));
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
        setServerError('Không lấy được token từ Google, vui lòng thử lại.');
        return;
      }
      setServerError(null);
      setSigningIn(true);
      try {
        const { accessToken, user } = await authApi.google({ idToken });
        setSession(accessToken, user);
      } catch (error) {
        setServerError(getApiErrorMessage(error, 'Đăng nhập Google thất bại.'));
      } finally {
        setSigningIn(false);
      }
    })();
  }, [response, setSession]);

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
            <ThemedText style={[styles.title, { color: theme.text }]}>Chào mừng trở lại!</ThemedText>
            <ThemedText type="body" themeColor="textSecondary" style={styles.center}>
              Đăng nhập để tiếp tục hành trình nghỉ dưỡng của bạn.
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
                  label="Email"
                  leftIcon="mail-outline"
                  placeholder="ban@email.com"
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
                  label="Mật khẩu"
                  leftIcon="lock-closed-outline"
                  placeholder="Nhập mật khẩu"
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

            <Button
              label="Đăng nhập"
              size="lg"
              trailingIcon="arrow-forward"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={signingIn}
            />

            <OrDivider label="Hoặc" />

            {googleNotConfigured ? (
              <ThemedText type="caption" themeColor="danger">
                Chưa cấu hình {GOOGLE_CLIENT_ID_ENV_NAME} trong file .env — xem hướng dẫn trong .env để bật đăng
                nhập Google.
              </ThemedText>
            ) : null}

            <Button
              label="Tiếp tục với Google"
              variant="outline"
              size="lg"
              leading={<GoogleLogo size={20} />}
              disabled={!request || googleNotConfigured || isSubmitting}
              loading={signingIn}
              onPress={() => promptAsync()}
            />

            <View style={styles.footer}>
              <ThemedText type="small" themeColor="textSecondary">
                Chưa có tài khoản?
              </ThemedText>
              <Link href="/(auth)/register" asChild>
                <Pressable accessibilityRole="link" hitSlop={10} style={styles.footerLink}>
                  <ThemedText type="smallBold" themeColor="primary">
                    Đăng ký ngay
                  </ThemedText>
                  <Ionicons name="arrow-forward" size={16} color={theme.primary} />
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
