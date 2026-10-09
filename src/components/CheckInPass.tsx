import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { FontFamily, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { toast } from '@/store/toastStore';
import { getBookingCode, getBookingQrPayload } from '@/utils/bookingQr';

// QR modules are always dark-on-white, whatever the app theme: scanners read that best.
const QR_DARK = '#111827';
const QR_LIGHT = '#FFFFFF';

type CheckInPassProps = {
  bookingId: string;
  // Extra lines under the code on the full-screen view (room, dates, guest name…).
  details?: string[];
  // 'card': standalone ticket (booking detail). 'inline': no card of its own, smaller QR —
  // for embedding in another card, like the booking-created card in the AI chat.
  variant?: 'card' | 'inline';
};

/**
 * Check-in pass for an upcoming booking: a QR of the bookingId that reception scans at
 * the desk (same payload as the web), plus the short booking code as a fallback.
 * Tapping the QR opens it full screen on white for easy scanning.
 */
export function CheckInPass({ bookingId, details = [], variant = 'card' }: CheckInPassProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  // Read outside the Modal: on iOS a Modal is its own window and safe-area views inside
  // it report no insets, which put the close button under the notch.
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);

  const inline = variant === 'inline';
  const payload = getBookingQrPayload({ bookingId });
  const code = getBookingCode(bookingId);
  const fullScreenSize = Math.round(Math.min(width - Space['3xl'] * 2, height * 0.45, 360));

  const copyCode = async () => {
    await Clipboard.setStringAsync(code);
    Haptics.selectionAsync();
    toast.success(t('checkInPass.codeCopied'));
  };

  const open = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(true);
  };

  return (
    <>
      <Card style={[styles.card, inline && styles.inlineCard]} padded={!inline} elevation={inline ? 'none' : 'card'}>
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="qr-code" size={18} color={theme.primary} />
          </View>
          <View style={styles.headerText}>
            <ThemedText type={inline ? 'smallBold' : 'bodyBold'}>{t('checkInPass.title')}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {t('checkInPass.hint')}
            </ThemedText>
          </View>
        </View>

        <Pressable
          accessibilityRole="imagebutton"
          accessibilityLabel={t('checkInPass.qrLabel', { code })}
          accessibilityHint={t('checkInPass.expandHint')}
          onPress={open}
          style={({ pressed }) => [styles.qrFrame, { borderColor: theme.border, opacity: pressed ? 0.85 : 1 }]}>
          <QRCode value={payload} size={inline ? 148 : 176} color={QR_DARK} backgroundColor={QR_LIGHT} ecl="M" />
          <View style={[styles.expandBadge, { backgroundColor: theme.primary }]}>
            <Ionicons name="expand" size={14} color={theme.primaryText} />
          </View>
        </Pressable>

        {/* Ticket-style perforation between the QR and the code */}
        {inline ? (
          <View style={[styles.dashes, { borderColor: theme.border }]} />
        ) : (
          <View style={styles.perforation}>
            <View style={[styles.notch, styles.notchLeft, { backgroundColor: theme.background }]} />
            <View style={[styles.dashes, { borderColor: theme.border }]} />
            <View style={[styles.notch, styles.notchRight, { backgroundColor: theme.background }]} />
          </View>
        )}

        <View style={styles.footer}>
          <View>
            <ThemedText type="caption" themeColor="textSecondary">
              {t('checkInPass.codeLabel')}
            </ThemedText>
            <ThemedText type={inline ? 'bodyBold' : 'heading'} style={styles.code}>
              {code}
            </ThemedText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('checkInPass.copyCode')}
            onPress={copyCode}
            hitSlop={8}
            style={({ pressed }) => [
              styles.copy,
              { backgroundColor: theme.primarySoft, opacity: pressed ? 0.7 : 1 },
            ]}>
            <Ionicons name="copy-outline" size={16} color={theme.primary} />
            <ThemedText type="smallBold" themeColor="primary">
              {t('checkInPass.copy')}
            </ThemedText>
          </Pressable>
        </View>
      </Card>

      <Modal visible={expanded} animationType="fade" onRequestClose={() => setExpanded(false)}>
        {/* Always white, so the QR has maximum contrast even in dark mode. */}
        <View
          style={[
            styles.fullScreen,
            { paddingTop: insets.top + Space.md, paddingBottom: insets.bottom + Space.lg },
          ]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            onPress={() => setExpanded(false)}
            hitSlop={12}
            style={({ pressed }) => [styles.close, { opacity: pressed ? 0.6 : 1 }]}>
            <Ionicons name="close" size={24} color={QR_DARK} />
          </Pressable>

          <View style={styles.fullContent}>
            <ThemedText type="heading" style={styles.fullTitle}>
              {t('checkInPass.title')}
            </ThemedText>
            <ThemedText type="small" style={styles.fullHint}>
              {t('checkInPass.hint')}
            </ThemedText>
            <View style={styles.fullQr}>
              <QRCode value={payload} size={fullScreenSize} color={QR_DARK} backgroundColor={QR_LIGHT} ecl="M" />
            </View>
            <ThemedText style={styles.fullCode}>{code}</ThemedText>
            {details.map((line) => (
              <ThemedText key={line} type="small" style={styles.fullMeta}>
                {line}
              </ThemedText>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
}

const NOTCH = 18;

const styles = StyleSheet.create({
  card: { gap: Space.lg, overflow: 'hidden' },
  inlineCard: { gap: Space.md, backgroundColor: 'transparent', borderWidth: 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  headerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, gap: 2 },
  qrFrame: {
    alignSelf: 'center',
    padding: Space.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: QR_LIGHT,
  },
  expandBadge: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perforation: { flexDirection: 'row', alignItems: 'center', marginHorizontal: -Space.lg },
  notch: { width: NOTCH, height: NOTCH, borderRadius: NOTCH / 2 },
  notchLeft: { marginLeft: -NOTCH / 2 },
  notchRight: { marginRight: -NOTCH / 2 },
  dashes: { flex: 1, borderTopWidth: 1.5, borderStyle: 'dashed', marginHorizontal: Space.xs },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.md },
  code: { letterSpacing: 2 },
  copy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
    borderRadius: Radius.full,
  },
  fullScreen: { flex: 1, backgroundColor: QR_LIGHT },
  close: {
    alignSelf: 'flex-end',
    marginRight: Space.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  fullContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Space.sm, padding: Space.xl },
  fullTitle: { color: QR_DARK },
  fullHint: { color: '#4B5563', textAlign: 'center' },
  fullQr: { marginVertical: Space.xl },
  fullCode: { color: QR_DARK, fontFamily: FontFamily.bold, fontSize: 28, lineHeight: 34, letterSpacing: 4 },
  fullMeta: { color: '#4B5563', textAlign: 'center' },
});
