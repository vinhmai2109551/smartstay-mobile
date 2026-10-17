import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { logError } from '@/utils/logger';

type AppErrorFallbackProps = {
  error: Error;
  onRetry: () => void;
};

/**
 * Fallback for Expo Router's `ErrorBoundary` export (see src/app/_layout.tsx and
 * src/app/(tabs)/_layout.tsx) — rendered when something below throws during render.
 *
 * Deliberately self-contained: no theme/i18n/font hooks. Whatever broke the tree below
 * it could BE one of those, or they might not have finished loading yet (e.g. an error
 * during startup, before fonts/i18n are ready) — this has to render regardless.
 */
export function AppErrorFallback({ error, onRetry }: AppErrorFallbackProps) {
  useEffect(() => {
    logError(error);
  }, [error]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Đã có lỗi xảy ra</Text>
        <Text style={styles.message}>Ứng dụng gặp lỗi không mong muốn. Vui lòng thử lại hoặc về trang chủ.</Text>

        {__DEV__ ? (
          <View style={styles.devBox}>
            <Text style={styles.devLabel}>{error.message}</Text>
            {error.stack ? (
              <ScrollView style={styles.devStackScroll}>
                <Text style={styles.devStack}>{error.stack}</Text>
              </ScrollView>
            ) : null}
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Thử lại"
          onPress={onRetry}
          style={({ pressed }) => [styles.button, styles.primaryButton, { opacity: pressed ? 0.85 : 1 }]}>
          <Text style={styles.primaryButtonText}>Thử lại</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Về trang chủ"
          onPress={() => router.replace('/')}
          style={({ pressed }) => [styles.button, styles.secondaryButton, { opacity: pressed ? 0.7 : 1 }]}>
          <Text style={styles.secondaryButtonText}>Về trang chủ</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', textAlign: 'center' },
  message: { fontSize: 15, color: '#4B5563', textAlign: 'center', maxWidth: 320 },
  devBox: { width: '100%', maxWidth: 360, backgroundColor: '#FEF2F2', borderRadius: 8, padding: 12, marginTop: 8 },
  devLabel: { fontSize: 13, fontWeight: '600', color: '#B91C1C', marginBottom: 6 },
  devStackScroll: { maxHeight: 160 },
  devStack: { fontSize: 11, color: '#7F1D1D', fontFamily: 'monospace' },
  button: {
    minWidth: 200,
    minHeight: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButton: { backgroundColor: '#2563EB' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  secondaryButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#D1D5DB' },
  secondaryButtonText: { color: '#111827', fontSize: 15, fontWeight: '600' },
});
