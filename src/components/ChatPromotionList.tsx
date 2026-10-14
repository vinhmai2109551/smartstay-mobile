import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { FontFamily, Radius, Space } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Promotion } from "@/types/promotion";
import { formatVND } from "@/utils/currency";

type ChatPromotionListProps = {
  promotions: Promotion[];
  width: number;
};

export function ChatPromotionList({
  promotions,
  width,
}: ChatPromotionListProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const discountLabel = (promotion: Promotion) =>
    promotion.discountType === "PERCENTAGE"
      ? t("promo.discountPercent", { percent: promotion.discountValue })
      : t("promo.discountAmount", {
          amount: formatVND(promotion.discountValue),
        });
  return (
    <View style={[styles.list, { width }]}>
      {promotions.map((promotion) => (
        <View
          // get_promotions không trả promotionId — mã khuyến mãi là duy nhất, dùng làm key.
          key={promotion.code}
          style={[
            styles.row,
            {
              backgroundColor: theme.accentSoft,
              borderColor: theme.accentBorder,
            },
          ]}
        >
          {/* accent (amber-500) chỉ dùng cho icon — không đủ tương phản cho chữ. */}
          <Ionicons name="pricetag-outline" size={16} color={theme.accent} />
          <ThemedText type="caption" style={styles.flex} numberOfLines={1}>
            <ThemedText
              type="caption"
              style={[styles.code, { color: theme.accentText }]}
            >
              {promotion.code}
            </ThemedText>
            {` — ${discountLabel(promotion)}`}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Space.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.sm,
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  flex: { flex: 1 },
  code: { fontFamily: FontFamily.bold },
});
