import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ErrorViewProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: theme.backgroundSelected }]}>
        <Ionicons name="cloud-offline-outline" size={32} color={theme.textSecondary} />
      </View>
      <View style={styles.text}>
        <ThemedText type="heading" style={styles.center}>
          {t('common.errorTitle')}
        </ThemedText>
        <ThemedText type="body" themeColor="textSecondary" style={styles.center}>
          {message}
        </ThemedText>
      </View>
      {onRetry ? (
        <Button label={t('common.retry')} icon="refresh" variant="secondary" fullWidth={false} onPress={onRetry} />
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Space.xl, padding: Space['3xl'] },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  text: { gap: Space.xs, maxWidth: 320 },
  center: { textAlign: 'center' },
});
