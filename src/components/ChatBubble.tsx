import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";

import { ChatBookingForm } from "@/components/ChatBookingForm";
import { CheckInPass } from "@/components/CheckInPass";
import { RoomTypeCard } from "@/components/RoomTypeCard";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FontFamily, MaxContentWidth, Radius, Space } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ChatMessage, PendingBooking } from "@/types/chat";
import { formatVND } from "@/utils/currency";
import { formatDate } from "@/utils/date";

// Rooms shown before "Show n more" when a reply still lists many.
const COLLAPSED_ROOMS = 2;

// Renders the **bold** spans the AI writes in markdown; everything else stays plain text.
function renderInlineMarkdown(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <ThemedText key={i} style={styles.bold}>
        {part.slice(2, -2)}
      </ThemedText>
    ) : (
      part
    ),
  );
}

export function ChatBubble({
  message,
  onConfirmBooking,
  onCancelProposal,
  confirming,
  showBookingForm,
  onSubmitBookingForm,
  onCancelBookingForm,
  busy,
  proposal,
  showProposal,
}: {
  message: ChatMessage;
  onConfirmBooking?: (proposalId: string) => void;
  onCancelProposal?: (proposalId: string) => void;
  confirming?: boolean;
  showBookingForm?: boolean;
  onSubmitBookingForm?: (text: string) => void;
  onCancelBookingForm?: () => void;
  // A reply is on its way — blocks sending another message from the cards.
  busy?: boolean;
  // The proposal this booking was created from, for the room/dates/name on the full-screen QR.
  proposal?: PendingBooking | null;
  showProposal?: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isUser = message.role === "USER";
  const [showAllRooms, setShowAllRooms] = useState(false);
  const rooms = message.rooms ?? [];
  const visibleRooms = showAllRooms ? rooms : rooms.slice(0, COLLAPSED_ROOMS);
  const hiddenRooms = rooms.length - visibleRooms.length;
  // Rich cards take ~3/4 of the screen, capped for tablets.
  const cardWidth = Math.round(
    Math.min(Math.min(width, MaxContentWidth) * 0.74, 320),
  );

  return (
    <View
      style={[styles.container, isUser ? styles.alignEnd : styles.alignStart]}
    >
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.bubbleUser, { backgroundColor: theme.primary }]
            : [
                styles.bubbleAssistant,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ],
        ]}
      >
        <ThemedText
          type="body"
          style={{ color: isUser ? theme.primaryText : theme.text }}
        >
          {isUser ? message.content : renderInlineMarkdown(message.content)}
        </ThemedText>
      </View>

      {rooms.length ? (
        <View style={[styles.cards, { width: cardWidth }]}>
          {visibleRooms.map((roomType) => (
            <RoomTypeCard
              key={roomType.roomTypeId}
              roomType={roomType}
              imageHeight={140}
              onPress={() => router.push(`/room/${roomType.roomTypeId}`)}
            />
          ))}
          {hiddenRooms > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowAllRooms(true)}
              style={({ pressed }) => [
                styles.moreRooms,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.backgroundElement,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <ThemedText type="smallBold" themeColor="primary">
                {t("chat.showMoreRooms", { count: hiddenRooms })}
              </ThemedText>
              <Ionicons name="chevron-down" size={16} color={theme.primary} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {showProposal && message.pendingBooking ? (
        <Card style={[styles.card, { width: cardWidth }]}>
          <View style={styles.cardHeader}>
            <View
              style={[styles.cardIcon, { backgroundColor: theme.primarySoft }]}
            >
              <Ionicons name="calendar" size={16} color={theme.primary} />
            </View>
            <ThemedText type="smallBold">
              {t("chat.confirmBookingCard")}
            </ThemedText>
          </View>
          <ThemedText type="bodyBold">
            {message.pendingBooking.roomTypeName}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t("chat.pendingBookingDates", {
              checkIn: formatDate(message.pendingBooking.checkIn),
              checkOut: formatDate(message.pendingBooking.checkOut),
              nights: message.pendingBooking.nights,
            })}
          </ThemedText>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.totalRow}>
            <ThemedText type="small" themeColor="textSecondary">
              {t("booking.total")}
            </ThemedText>
            <ThemedText style={[styles.total, { color: theme.primary }]}>
              {formatVND(message.pendingBooking.totalAmount)}
            </ThemedText>
          </View>
          <View style={styles.actions}>
            <View style={styles.flex}>
              <Button
                label={t("common.cancel")}
                variant="outline"
                size="sm"
                disabled={busy}
                onPress={() =>
                  onCancelProposal?.(message.pendingBooking!.proposalId)
                }
              />
            </View>
            <View style={styles.flex}>
              <Button
                label={t("chat.confirmBookingCard")}
                size="sm"
                icon="checkmark"
                loading={confirming}
                disabled={busy && !confirming}
                onPress={() =>
                  onConfirmBooking?.(message.pendingBooking!.proposalId)
                }
              />
            </View>
          </View>
        </Card>
      ) : null}

      {showBookingForm && message.bookingFormRequest ? (
        <View style={{ width: cardWidth }}>
          <ChatBookingForm
            request={message.bookingFormRequest}
            disabled={busy}
            onSubmit={(text) => onSubmitBookingForm?.(text)}
            onCancel={() => onCancelBookingForm?.()}
          />
        </View>
      ) : null}

      {message.booking ? (
        <Card style={[styles.card, { width: cardWidth }]}>
          <View style={styles.bookingHeader}>
            <ThemedText type="smallBold">{t("chat.bookingCard")}</ThemedText>
            <StatusBadge status={message.booking.status} />
          </View>
          <ThemedText style={[styles.total, { color: theme.primary }]}>
            {formatVND(message.booking.totalAmount)}
          </ThemedText>
          <Pressable
            accessibilityRole="link"
            onPress={() =>
              router.push(`/booking/${message.booking!.bookingId}`)
            }
            hitSlop={8}
            style={styles.link}
          >
            <ThemedText type="smallBold" themeColor="primary">
              {t("chat.viewBookingDetail")}
            </ThemedText>
            <Ionicons name="arrow-forward" size={16} color={theme.primary} />
          </Pressable>
          {message.booking.status !== "CANCELLED" ? (
            <>
              <View
                style={[styles.divider, { backgroundColor: theme.border }]}
              />
              <CheckInPass
                variant="inline"
                bookingId={message.booking.bookingId}
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
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Space.sm, maxWidth: "86%" },
  alignEnd: { alignSelf: "flex-end", alignItems: "flex-end" },
  alignStart: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubble: {
    borderRadius: Radius.lg,
    paddingHorizontal: Space.lg,
    paddingVertical: Space.md,
  },
  bubbleUser: { borderBottomRightRadius: Space.xs },
  bubbleAssistant: {
    borderBottomLeftRadius: Space.xs,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cards: { gap: Space.md },
  flex: { flex: 1 },
  actions: { flexDirection: "row", gap: Space.sm },
  bold: { fontFamily: FontFamily.bold },
  moreRooms: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Space.xs,
    minHeight: 44,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  card: { gap: Space.sm },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: Space.sm },
  cardIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Space.xs },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  total: { fontFamily: FontFamily.bold, fontSize: 17, lineHeight: 24 },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Space.sm,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.xs,
    minHeight: 28,
  },
});
