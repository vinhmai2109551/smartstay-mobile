import * as Google from 'expo-auth-session/providers/google';
import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { authApi } from '@/api/auth';
import { getApiErrorMessage } from '@/api/client';
import { BrandMark } from '@/components/BrandMark';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Spacing } from '@/constants/theme';
import { GOOGLE_WEB_CLIENT_ID } from '@/config/env';
import { useAuthStore } from '@/store/authStore';

WebBrowser.maybeCompleteAuthSession();

// Password login (POST /auth/login) requires a Cloudflare Turnstile token
// that only the web widget can produce — there's no SDK for native apps
// (see doc/API.md 0.1). Until the backend adds a native-friendly path,
// Google sign-in (POST /auth/google) is the only working login on mobile.
export default function LoginScreen() {
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
  });

  useEffect(() => {
    if (response?.type !== 'success') return;

    const idToken = response.authentication?.idToken ?? (response.params as Record<string, string>)?.id_token;
    if (!idToken) {
      setServerError('Không lấy được token từ Google, vui lòng thử lại.');
      return;
    }

    (async () => {
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

  const googleNotConfigured = !GOOGLE_WEB_CLIENT_ID;

  return (
    <Screen contentContainerStyle={styles.content}>
      <BrandMark size={48} />

      <View style={styles.hero}>
        <ThemedText type="title" style={styles.heroTitle}>
          Chào mừng trở lại
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          Đăng nhập để tiếp tục kỳ nghỉ của bạn tại SmartStay.
        </ThemedText>
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        Đăng nhập bằng mật khẩu hiện chưa khả dụng trên mobile (backend yêu cầu xác minh Cloudflare Turnstile,
        chỉ chạy được trên web). Vui lòng đăng nhập bằng Google trong lúc chờ bản cập nhật.
      </ThemedText>

      {googleNotConfigured ? (
        <ThemedText type="small" themeColor="danger">
          Chưa cấu hình EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID trong file .env — xem hướng dẫn trong .env để bật đăng
          nhập Google.
        </ThemedText>
      ) : null}

      {serverError ? (
        <ThemedText type="small" themeColor="danger">
          {serverError}
        </ThemedText>
      ) : null}

      <Button
        label="Tiếp tục với Google"
        icon="logo-google"
        disabled={!request || googleNotConfigured}
        loading={signingIn}
        onPress={() => promptAsync()}
      />

      <View style={styles.spacer} />

      <Link href="/(auth)/register" style={styles.link}>
        <ThemedText type="link" themeColor="primary">
          Chưa có tài khoản? Đăng ký ngay
        </ThemedText>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: Spacing.three },
  hero: { gap: Spacing.one },
  heroTitle: { textAlign: 'left' },
  spacer: { flex: 1, minHeight: Spacing.three },
  link: { alignSelf: 'center', paddingBottom: Spacing.three },
});
