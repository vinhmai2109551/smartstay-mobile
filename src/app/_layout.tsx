import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { authApi } from '@/api/auth';
import { LoadingView } from '@/components/ui/LoadingView';
import { useAuthStore } from '@/store/authStore';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasSeenOnboarding = useAuthStore((s) => s.hasSeenOnboarding);
  const updateUser = useAuthStore((s) => s.updateUser);

  useEffect(() => {
    if (hasHydrated && accessToken) {
      authApi.me().then(updateUser).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  if (!hasHydrated) {
    return <LoadingView />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!!accessToken}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="room/[id]"
            options={{ headerShown: true, title: 'Chi tiết phòng', headerBackTitle: 'Quay lại' }}
          />
          <Stack.Screen
            name="booking/new"
            options={{ headerShown: true, title: 'Đặt phòng', presentation: 'modal' }}
          />
          <Stack.Screen
            name="booking/[id]"
            options={{ headerShown: true, title: 'Chi tiết đơn', headerBackTitle: 'Quay lại' }}
          />
          <Stack.Screen
            name="checkout/[bookingId]"
            options={{ headerShown: true, title: 'Thanh toán', presentation: 'modal' }}
          />
          <Stack.Screen
            name="notifications"
            options={{ headerShown: true, title: 'Thông báo', headerBackTitle: 'Quay lại' }}
          />
        </Stack.Protected>

        <Stack.Protected guard={!accessToken && !hasSeenOnboarding}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>

        <Stack.Protected guard={!accessToken && hasSeenOnboarding}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
