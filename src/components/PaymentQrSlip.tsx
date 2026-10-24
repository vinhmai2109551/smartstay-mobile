import dayjs from "dayjs";
import { type Ref } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View, type ViewInstance } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { FontFamily } from "@/constants/theme";
import { PendingBooking } from "@/types/chat";
import { formatVND } from "@/utils/currency";
import { formatDate } from "@/utils/date";

// Fixed colours, not the theme: this slip is only ever captured as an image, and a
// saved payment slip must look the same (white, scannable) whatever the app theme.
const SLIP = {
  background: "#FFFFFF",
  text: "#111827",
  muted: "#6B7280",
  brand: "#2563EB",
  onBrand: "#FFFFFF",
  border: "#E5E7EB",
};

type PaymentQrSlipProps = {
  ref?: Ref<ViewInstance>;
  qrCode: string;
  amount: number;
  code: string;
  // Seconds since epoch, as PayOS returns it.
  expiredAt?: number;
  proposal: PendingBooking | null;
};

/**
 * The PayOS payment slip saved by "Lưu mã QR" in the AI chat: brand header, the QR with
 * a quiet zone, amount, booking code and the booking details. Rendered off screen and
 * captured with react-native-view-shot — never shown in the chat itself.
 */
export function PaymentQrSlip({ ref, qrCode, amount, code, expiredAt, proposal }: PaymentQrSlipProps) {
  const { t } = useTranslation();

  const rows: [string, string][] = [];
  if (proposal) {
    rows.push(
      [t("chat.slipRoom"), proposal.roomTypeName],
      [
        t("chat.slipStay"),
        `${formatDate(proposal.checkIn, "DD/MM")} – ${formatDate(proposal.checkOut, "DD/MM/YYYY")}`,
      ],
      [t("chat.slipGuest"), proposal.guestInfo.fullName],
    );
  }
  if (expiredAt) {
    rows.push([t("chat.slipDeadline"), dayjs.unix(expiredAt).format("HH:mm DD/MM/YYYY")]);
  }

  return (
    // collapsable={false}: Android may otherwise flatten this view away and view-shot
    // would have nothing to capture.
    <View ref={ref} collapsable={false} style={styles.slip}>
      <View style={styles.header}>
        <Text style={styles.brand}>VIKA HOTEL</Text>
        <Text style={styles.headerTitle}>{t("chat.slipTitle")}</Text>
      </View>

      <View style={styles.body}>
        {/* quietZone: the white margin scanners need around the code. */}
        <QRCode value={qrCode} size={220} quietZone={12} backgroundColor={SLIP.background} color={SLIP.text} />
        <Text style={styles.amount}>{formatVND(amount)}</Text>
        <Text style={styles.code}>{t("chat.bookingCode", { code })}</Text>

        {rows.length ? (
          <View style={styles.table}>
            {rows.map(([label, value]) => (
              <View key={label} style={styles.row}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.note}>{t("chat.slipNote")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slip: { width: 320, backgroundColor: SLIP.background, borderRadius: 16, overflow: "hidden" },
  header: { alignItems: "center", gap: 2, paddingVertical: 16, backgroundColor: SLIP.brand },
  brand: { fontFamily: FontFamily.bold, fontSize: 18, letterSpacing: 2, color: SLIP.onBrand },
  headerTitle: { fontFamily: FontFamily.medium, fontSize: 13, color: SLIP.onBrand },
  body: { alignItems: "center", gap: 12, padding: 20 },
  amount: { fontFamily: FontFamily.bold, fontSize: 24, color: SLIP.brand },
  code: { fontFamily: FontFamily.medium, fontSize: 13, color: SLIP.muted },
  table: {
    alignSelf: "stretch",
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: SLIP.border,
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  label: { fontFamily: FontFamily.medium, fontSize: 13, color: SLIP.muted },
  value: { flex: 1, textAlign: "right", fontFamily: FontFamily.semiBold, fontSize: 13, color: SLIP.text },
  note: { fontFamily: FontFamily.medium, fontSize: 12, color: SLIP.muted, textAlign: "center" },
});
