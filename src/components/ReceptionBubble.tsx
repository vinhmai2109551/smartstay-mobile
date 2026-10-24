import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Radius, Space } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ReceptionMessage } from "@/types/chat";
import { formatDate } from "@/utils/date";

// The corner pointing at the sender — gives each bubble a small "tail".
const TAIL_RADIUS = 4;

export function ReceptionBubble({
  message,
  mine,
  showName,
  showTime,
}: {
  message: ReceptionMessage;
  mine: boolean;
  /** First message of a run from the same staff member. */
  showName: boolean;
  /** Last message of a run from the same sender. */
  showTime: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={[styles.row, mine ? styles.mine : styles.theirs]}>
      <View
        style={[
          styles.bubble,
          mine
            ? {
                backgroundColor: theme.primary,
                borderBottomRightRadius: TAIL_RADIUS,
              }
            : {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                borderWidth: StyleSheet.hairlineWidth,
                borderTopLeftRadius: TAIL_RADIUS,
              },
        ]}
      >
        {showName && !mine ? (
          <ThemedText type="smallBold" themeColor="primary">
            {t("receptionChat.staffLabel", { name: message.senderName })}
          </ThemedText>
        ) : null}
        {message.attachmentUrl ? (
          <Image
            source={{ uri: message.attachmentUrl }}
            style={styles.image}
            contentFit="cover"
          />
        ) : null}
        {message.content ? (
          <ThemedText style={mine ? { color: theme.primaryText } : undefined}>
            {message.content}
          </ThemedText>
        ) : null}
      </View>
      {showTime ? (
        <ThemedText
          type="caption"
          themeColor="textSecondary"
          style={styles.time}
        >
          {formatDate(message.createdAt, "HH:mm")}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { maxWidth: "80%", gap: Space.xs },
  mine: { alignSelf: "flex-end", alignItems: "flex-end" },
  theirs: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubble: {
    borderRadius: Radius.lg,
    paddingHorizontal: Space.lg,
    paddingVertical: Space.md,
    gap: Space.xs,
  },
  image: { width: 200, height: 200, borderRadius: Radius.md },
  time: { marginHorizontal: Space.xs },
});
