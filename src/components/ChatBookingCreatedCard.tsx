import { paymentsApi } from "@/api/payments";
import { useTheme } from "@/hooks/use-theme";
import { ConfirmedBooking, PendingBooking } from "@/types/chat";
import { getBookingCode } from "@/utils/bookingQr";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Card } from "./ui/Card";
import { ThemedText } from "./themed-text";
import { formatVND } from "@/utils/currency";
import { Button } from "./ui/Button";
import { CheckInPass } from "./CheckInPass";
import { Radius, Space } from "@/constants/theme";
import { formatDate } from "@/utils/date";

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
    isPayOS && !!booking.expiredAt && Date.now() / 1000 > booking.expiredAt,
  );

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
  const showTicket = (!isPayOS || paid) && booking.status !== "CANCELLED";
  const tone = awaitingPayment ? theme.accentText : theme.success;
  return (
    <Card
      style={[
        styles.card,
        {
          width,
          borderColor: awaitingPayment
            ? theme.accentBorder
            : theme.successBorder,
          backgroundColor: awaitingPayment
            ? theme.accentSoft
            : theme.successSoft,
        },
      ]}
    >
      <View style={styles.header}>
        <Ionicons
          name={awaitingPayment ? "time-outline" : "checkmark-circle"}
          size={24}
          color={tone}
        />
        <View style={styles.flex}>
          <ThemedText type="smallBold" style={{ color: tone }}>
            {t(
              awaitingPayment
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
            />
            {booking.checkoutUrl ? (
              <Button
                label={t("chat.payOpenPage")}
                size="sm"
                onPress={() =>
                  WebBrowser.openBrowserAsync(booking.checkoutUrl!)
                }
              />
            ) : null}
            <View style={styles.inlineRow}>
              <ActivityIndicator size="small" color={QR_BOX_MUTED} />
              <ThemedText
                type="caption"
                style={[styles.flex, { color: QR_BOX_MUTED }]}
              >
                {t("chat.payWaiting")}
              </ThemedText>
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
      {showTicket ? (
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
  card: { gap: Space.md, borderWidth: 2 },
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
});
