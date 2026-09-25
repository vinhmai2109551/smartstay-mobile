import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** "Why book with us" strip of three benefits. */
export function PerkRow() {
  const { t } = useTranslation();
  const theme = useTheme();

  const PERKS: { key: string; icon: keyof typeof Ionicons.glyphMap; title: string; caption: string }[] = useMemo(
    () => [
      { key: 'perk1', icon: 'flash-outline', title: t('perks.perk1Title'), caption: t('perks.perk1Caption') },
      { key: 'perk2', icon: 'pricetags-outline', title: t('perks.perk2Title'), caption: t('perks.perk2Caption') },
      { key: 'perk3', icon: 'chatbubbles-outline', title: t('perks.perk3Title'), caption: t('perks.perk3Caption') },
    ],
    [t],
  );

  return (
    <View style={styles.row}>
      {PERKS.map((perk, index) => (
        <Animated.View
          key={perk.key}
          entering={FadeInUp.duration(500).delay(150 + index * 100)}
          style={[styles.perk, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name={perk.icon} size={20} color={theme.primary} />
          </View>
          <ThemedText type="smallBold" style={styles.center} numberOfLines={1} adjustsFontSizeToFit>
            {perk.title}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.center} numberOfLines={2}>
            {perk.caption}
          </ThemedText>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Space.sm },
  perk: {
    flex: 1,
    alignItems: 'center',
    gap: Space.xs,
    paddingVertical: Space.md,
    paddingHorizontal: Space.sm,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  center: { textAlign: 'center' },
});
