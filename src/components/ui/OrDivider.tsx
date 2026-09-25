import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function OrDivider({ label }: { label?: string }) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <View style={[styles.line, { backgroundColor: theme.border }]} />
      <ThemedText type="caption" themeColor="textSecondary">
        {label ?? t('common.or')}
      </ThemedText>
      <View style={[styles.line, { backgroundColor: theme.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    marginVertical: Space.xs,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
});
