import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type ScreenProps = ScrollViewProps & {
  scroll?: boolean;
  padded?: boolean;
};

export function Screen({ scroll = true, padded = true, contentContainerStyle, children, ...rest }: ScreenProps) {
  const Container = scroll ? ScrollView : View;
  const containerStyle = [padded && styles.padded, scroll && contentContainerStyle];

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <Container
          style={scroll ? styles.flex : [styles.flex, padded && styles.padded]}
          contentContainerStyle={scroll ? containerStyle : undefined}
          {...(scroll ? rest : {})}>
          {children}
        </Container>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: { padding: Spacing.three, gap: Spacing.three },
});
