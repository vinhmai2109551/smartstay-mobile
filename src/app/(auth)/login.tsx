import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Google from 'expo-auth-session/providers/google';
import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { z } from 'zod';

import { authApi } from '@/api/auth';
import { getApiErrorMessage } from '@/api/client';
import { BrandMark } from '@/components/BrandMark';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { OrDivider } from '@/components/ui/OrDivider';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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
    <Screen contentContainerStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.brandRow}>
        <BrandMark size={44} iconSize={20} />
        <ThemedText type="heading">SmartStay</ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.hero}>
        <ThemedText type="display">Chào mừng{'\n'}trở lại</ThemedText>
        <ThemedText type="body" themeColor="textSecondary">
          Đăng nhập để tiếp tục kỳ nghỉ của bạn tại SmartStay.
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.fields}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
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
      </Animated.View>

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
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        disabled={signingIn}
      />

      <OrDivider />

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
        icon="logo-google"
        disabled={!request || googleNotConfigured || isSubmitting}
        loading={signingIn}
        onPress={() => promptAsync()}
      />

      <View style={styles.spacer} />

      <View style={styles.footer}>
        <ThemedText type="small" themeColor="textSecondary">
          Chưa có tài khoản?
        </ThemedText>
        <Link href="/(auth)/register" asChild>
          <Pressable accessibilityRole="link" hitSlop={10}>
            <ThemedText type="smallBold" themeColor="primary">
              Đăng ký ngay
            </ThemedText>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: Space.xl },
  flexShrink: { flexShrink: 1 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: Space.md, marginTop: Space.sm },
  hero: { gap: Space.sm },
  fields: { gap: Space.lg },
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
