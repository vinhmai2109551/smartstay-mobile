import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Promotion } from '@/types/promotion';
import { formatVND } from '@/utils/currency';

type PromoTicketProps = {
  promotion: Promotion;
};

const NOTCH = 18;

function discountLabel(promotion: Promotion) {
  return promotion.discountType === 'PERCENTAGE'
    ? `Giảm ${promotion.discountValue}%`
    : `Giảm ${formatVND(promotion.discountValue)}`;
}

/** Promotion banner styled as a ticket with a dashed tear line; tap to copy the code. */
export function PromoTicket({ promotion }: PromoTicketProps) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(promotion.code);
    setCopied(true);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${discountLabel(promotion)}. Mã ${promotion.code}. Nhấn để sao chép mã`}
      accessibilityHint="Sao chép mã khuyến mãi"
      onPress={handleCopy}
      style={({ pressed }) => [styles.ticket, { backgroundColor: theme.primary, opacity: pressed ? 0.92 : 1 }]}>
      <View style={styles.left}>
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.16)' }]}>
          <Ionicons name="pricetags" size={20} color={theme.primaryText} />
        </View>
        <View style={styles.leftText}>
          <ThemedText type="heading" style={{ color: theme.primaryText }}>
            {discountLabel(promotion)}
          </ThemedText>
          {promotion.description ? (
            <ThemedText type="small" style={{ color: theme.primaryText }} numberOfLines={2}>
              {promotion.description}
            </ThemedText>
          ) : null}
        </View>
      </View>

      {/* Tear line: dashed divider with half-circle notches cut from the page background. */}
      <View style={styles.tear}>
        <View style={[styles.notch, styles.notchTop, { backgroundColor: theme.background }]} />
        <View style={[styles.dashed, { borderColor: 'rgba(255,255,255,0.55)' }]} />
        <View style={[styles.notch, styles.notchBottom, { backgroundColor: theme.background }]} />
      </View>

      <View style={styles.right}>
        <ThemedText type="caption" style={{ color: theme.primaryText }}>
          {copied ? 'Đã sao chép' : 'Mã'}
        </ThemedText>
        <ThemedText style={[styles.code, { color: theme.primaryText }]} numberOfLines={1} adjustsFontSizeToFit>
          {promotion.code}
        </ThemedText>
        <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={theme.primaryText} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ticket: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    minHeight: 96,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    padding: Space.lg,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftText: {
    flex: 1,
    gap: 2,
  },
  tear: {
    width: NOTCH,
    alignItems: 'center',
  },
  notch: {
    width: NOTCH,
    height: NOTCH / 2,
  },
  notchTop: {
    borderBottomLeftRadius: NOTCH,
    borderBottomRightRadius: NOTCH,
  },
  notchBottom: {
    borderTopLeftRadius: NOTCH,
    borderTopRightRadius: NOTCH,
  },
  dashed: {
    flex: 1,
    width: 0,
    borderLeftWidth: 1.5,
    borderStyle: 'dashed',
    marginVertical: Space.xs,
  },
  right: {
    width: 104,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: Space.sm,
  },
  code: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 1,
  },
});
