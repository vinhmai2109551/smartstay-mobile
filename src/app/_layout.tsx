// Per-weight imports: the package root bundles every weight and italic (~30 files).
import { BeVietnamPro_400Regular } from '@expo-google-fonts/be-vietnam-pro/400Regular';
import { BeVietnamPro_500Medium } from '@expo-google-fonts/be-vietnam-pro/500Medium';
import { BeVietnamPro_600SemiBold } from '@expo-google-fonts/be-vietnam-pro/600SemiBold';
import { BeVietnamPro_700Bold } from '@expo-google-fonts/be-vietnam-pro/700Bold';
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display/600SemiBold';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display/700Bold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { authApi } from '@/api/auth';
import { Colors, FontFamily } from '@/constants/theme';
import { useEffectiveColorScheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import '@/i18n';

// Keep the splash screen up until fonts and the persisted auth store are ready.
SplashScreen.preventAutoHideAsync();

const navigationFonts: Theme['fonts'] = {
  regular: { fontFamily: FontFamily.regular, fontWeight: 'normal' },
  medium: { fontFamily: FontFamily.medium, fontWeight: 'normal' },
  bold: { fontFamily: FontFamily.semiBold, fontWeight: 'normal' },
  heavy: { fontFamily: FontFamily.bold, fontWeight: 'normal' },
};

const LightNavigationTheme: Theme = {
  ...DefaultTheme,
  fonts: navigationFonts,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.primary,
    background: Colors.light.background,
    card: Colors.light.background,
    text: Colors.light.text,
    border: Colors.light.border,
  },
};

const DarkNavigationTheme: Theme = {
  ...DarkTheme,
  fonts: navigationFonts,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.primary,
    background: Colors.dark.background,
    card: Colors.dark.background,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
};

export default function RootLayout() {
  const { t } = useTranslation();
  const colorScheme = useEffectiveColorScheme();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const settingsHydrated = useSettingsStore((s) => s.hasHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasSeenOnboarding = useAuthStore((s) => s.hasSeenOnboarding);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });
  // A font load failure falls back to system fonts rather than blocking the app.
  const fontsReady = fontsLoaded || !!fontError;

  useEffect(() => {
    if (hasHydrated && accessToken) {
      authApi.me().then(updateUser).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  useEffect(() => {
    if (hasHydrated && settingsHydrated && fontsReady) {
      SplashScreen.hideAsync();
    }
  }, [hasHydrated, settingsHydrated, fontsReady]);

  if (!hasHydrated || !settingsHydrated || !fontsReady) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkNavigationTheme : LightNavigationTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          headerShadowVisible: false,
          headerTintColor: Colors[colorScheme === 'dark' ? 'dark' : 'light'].primary,
          headerTitleStyle: { fontFamily: FontFamily.semiBold, fontSize: 17 },
          headerBackTitleStyle: { fontFamily: FontFamily.medium },
        }}>
        <Stack.Protected guard={!!accessToken}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="room/[id]"
            options={{ headerShown: true, title: t('layout.roomDetailTitle'), headerBackTitle: t('common.back') }}
          />
          <Stack.Screen
            name="booking/new"
            options={{ headerShown: true, title: t('layout.newBookingTitle'), presentation: 'modal' }}
          />
          <Stack.Screen
            name="booking/[id]"
            options={{ headerShown: true, title: t('layout.bookingDetailTitle'), headerBackTitle: t('common.back') }}
          />
          <Stack.Screen
            name="checkout/[bookingId]"
            options={{ headerShown: true, title: t('layout.checkoutTitle'), presentation: 'modal' }}
          />
          <Stack.Screen
            name="notifications"
            options={{ headerShown: true, title: t('layout.notificationsTitle'), headerBackTitle: t('common.back') }}
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
