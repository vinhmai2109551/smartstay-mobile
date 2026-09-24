import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const PERKS: { icon: keyof typeof Ionicons.glyphMap; title: string; caption: string }[] = [
  { icon: 'flash-outline', title: 'Xác nhận ngay', caption: 'Mã đặt phòng tức thì' },
  { icon: 'pricetags-outline', title: 'Giá tốt nhất', caption: 'Khi đặt trực tiếp' },
  { icon: 'chatbubbles-outline', title: 'Hỗ trợ 24/7', caption: 'Trợ lý AI luôn sẵn sàng' },
];

/** "Why book with us" strip of three benefits. */
export function PerkRow() {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {PERKS.map((perk, index) => (
        <Animated.View
          key={perk.title}
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
