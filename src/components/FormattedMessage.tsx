import { Linking, StyleSheet, Text, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { FontFamily, Space } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

// [chữ](https://...) hoặc URL trần https://... — chỉ nhận http(s) để không mở được
// link javascript: hay tel: lạ, giống LINK_PATTERN bên web (AiChatWidgets.jsx).
const LINK_PATTERN =
  /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+)/g;
const BULLET = /^[-*]\s+(.*)/;
const NUMBERED = /^\d+[.)]\s+(.*)/;
const HEADING = /^#{1,6}\s+(.*)/;

type Block =
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] };

/**
 * Trả lời của AI dùng markdown tối giản (**in đậm**, gạch đầu dòng, danh sách số, link)
 * — dựng riêng thay vì thêm thư viện markdown vì chỉ cần đúng vài cú pháp này, giống
 * FormattedMessage bên web (AiChatWidgets.jsx).
 */
export function FormattedMessage({ text }: { text: string }) {
  const theme = useTheme();

  // **in đậm** -> chữ đậm. Dùng Text thường (không phải ThemedText) để kế thừa cỡ chữ và
  // màu của dòng chứa nó.
  const renderBold = (value: string, keyPrefix: string) =>
    value.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
        <Text key={`${keyPrefix}${i}`} style={styles.bold}>
          {part.slice(2, -2)}
        </Text>
      ) : (
        part
      ),
    );

  // Tách link ra khỏi chữ thường; phần chữ còn lại vẫn xử lý **in đậm**.
  const renderInline = (value: string) => {
    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    for (const match of value.matchAll(LINK_PATTERN)) {
      const index = match.index ?? 0;
      if (index > lastIndex) {
        nodes.push(...renderBold(value.slice(lastIndex, index), `t${index}-`));
      }
      const [, label, labeledUrl, bareUrl] = match;
      const url = labeledUrl ?? bareUrl;
      nodes.push(
        <Text
          key={`a${index}`}
          accessibilityRole="link"
          style={[styles.link, { color: theme.primary }]}
          onPress={() => Linking.openURL(url)}
        >
          {label ?? url}
        </Text>,
      );
      lastIndex = index + match[0].length;
    }
    if (lastIndex < value.length) {
      nodes.push(...renderBold(value.slice(lastIndex), "end-"));
    }
    return nodes;
  };

  // Gom các dòng thành đoạn văn và danh sách (các dòng "- " / "1. " liền nhau thành 1 danh sách).
  const blocks: Block[] = [];
  for (const line of (text ?? "").split("\n")) {
    const trimmed = line.trim();
    const item = trimmed.match(BULLET)?.[1] ?? trimmed.match(NUMBERED)?.[1];
    if (item !== undefined) {
      const last = blocks[blocks.length - 1];
      if (last?.kind === "list") last.items.push(item);
      else blocks.push({ kind: "list", items: [item] });
    } else if (trimmed !== "") {
      // Prompt đã dặn model không dùng tiêu đề, nhưng vẫn bỏ "#" phòng khi lọt vào.
      blocks.push({
        kind: "paragraph",
        text: trimmed.match(HEADING)?.[1] ?? trimmed,
      });
    }
  }

  return (
    <View style={styles.container}>
      {blocks.map((block, i) =>
        block.kind === "paragraph" ? (
          <ThemedText key={i} type="body" style={styles.text}>
            {renderInline(block.text)}
          </ThemedText>
        ) : (
          <View key={i} style={styles.list}>
            {block.items.map((item, j) => (
              <View key={j} style={styles.listItem}>
                <ThemedText type="body" style={[styles.text, styles.bullet]}>
                  •
                </ThemedText>
                <ThemedText type="body" style={[styles.text, styles.flex]}>
                  {renderInline(item)}
                </ThemedText>
              </View>
            ))}
          </View>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  text: { fontSize: 15, lineHeight: 22 },
  bold: { fontFamily: FontFamily.bold },
  link: { fontFamily: FontFamily.semiBold, textDecorationLine: "underline" },
  list: { gap: 2 },
  listItem: { flexDirection: "row" },
  bullet: { width: 16 },
  flex: { flex: 1 },
});
