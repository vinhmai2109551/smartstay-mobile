import { bookingsApi } from "@/api/bookings";
import { paymentsApi } from "@/api/payments";
import { useBookingUpdates } from "@/hooks/useBookingUpdates";
import { useTheme } from "@/hooks/use-theme";
import { ConfirmedBooking, PendingBooking } from "@/types/chat";
import { BookingStatus } from "@/types/booking";
import { canShowCheckInPass, getBookingCode } from "@/utils/bookingQr";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { captureRef } from "react-native-view-shot";
import { Card } from "./ui/Card";
import { ThemedText } from "./themed-text";
import { formatVND } from "@/utils/currency";
import { Button } from "./ui/Button";
import { CheckInPass } from "./CheckInPass";
import { PaymentQrSlip } from "./PaymentQrSlip";
import { Radius, Space } from "@/constants/theme";
import { formatDate } from "@/utils/date";
import { saveImageToLibrary } from "@/utils/saveQr";
import { toast } from "@/store/toastStore";

const PAYOS_POLL_INTERVAL_MS = 5000;
// Khung QR luôn nền trắng (máy quét đọc tốt nhất), nên chữ phụ trong khung phải dùng màu
// cố định - textSecondary của dark mode gần như không đọc được trên nền trắng.
const QR_BOX_MUTED = "#6B7280";

