import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type ViewInstance } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { fetchVietQrBankApps, buildBankDeeplink, findBankNameByBin, VietQrBankApp } from '@/api/vietqrBanks';
import { BankPickerSheet } from '@/components/BankPickerSheet';
import { PaymentQrSlip } from '@/components/PaymentQrSlip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorView } from '@/components/ui/ErrorView';
import { Skeleton } from '@/components/ui/Skeleton';
import { FontFamily, MaxContentWidth, Radius, Space } from '@/constants/theme';
import { usePayosCheckout } from '@/hooks/usePayosCheckout';
import { useShadows, useTheme } from '@/hooks/use-theme';
import { plainStorage } from '@/store/persistedStorage';
import { toast } from '@/store/toastStore';
import { getBookingCode } from '@/utils/bookingQr';
import { formatVND } from '@/utils/currency';
import { saveImageToLibrary } from '@/utils/saveQr';

const RECENT_BANK_STORAGE_KEY = 'checkout.lastBankAppId';

export default function CheckoutScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const steps = useMemo(() => [t('checkout.step1'), t('checkout.step2'), t('checkout.step3')], [t]);
  const shadows = useShadows();
  const { width } = useWindowDimensions();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { phase, link, amount, error, regenerate } = usePayosCheckout(bookingId);
  const [bankApps, setBankApps] = useState<VietQrBankApp[]>([]);
  const [bankAppsLoading, setBankAppsLoading] = useState(false);
  const [bankSheetVisible, setBankSheetVisible] = useState(false);
  const [recentBankAppId, setRecentBankAppId] = useState<string | null>(null);
  // Phiếu thanh toán dựng ngoài màn hình (PaymentQrSlip) — chụp lại thành ảnh khi lưu.
  const slipRef = useRef<ViewInstance>(null);

  const qrSize = Math.round(Math.min(Math.min(width, MaxContentWidth) - Space['4xl'] * 2, 260));

  useEffect(() => {
    let cancelled = false;
    Promise.resolve(plainStorage.getItem(RECENT_BANK_STORAGE_KEY)).then((value) => {
      if (!cancelled && value) setRecentBankAppId(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!link?.accountNumber || !link?.bin) return;
    let cancelled = false;

    async function loadBanks() {
      setBankAppsLoading(true);
      try {
        const apps = await fetchVietQrBankApps();
        if (!cancelled) setBankApps(apps);
      } catch {
        // ignore — bank name lookup/picker just won't be available this session
      } finally {
        if (!cancelled) setBankAppsLoading(false);
      }
    }

    loadBanks();
    return () => {
      cancelled = true;
    };
  }, [link?.accountNumber, link?.bin]);

  const bankName = useMemo(() => findBankNameByBin(bankApps, link?.bin), [bankApps, link?.bin]);

  const copyToClipboard = useCallback(
    async (value: string) => {
      await Clipboard.setStringAsync(value);
      Haptics.selectionAsync();
      toast.success(t('checkout.copied'));
    },
    [t],
  );

  const handleSelectBank = useCallback(
    async (app: VietQrBankApp) => {
      setBankSheetVisible(false);
      if (!link) return;
      try {
        await Linking.openURL(buildBankDeeplink(app.appId, link));
        setRecentBankAppId(app.appId);
        plainStorage.setItem(RECENT_BANK_STORAGE_KEY, app.appId);
      } catch {
        toast.error(t('checkout.openBankAppFailed'));
      }
    },
    [link, t],
  );

  // Cùng cách lưu với thẻ đặt phòng trong chat (ChatBookingCreatedCard): chụp phiếu
  // thanh toán dựng sẵn ngoài màn hình rồi lưu vào thư viện ảnh.
  const handleSaveQr = async () => {
    try {
      const uri = await captureRef(slipRef, { format: 'png', quality: 1, result: 'tmpfile' });
      const result = await saveImageToLibrary(uri, `vika-payos-${getBookingCode(bookingId)}.png`);
      if (result === 'saved') toast.success(t('chat.qrSaved'));
      else toast.error(t('chat.qrPermissionDenied'));
    } catch {
      toast.error(t('chat.qrSaveFailed'));
    }
  };

  if (phase === 'loading') {
    return (
      <ThemedView style={styles.loading}>
        <Skeleton width={qrSize + Space['2xl']} height={qrSize + Space['2xl']} radius={Radius.lg} />
        <Skeleton width="60%" height={20} />
      </ThemedView>
    );
  }
  if (phase === 'error' || !link) {
    return <ErrorView message={error ?? t('checkout.createLinkMissing')} onRetry={regenerate} />;
  }

  const hasBankInfo = !!link.accountNumber && !!link.bin;
  const isExpired = phase === 'expired';

  if (phase === 'paid') {
    return (
      <ThemedView style={styles.success}>
        <Animated.View entering={ZoomIn.springify().damping(14)} style={[styles.successCircle, { backgroundColor: theme.primarySoft }]}>
          <View style={[styles.successInner, { backgroundColor: theme.success }]}>
            <Ionicons name="checkmark" size={44} color="#FFFFFF" />
          </View>
        </Animated.View>
        <View style={styles.successText}>
          <ThemedText type="title" style={styles.center}>
            {t('checkout.successTitle')}
          </ThemedText>
          <ThemedText type="body" themeColor="textSecondary" style={styles.center}>
            {t('checkout.successSubtitle')}
          </ThemedText>
        </View>
        <Button label={t('checkout.viewBooking')} onPress={() => router.replace(`/booking/${bookingId}`)} />
      </ThemedView>
    );
  }

  if (phase === 'failed') {
    return (
      <ThemedView style={styles.success}>
        <View style={[styles.successCircle, { backgroundColor: `${theme.danger}1A` }]}>
          <View style={[styles.successInner, { backgroundColor: theme.danger }]}>
            <Ionicons name="close" size={44} color="#FFFFFF" />
          </View>
        </View>
        <View style={styles.successText}>
          <ThemedText type="title" style={styles.center}>
            {t('checkout.failedTitle')}
          </ThemedText>
          <ThemedText type="body" themeColor="textSecondary" style={styles.center}>
            {t('checkout.failedSubtitle')}
          </ThemedText>
        </View>
        <Button label={t('checkout.viewBooking')} onPress={() => router.replace(`/booking/${bookingId}`)} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.center}>
            {t('checkout.scanTitle')}
          </ThemedText>
          {amount != null ? (
            <View style={styles.amountBlock}>
              <ThemedText type="small" themeColor="textSecondary">
                {t('checkout.amountLabel')}
              </ThemedText>
              <ThemedText style={[styles.amount, { color: theme.primary }]}>{formatVND(amount)}</ThemedText>
            </View>
          ) : null}
        </View>

        {/* QR codes must stay dark-on-white to scan reliably, even in dark mode. */}
        {!isExpired && link.qrCode ? (
          <View style={[styles.qrCard, shadows.floating]}>
            <QRCode value={link.qrCode} size={qrSize} backgroundColor="#FFFFFF" color="#111827" />
            <View style={styles.payosRow}>
              <Ionicons name="shield-checkmark" size={14} color="#047857" />
              <ThemedText type="caption" style={styles.payosText}>
                {t('checkout.payosSecure')}
              </ThemedText>
            </View>
          </View>
        ) : !isExpired ? (
          <Card style={styles.qrMissingCard}>
            <Ionicons name="qr-code-outline" size={22} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
              {t('checkout.qrUnavailable')}
            </ThemedText>
          </Card>
        ) : null}

        {!isExpired && link.qrCode ? (
          <>
            <Button label={t('chat.paySaveQr')} icon="download-outline" onPress={handleSaveQr} />
            {/* Đẩy ra ngoài màn hình thay vì ẩn: display:none thì không được vẽ (không
                chụp được), opacity:0 thì ảnh chụp ra trong suốt. */}
            <View style={styles.offscreen} pointerEvents="none">
              <PaymentQrSlip
                ref={slipRef}
                qrCode={link.qrCode}
                amount={amount ?? link.amount ?? 0}
                code={getBookingCode(bookingId)}
                expiredAt={link.expiredAt}
                proposal={null}
              />
            </View>
          </>
        ) : null}

        {!isExpired && hasBankInfo ? (
          <Button
            label={t('checkout.openBankApp')}
            icon="business-outline"
            variant="outline"
            accessibilityLabel={t('checkout.openBankApp')}
            onPress={() => setBankSheetVisible(true)}
          />
        ) : null}

        <View style={[styles.statusPill, { backgroundColor: isExpired ? `${theme.danger}14` : theme.primarySoft }]}>
          {isExpired ? (
            <Ionicons name="time-outline" size={16} color={theme.danger} />
          ) : (
            <ActivityIndicator size="small" color={theme.primary} />
          )}
          <ThemedText type="small" themeColor={isExpired ? 'danger' : 'primary'} style={styles.flexShrink}>
            {isExpired ? t('checkout.expired') : t('checkout.waiting')}
          </ThemedText>
        </View>

        {isExpired ? (
          <Button label={t('checkout.regenerateLink')} icon="refresh" onPress={regenerate} />
        ) : (
          <>
            {hasBankInfo ? (
              <Card style={styles.transferCard}>
                <ThemedText type="bodyBold">{t('checkout.transferInfoTitle')}</ThemedText>

                <View style={styles.transferRow}>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {t('checkout.bankNameLabel')}
                  </ThemedText>
                  <ThemedText type="smallBold" style={styles.flexShrink}>
                    {bankName ?? link.bin}
                  </ThemedText>
                </View>

                <View style={styles.transferRow}>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {t('checkout.accountNameLabel')}
                  </ThemedText>
                  <ThemedText type="smallBold" style={styles.flexShrink}>
                    {link.accountName}
                  </ThemedText>
                </View>

                <View style={styles.transferRow}>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {t('checkout.accountNumberLabel')}
                  </ThemedText>
                  <View style={styles.copyValue}>
                    <ThemedText type="smallBold" style={styles.flexShrink}>
                      {link.accountNumber}
                    </ThemedText>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('checkout.copyLabel', { label: t('checkout.accountNumberLabel') })}
                      hitSlop={10}
                      onPress={() => link.accountNumber && copyToClipboard(link.accountNumber)}>
                      <Ionicons name="copy-outline" size={18} color={theme.primary} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.transferRow}>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {t('checkout.amountLabel')}
                  </ThemedText>
                  <View style={styles.copyValue}>
                    <ThemedText type="smallBold" style={styles.flexShrink}>
                      {formatVND(amount ?? link.amount)}
                    </ThemedText>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('checkout.copyLabel', { label: t('checkout.amountLabel') })}
                      hitSlop={10}
                      onPress={() => {
                        const value = amount ?? link.amount;
                        if (value != null) copyToClipboard(String(value));
                      }}>
                      <Ionicons name="copy-outline" size={18} color={theme.primary} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.transferRow}>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {t('checkout.transferContentLabel')}
                  </ThemedText>
                  <View style={styles.copyValue}>
                    <ThemedText type="smallBold" style={styles.flexShrink}>
                      {link.description}
                    </ThemedText>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('checkout.copyLabel', { label: t('checkout.transferContentLabel') })}
                      hitSlop={10}
                      onPress={() => link.description && copyToClipboard(link.description)}>
                      <Ionicons name="copy-outline" size={18} color={theme.primary} />
                    </Pressable>
                  </View>
                </View>

                <View style={[styles.transferNote, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name="alert-circle-outline" size={16} color={theme.accentText} />
                  <ThemedText type="caption" themeColor="accentText" style={styles.flexShrink}>
                    {t('checkout.transferContentNote')}
                  </ThemedText>
                </View>
              </Card>
            ) : null}

            <Card style={styles.steps}>
              <ThemedText type="bodyBold">{t('checkout.instructions')}</ThemedText>
              {steps.map((step, index) => (
                <View key={step} style={styles.step}>
                  <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
                    <ThemedText type="caption" style={{ color: theme.primaryText }}>
                      {index + 1}
                    </ThemedText>
                  </View>
                  <ThemedText type="small" style={styles.flexShrink}>
                    {step}
                  </ThemedText>
                </View>
              ))}
            </Card>

            <Button
              label={t('checkout.openCheckout')}
              icon="open-outline"
              variant="outline"
              onPress={() => WebBrowser.openBrowserAsync(link.checkoutUrl)}
            />
          </>
        )}
      </ScrollView>

      <BankPickerSheet
        visible={bankSheetVisible}
        onClose={() => setBankSheetVisible(false)}
        banks={bankApps}
        loading={bankAppsLoading}
        recentAppId={recentBankAppId}
        onSelect={handleSelectBank}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  center: { textAlign: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Space.xl },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    alignItems: 'stretch',
    padding: Space.lg,
    paddingTop: Space['2xl'],
    gap: Space.xl,
    paddingBottom: Space['4xl'],
  },
  header: { gap: Space.md, alignItems: 'center' },
  amountBlock: { alignItems: 'center', gap: 2 },
  amount: { fontFamily: FontFamily.bold, fontSize: 30, lineHeight: 38 },
  offscreen: { position: 'absolute', left: -10000, top: 0 },
  qrCard: {
    alignSelf: 'center',
    alignItems: 'center',
    gap: Space.md,
    padding: Space.lg,
    borderRadius: Radius.lg,
    backgroundColor: '#FFFFFF',
  },
  qrMissingCard: { alignItems: 'center', gap: Space.sm },
  payosRow: { flexDirection: 'row', alignItems: 'center', gap: Space.xs },
  payosText: { color: '#374151' },
  transferCard: { gap: Space.md },
  transferRow: { gap: 2 },
  copyValue: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.sm },
  transferNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    padding: Space.sm,
    borderRadius: Radius.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.sm,
    paddingHorizontal: Space.lg,
    paddingVertical: Space.md,
    borderRadius: Radius.full,
  },
  steps: { gap: Space.md },
  step: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  stepNumber: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  success: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space['2xl'],
    padding: Space['2xl'],
  },
  successCircle: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  successInner: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  successText: { gap: Space.sm, maxWidth: 340 },
});
