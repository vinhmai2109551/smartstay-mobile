import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { Spacing } from '@/constants/theme';

type ErrorViewProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="default" style={styles.message}>
        {message}
      </ThemedText>
      {onRetry ? <Button label="Thử lại" variant="outline" onPress={onRetry} /> : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  message: { textAlign: 'center' },
});
