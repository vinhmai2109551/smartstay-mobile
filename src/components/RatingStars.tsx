import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function RatingStars({ rating, size = 14 }: { rating?: number; size?: number }) {
  const theme = useTheme();
  const value = rating ?? 0;

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={value >= i ? 'star' : value >= i - 0.5 ? 'star-half' : 'star-outline'}
          size={size}
          color={theme.warning}
        />
      ))}
      {rating !== undefined ? (
        <ThemedText type="small" themeColor="textSecondary">
          {rating.toFixed(1)}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