export function ChatBookingCreatedCard({
  booking,
  proposal,
  width,
}: {
  booking: ConfirmedBooking;
  proposal: PendingBooking | null;
  width: number;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  const isPayOS = booking.paymentMethod === "PAYOS";
  const code = getBookingCode(booking.bookingId);
  const [paid, setPaid] = useState(false);
  const [checking, setChecking] = useState(isPayOS);
  const [expired, setExpired] = useState(
    () =>
      isPayOS && !!booking.expiredAt && Date.now() / 1000 > booking.expiredAt,
  );
  // Dữ liệu booking trong tin nhắn là ảnh chụp lúc vừa tạo đơn — status có thể đã đổi
  // (lễ tân xác nhận đơn CASH chẳng hạn) nếu khách vẫn đang xem lại thẻ này trong chat.
  const [liveStatus, setLiveStatus] = useState<BookingStatus>(booking.status);
  // Phiếu thanh toán dựng ngoài màn hình (PaymentQrSlip) — chụp lại thành ảnh khi lưu.
  const slipRef = useRef<View>(null);

  useBookingUpdates(() => {
    bookingsApi
      .detail(booking.bookingId)
      .then((fresh) => {
        setLiveStatus(fresh.status);
        if (fresh.paymentStatus === "PAID") setPaid(true);
      })
      .catch(() => {
        // Lỗi mạng tạm thời: giữ trạng thái hiện có, event sau sẽ thử lại.
      });
  });

  // Dữ liệu booking trong tin nhắn là ảnh chụp lúc vừa tạo đơn (luôn UNPAID). Hỏi trạng
  // thái thật mỗi lần thẻ hiện ra, KỂ CẢ khi QR đã hết hạn: khách có thể đã chuyển khoản
  // rồi mới mở lại lịch sử chat.
  useEffect(() => {
    if (!isPayOS) return;
    let cancelled = false;
    paymentsApi
      .syncPayosStatus(booking.bookingId)
      .then((result) => {
        if (!cancelled && result.paymentStatus === "PAID") {
          setPaid(true);
        }
      })
      .catch(() => {
        // Lỗi mạng: giữ trạng thái chờ, effect hỏi lặp bên dưới sẽ thử lại.
      })
      .finally(() => {
        if (!cancelled) {
          setChecking(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [booking.bookingId, isPayOS]);

  // Chỉ hỏi lặp khi còn QR để quét, chưa trả và chưa hết hạn - giống màn checkout.
  useEffect(() => {
    if (!isPayOS || !booking.qrCode || paid || expired) {
      return;
    }
    const id = setInterval(async () => {
      if (booking.expiredAt && Date.now() / 1000 > booking.expiredAt) {
        setExpired(true);
        return; // effect chạy lại vì expired đổi, cleanup sẽ clearInterval
      }
      try {
        const result = await paymentsApi.syncPayosStatus(booking.bookingId);
        if (result.paymentStatus === "PAID") setPaid(true);
      } catch {
        // bỏ qua lỗi mạng tạm thời
      }
    }, PAYOS_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [
    isPayOS,
    booking.qrCode,
    booking.expiredAt,
    booking.bookingId,
    paid,
    expired,
  ]);

  const awaitingPayment = isPayOS && !paid;
  const showCheckInPass = canShowCheckInPass({
    status: liveStatus,
    paymentMethod: booking.paymentMethod,
    paymentStatus: paid ? "PAID" : "UNPAID",
  });
  // CASH booking the hotel hasn't confirmed yet — PAYOS unpaid already has its own
  // scan/expired/checking UI below, so this only covers the "waiting on staff" gap.
  const awaitingConfirmation =
    !awaitingPayment &&
    !showCheckInPass &&
    liveStatus !== "CANCELLED" &&
    liveStatus !== "CHECKED_OUT";
  const tone =
    awaitingPayment || awaitingConfirmation ? theme.accentText : theme.success;
  const handleSavePaymentQr = async () => {
    try {
      const uri = await captureRef(slipRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
      const result = await saveImageToLibrary(uri, `vika-payos-${code}.png`);
      if (result === "saved") toast.success(t("chat.qrSaved"));
      else toast.error(t("chat.qrPermissionDenied"));
    } catch {
      toast.error(t("chat.qrSaveFailed"));
    }
  };

  return (
    <Card
      style={[
        styles.card,
        {
          width,
          borderColor:
            awaitingPayment || awaitingConfirmation
              ? theme.accentBorder
              : theme.successBorder,
          backgroundColor:
            awaitingPayment || awaitingConfirmation
              ? theme.accentSoft
              : theme.successSoft,
        },
      ]}
    >
      <View style={styles.header}>
        <Ionicons
          name={
            awaitingPayment || awaitingConfirmation
              ? "time-outline"
              : "checkmark-circle"
          }
          size={24}
          color={tone}
        />
        <View style={styles.flex}>
          <ThemedText
            type="smallBold"
            style={{ color: tone }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {t(
              awaitingPayment || awaitingConfirmation
                ? "chat.bookingAwaitingTitle"
                : "chat.bookingSuccessTitle",
            )}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {t("chat.bookingCode", { code })}
          </ThemedText>
          <ThemedText type="smallBold" style={{ color: tone }}>
            {t("chat.bookingTotal", { amount: formatVND(booking.totalAmount) })}
          </ThemedText>
        </View>
      </View>
      {awaitingPayment ? (
        expired && checking ? (
          <View style={styles.inlineRow}>
            <ActivityIndicator size="small" color={theme.textSecondary} />
            <ThemedText type="caption" themeColor="textSecondary">
              {t("chat.payChecking")}
            </ThemedText>
          </View>
        ) : expired ? (
          <View
            style={[
              styles.notice,
              {
                backgroundColor: theme.accentSoft,
                borderColor: theme.accentBorder,
              },
            ]}
          >
            <ThemedText type="caption" style={{ color: theme.accentText }}>
              {t("chat.payExpired")}
            </ThemedText>
          </View>
        ) : booking.qrCode ? (
          <View style={[styles.qrBox, { borderColor: theme.accentBorder }]}>
            <View style={styles.inlineRow}>
              <Ionicons
                name="qr-code-outline"
                size={14}
                color={theme.accentText}
              />
              <ThemedText
                type="caption"
                style={[styles.bold, { color: theme.accentText }]}
              >
                {t("chat.payScanTitle")}
              </ThemedText>
            </View>
            <QRCode
              value={booking.qrCode}
              size={160}
              backgroundColor="#FFFFFF"
              color="#111827"
              quietZone={8}
            />
            <View style={styles.qrActions}>
              <View style={styles.flex}>
                <Button
                  label={t("chat.paySaveQr")}
                  variant="outline"
                  size="sm"
                  icon="download-outline"
                  onPress={handleSavePaymentQr}
                />
              </View>
              {booking.checkoutUrl ? (
                <View style={styles.flex}>
                  <Button
                    label={t("chat.payOpenPage")}
                    size="sm"
                    onPress={() =>
                      WebBrowser.openBrowserAsync(booking.checkoutUrl!)
                    }
                  />
                </View>
              ) : null}
            </View>

            <View style={styles.inlineRow}>
              <ActivityIndicator size="small" color={QR_BOX_MUTED} />
              <ThemedText
                type="caption"
                style={[styles.flex, { color: QR_BOX_MUTED }]}
              >
                {t("chat.payWaiting")}
              </ThemedText>
            </View>

            {/* Đẩy ra ngoài màn hình thay vì ẩn: display:none thì không được vẽ (không
                chụp được), opacity:0 thì ảnh chụp ra trong suốt. */}
            <View style={styles.offscreen} pointerEvents="none">
              <PaymentQrSlip
                ref={slipRef}
                qrCode={booking.qrCode}
                amount={booking.totalAmount}
                code={code}
                expiredAt={booking.expiredAt}
                proposal={proposal}
              />
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.notice,
              {
                backgroundColor: theme.accentSoft,
                borderColor: theme.accentBorder,
              },
            ]}
          >
            <ThemedText type="caption" style={{ color: theme.accentText }}>
              {t("chat.payNoQr")}
            </ThemedText>
          </View>
        )
      ) : null}
      {awaitingConfirmation ? (
        <View
          style={[
            styles.notice,
            {
              backgroundColor: theme.accentSoft,
              borderColor: theme.accentBorder,
            },
          ]}
        >
          <ThemedText type="caption" style={{ color: theme.accentText }}>
            {t("booking.checkInLockedConfirmation")}
          </ThemedText>
        </View>
      ) : null}
      {showCheckInPass ? (
        <>
          {isPayOS ? (
            <View style={styles.inlineRow}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={theme.success}
              />
              <ThemedText
                type="caption"
                style={[styles.bold, { color: theme.success }]}
              >
                {t("chat.payReceived")}
              </ThemedText>
            </View>
          ) : null}
          <CheckInPass
            variant="inline"
            bookingId={booking.bookingId}
            details={
              proposal
                ? [
                    `${proposal.roomTypeName} · ${formatDate(proposal.checkIn, "DD/MM")} – ${formatDate(proposal.checkOut, "DD/MM/YYYY")}`,
                    proposal.guestInfo.fullName,
                  ]
                : []
            }
          />
        </>
      ) : null}
      {!isPayOS ? (
        <View style={styles.inlineRow}>
          <Ionicons name="cash-outline" size={14} color={theme.success} />
          <ThemedText type="caption" style={styles.flex}>
            {t("chat.payCashNote")}
          </ThemedText>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push(`/booking/${booking.bookingId}`)}
        hitSlop={8}
        style={styles.link}
      >
        <ThemedText type="smallBold" themeColor="primary">
          {t("chat.viewBookingDetail")}
        </ThemedText>
        <Ionicons name="arrow-forward" size={16} color={theme.primary} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Space.md, borderWidth: 2, padding: Space.md },
  header: { flexDirection: "row", alignItems: "flex-start", gap: Space.md },
  flex: { flex: 1 },
  bold: { fontWeight: "700" },
  inlineRow: { flexDirection: "row", alignItems: "center", gap: Space.xs },
  notice: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
  },
  qrBox: {
    alignItems: "center",
    gap: Space.sm,
    padding: Space.md,
    borderWidth: 1,
    borderRadius: Radius.md,
    backgroundColor: "#FFFFFF", // luôn trắng: máy quét đọc QR tốt nhất trên nền trắng
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.xs,
    minHeight: 28,
  },
  qrActions: { flexDirection: "row", gap: Space.sm, alignSelf: "stretch" },
  offscreen: { position: "absolute", left: -10000, top: 0 },
});
