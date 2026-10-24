import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { roomImageSource } from "@/components/RoomTypeCard";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/Button";
import { Radius, Space } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { AvailableRoomType } from "@/types/room";
import { formatVND } from "@/utils/currency";

type ChatRoomCardProps = {
  roomType: AvailableRoomType;
  width: number;
  disabled?: boolean;
  onSelect: () => void; // "Chọn phòng này" - nhờ AI đặt tiếp
  onOpen: () => void; // bấm ảnh - xem chi tiết phòng
};

export function ChatRoomCard({
  roomType,
  width,
  disabled,
  onSelect,
  onOpen,
}: ChatRoomCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const image = roomImageSource(roomType);
  return (
    <View
      style={[
        styles.card,
        {
          width,
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}
    >
      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel={roomType.name}
        onPress={onOpen}
      >
        {image ? (
          <Image
            source={image}
            style={styles.image}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : (
          <View
            style={[
              styles.image,
              styles.placeholder,
              { backgroundColor: theme.primarySoft },
            ]}
          >
            <Ionicons name="bed-outline" size={32} color={theme.primary} />
          </View>
        )}
      </Pressable>
      <View style={styles.body}>
        <ThemedText type="smallBold" numberOfLines={2}>
          {roomType.name}
        </ThemedText>
        <View style={styles.meta}>
          <Ionicons
            name="people-outline"
            size={14}
            color={theme.textSecondary}
          />
          <ThemedText type="caption" themeColor="textSecondary">
            {t("chat.roomGuests", { count: roomType.capacity })}
          </ThemedText>
        </View>
        {typeof roomType.availableCount === "number" ? (
          <ThemedText type="caption" style={{ color: theme.success }}>
            {t("room.availableCount", { count: roomType.availableCount })}
          </ThemedText>
        ) : null}
        <ThemedText type="smallBold" style={{ color: theme.primary }}>
          {formatVND(roomType.basePrice)}
          <ThemedText type="caption" themeColor="textSecondary">
            {t("chat.perNight")}
          </ThemedText>
        </ThemedText>
        <View style={styles.action}>
          <Button
            label={t("chat.selectRoom")}
            size="sm"
            disabled={disabled}
            onPress={onSelect}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: Radius.lg, overflow: "hidden" },
  image: { width: "100%", height: 112 },
  placeholder: { alignItems: "center", justifyContent: "center" },
  body: { padding: Space.md, gap: Space.xs },
  meta: { flexDirection: "row", alignItems: "center", gap: Space.xs },
  action: { marginTop: Space.xs },
});
