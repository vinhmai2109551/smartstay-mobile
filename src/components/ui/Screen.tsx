import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Space } from '@/constants/theme';

type ScreenProps = ScrollViewProps & {
  scroll?: boolean;
  padded?: boolean;
};

export function Screen({ scroll = true, padded = true, contentContainerStyle, children, ...rest }: ScreenProps) {
  const Container = scroll ? ScrollView : View;
  const containerStyle = [styles.centered, padded && styles.padded, scroll && contentContainerStyle];

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <Container
          style={scroll ? styles.flex : [styles.flex, styles.centered, padded && styles.padded]}
          contentContainerStyle={scroll ? containerStyle : undefined}
          {...(scroll
            ? {
                keyboardShouldPersistTaps: 'handled' as const,
                automaticallyAdjustKeyboardInsets: true,
                showsVerticalScrollIndicator: false,
                ...rest,
              }
            : {})}>
          {children}
        </Container>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // Caps line length on tablets / landscape.
  centered: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  padded: { padding: Space.xl, gap: Space.lg },
});
