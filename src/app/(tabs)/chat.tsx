import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { isAxiosError } from "axios";
import { SafeAreaView } from "react-native-safe-area-context";

import { aiChatApi } from "@/api/chat";
import { getApiErrorMessage } from "@/api/client";
import { AI_TAB_LIFT } from "@/components/AiTabButton";
import { BrandMark } from "@/components/BrandMark";
import { ChatBubble } from "@/components/ChatBubble";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TypingIndicator } from "@/components/TypingIndicator";
import { Chip } from "@/components/ui/Chip";
import {
  FontFamily,
  MaxContentWidth,
  MinTouch,
  Radius,
  Space,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ChatMessage } from "@/types/chat";
import { useAuthStore } from "@/store/authStore";
import {
  buildMessagesFromHistory,
  clearStoredConversationId,
  readStoredConversationId,
  storeConversationId,
} from "@/utils/aiChatHistory";
import { pickRelevantRooms } from "@/utils/chatRooms";

// The latest booking proposal shown before `index` — what an AI-created booking was made from.
function findProposalBefore(messages: ChatMessage[], index: number) {
  for (let i = index - 1; i >= 0; i--) {
    const proposal = messages[i].pendingBooking;
    if (proposal) return proposal;
  }
  return null;
}

export default function ChatScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const welcomeMessage = useMemo<ChatMessage>(
    () => ({ role: "MODEL", content: t("chat.welcomeMessage") }),
    [t],
  );
  const quickPrompts = useMemo(
    () => [
      t("chat.quickPrompt1"),
      t("chat.quickPrompt2"),
      t("chat.quickPrompt3"),
      t("chat.quickPrompt4"),
    ],
    [t],
  );
  const conversationIdRef = useRef<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmingProposalId, setConfirmingProposalId] = useState<
    string | null
  >(null);
  const listRef = useRef<FlatList>(null);
  const userId = useAuthStore((s) => s.user?.userId);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Resume the last conversation, like the web widget does after a reload. This tab only
  // exists while signed in and unmounts on sign-out, so the chat never leaks across users.
  useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      const storedId = await readStoredConversationId(userId);
      if (!storedId || !active) return;
      setLoadingHistory(true);
      try {
        const history = await aiChatApi.conversationHistory(storedId);
        if (!active) return;
        conversationIdRef.current = storedId;
        setMessages([welcomeMessage, ...buildMessagesFromHistory(history)]);
        requestAnimationFrame(() =>
          listRef.current?.scrollToEnd({ animated: false }),
        );
      } catch {
        // Gone or not this user's any more — start fresh.
        clearStoredConversationId(userId);
      } finally {
        if (active) setLoadingHistory(false);
      }
    })();
    return () => {
      active = false;
    };
    // welcomeMessage only changes with the language; reloading history for that isn't needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const startNewConversation = () => {
    if (sending) return;
    conversationIdRef.current = undefined;
    if (userId) clearStoredConversationId(userId);
    setMessages([welcomeMessage]);
    setDismissedFormAt(null);
    setInput("");
  };

  // The raised AI tab button pokes above the tab bar, right where the input sits — keep
  // clear of it, except while the keyboard covers the tab bar anyway.
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardOpen(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardOpen(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const scrollToEnd = () =>
    requestAnimationFrame(() =>
      listRef.current?.scrollToEnd({ animated: true }),
    );

  const send = async (
    text: string,
    extra: { confirmProposalId?: string; cancelProposalId?: string } = {},
  ) => {
    setSending(true);
    try {
      const response = await aiChatApi.sendMessage({
        conversationId: conversationIdRef.current,
        message: text,
        ...extra,
      });
      conversationIdRef.current = response.conversationId;
      if (userId) storeConversationId(userId, response.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          role: "MODEL",
          content: response.reply,
          // Only the rooms the answer is about — see pickRelevantRooms.
          rooms: pickRelevantRooms(response.reply, text, response.rooms),
          promotions: response.promotions,
          pendingBooking: response.pendingBooking,
          booking: response.booking,
          bookingFormRequest: response.bookingFormRequest,
        },
      ]);
    } catch (error) {
      // The stored conversation was deleted or isn't this user's — let the next message start a new one.
      if (
        isAxiosError(error) &&
        (error.response?.status === 403 || error.response?.status === 404)
      ) {
        conversationIdRef.current = undefined;
        if (userId) clearStoredConversationId(userId);
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "MODEL",
          content: getApiErrorMessage(error, t("chat.sendFailed")),
        },
      ]);
    } finally {
      setSending(false);
      setConfirmingProposalId(null);
      scrollToEnd();
    }
  };

  const sendText = (raw: string) => {
    const text = raw.trim();
    if (!text || sending) return;
    setMessages((prev) => [...prev, { role: "USER", content: text }]);
    setInput("");
    scrollToEnd();
    send(text);
  };

  const handleCancelProposal = (proposalId: string) => {
    if (sending) return;

    const cancelText = t("chat.cancelProposalMessage");
    setMessages((prev) => [...prev, { role: "USER", content: cancelText }]);
    scrollToEnd();
    send(cancelText, { cancelProposalId: proposalId });
  };

  const handleConfirmBooking = (proposalId: string) => {
    if (sending) return;
    setConfirmingProposalId(proposalId);
    const confirmText = t("chat.confirmBookingMessage");
    setMessages((prev) => [...prev, { role: "USER", content: confirmText }]);
    scrollToEnd();
    send(confirmText, { confirmProposalId: proposalId });
  };

  // The booking form belongs to the latest reply only, and goes away once submitted or
  // cancelled (like the web, which tracks the dismissed message index).
  const [dismissedFormAt, setDismissedFormAt] = useState<number | null>(null);

  const handleSubmitBookingForm = (text: string, index: number) => {
    setDismissedFormAt(index);
    sendText(text);
  };

  const handleCancelBookingForm = (index: number) => {
    setDismissedFormAt(index);
    sendText(t("chat.cancelBookingFormMessage"));
  };

  const canSend = !sending && !!input.trim();
  const showQuickPrompts = messages.length === 1 && !sending;

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <BrandMark size={40} iconSize={18} />
          <View style={styles.headerText}>
            <ThemedText type="bodyBold">{t("chat.headerTitle")}</ThemedText>
            <View style={styles.statusRow}>
              <View
                style={[styles.statusDot, { backgroundColor: theme.success }]}
              />
              <ThemedText type="caption" themeColor="textSecondary">
                {sending ? t("chat.typing") : t("chat.readyToHelp")}
              </ThemedText>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("chat.newConversation")}
            onPress={startNewConversation}
            disabled={sending || messages.length <= 1}
            hitSlop={10}
            style={({ pressed }) => [
              styles.newChat,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                opacity:
                  sending || messages.length <= 1 ? 0.4 : pressed ? 0.6 : 1,
              },
            ]}
          >
            <Ionicons name="create-outline" size={20} color={theme.primary} />
          </Pressable>
        </View>

        {/* No keyboardVerticalOffset: the view's layout y already includes the safe-area
            inset and header, since SafeAreaView sits at the top of the window. */}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(_, index) => String(index)}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => (
              <ChatBubble
                message={item}
                confirming={
                  sending &&
                  item.pendingBooking?.proposalId === confirmingProposalId
                }
                onConfirmBooking={handleConfirmBooking}
                onCancelProposal={handleCancelProposal}
                showBookingForm={
                  index === messages.length - 1 && dismissedFormAt !== index
                }
                onSubmitBookingForm={(text) =>
                  handleSubmitBookingForm(text, index)
                }
                onCancelBookingForm={() => handleCancelBookingForm(index)}
                busy={sending}
                proposal={
                  item.booking ? findProposalBefore(messages, index) : null
                }
                showProposal={index === messages.length - 1}
              />
            )}
            onContentSizeChange={scrollToEnd}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListFooterComponent={
              loadingHistory ? (
                <View style={styles.footer}>
                  <ActivityIndicator color={theme.primary} />
                </View>
              ) : sending ? (
                <View style={styles.footer}>
                  <TypingIndicator />
                </View>
              ) : showQuickPrompts ? (
                <View style={styles.footer}>
                  <ThemedText
                    type="caption"
                    themeColor="textSecondary"
                    style={styles.quickLabel}
                  >
                    {t("chat.quickPromptsLabel")}
                  </ThemedText>
                  <View style={styles.quickWrap}>
                    {quickPrompts.map((prompt) => (
                      <Chip
                        key={prompt}
                        label={prompt}
                        onPress={() => sendText(prompt)}
                      />
                    ))}
                  </View>
                </View>
              ) : null
            }
          />

          <View
            style={[
              styles.inputBar,
              {
                borderTopColor: theme.border,
                backgroundColor: theme.background,
                paddingBottom: Space.sm + (keyboardOpen ? 0 : AI_TAB_LIFT),
              },
            ]}
          >
            <View
              style={[
                styles.inputPill,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder={t("chat.placeholder")}
                placeholderTextColor={theme.textSecondary}
                accessibilityLabel={t("chat.messageAccessibility")}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => sendText(input)}
                multiline
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("chat.sendAccessibility")}
              onPress={() => sendText(input)}
              disabled={!canSend}
              style={({ pressed }) => [
                styles.sendButton,
                {
                  backgroundColor: canSend
                    ? theme.primary
                    : theme.backgroundSelected,
                  transform: [{ scale: pressed ? 0.94 : 1 }],
                },
              ]}
            >
              <Ionicons
                name="arrow-up"
                size={22}
                color={canSend ? theme.primaryText : theme.textSecondary}
              />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.md,
    paddingHorizontal: Space.lg,
    paddingVertical: Space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: { flex: 1 },
  newChat: {
    width: MinTouch,
    height: MinTouch,
    borderRadius: MinTouch / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: Space.xs + 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  list: {
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    padding: Space.lg,
    paddingBottom: Space.xl,
  },
  separator: { height: Space.lg },
  footer: { marginTop: Space.lg, gap: Space.sm },
  quickLabel: { marginLeft: Space.xs },
  quickWrap: { flexDirection: "row", flexWrap: "wrap", gap: Space.sm },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Space.sm,
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputPill: {
    flex: 1,
    minHeight: MinTouch + 4,
    maxHeight: 120,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Space.lg,
    justifyContent: "center",
  },
  input: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    paddingTop: Space.md,
    paddingBottom: Space.md,
    maxHeight: 116,
  },
  sendButton: {
    width: MinTouch + 4,
    height: MinTouch + 4,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
