import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { aiChatApi } from '@/api/chat';
import { getApiErrorMessage } from '@/api/client';
import { BrandMark } from '@/components/BrandMark';
import { ChatBubble } from '@/components/ChatBubble';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TypingIndicator } from '@/components/TypingIndicator';
import { Chip } from '@/components/ui/Chip';
import { FontFamily, MaxContentWidth, MinTouch, Radius, Space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ChatMessage } from '@/types/chat';

export default function ChatScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const welcomeMessage = useMemo<ChatMessage>(() => ({ role: 'MODEL', content: t('chat.welcomeMessage') }), [t]);
  const quickPrompts = useMemo(
    () => [t('chat.quickPrompt1'), t('chat.quickPrompt2'), t('chat.quickPrompt3'), t('chat.quickPrompt4')],
    [t],
  );
  // KeyboardAvoidingView needs the distance from the window top to its own top edge.
  const [headerHeight, setHeaderHeight] = useState(0);
  const conversationIdRef = useRef<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmingProposalId, setConfirmingProposalId] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  const scrollToEnd = () => requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));

  const send = async (text: string, confirmProposalId?: string) => {
    setSending(true);
    try {
      const response = await aiChatApi.sendMessage({
        conversationId: conversationIdRef.current,
        message: text,
        confirmProposalId,
      });
      conversationIdRef.current = response.conversationId;
      setMessages((prev) => [
        ...prev,
        {
          role: 'MODEL',
          content: response.reply,
          rooms: response.rooms,
          promotions: response.promotions,
          pendingBooking: response.pendingBooking,
          booking: response.booking,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'MODEL', content: getApiErrorMessage(error, t('chat.sendFailed')) },
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
    setMessages((prev) => [...prev, { role: 'USER', content: text }]);
    setInput('');
    scrollToEnd();
    send(text);
  };

  const handleConfirmBooking = (proposalId: string) => {
    if (sending) return;
    setConfirmingProposalId(proposalId);
    const confirmText = t('chat.confirmBookingMessage');
    setMessages((prev) => [...prev, { role: 'USER', content: confirmText }]);
    scrollToEnd();
    send(confirmText, proposalId);
  };

  const canSend = !sending && !!input.trim();
  const showQuickPrompts = messages.length === 1 && !sending;

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View
          style={[styles.header, { borderBottomColor: theme.border }]}
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
          <BrandMark size={40} iconSize={18} />
          <View style={styles.headerText}>
            <ThemedText type="bodyBold">{t('chat.headerTitle')}</ThemedText>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
              <ThemedText type="caption" themeColor="textSecondary">
                {sending ? t('chat.typing') : t('chat.readyToHelp')}
              </ThemedText>
            </View>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={insets.top + headerHeight}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(_, index) => String(index)}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <ChatBubble
                message={item}
                confirming={sending && item.pendingBooking?.proposalId === confirmingProposalId}
                onConfirmBooking={handleConfirmBooking}
              />
            )}
            onContentSizeChange={scrollToEnd}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListFooterComponent={
              sending ? (
                <View style={styles.footer}>
                  <TypingIndicator />
                </View>
              ) : showQuickPrompts ? (
                <View style={styles.footer}>
                  <ThemedText type="caption" themeColor="textSecondary" style={styles.quickLabel}>
                    {t('chat.quickPromptsLabel')}
                  </ThemedText>
                  <View style={styles.quickWrap}>
                    {quickPrompts.map((prompt) => (
                      <Chip key={prompt} label={prompt} onPress={() => sendText(prompt)} />
                    ))}
                  </View>
                </View>
              ) : null
            }
          />

          <View style={[styles.inputBar, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
            <View style={[styles.inputPill, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder={t('chat.placeholder')}
                placeholderTextColor={theme.textSecondary}
                accessibilityLabel={t('chat.messageAccessibility')}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => sendText(input)}
                multiline
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('chat.sendAccessibility')}
              onPress={() => sendText(input)}
              disabled={!canSend}
              style={({ pressed }) => [
                styles.sendButton,
                {
                  backgroundColor: canSend ? theme.primary : theme.backgroundSelected,
                  transform: [{ scale: pressed ? 0.94 : 1 }],
                },
              ]}>
              <Ionicons name="arrow-up" size={22} color={canSend ? theme.primaryText : theme.textSecondary} />
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    paddingHorizontal: Space.lg,
    paddingVertical: Space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: { flex: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Space.xs + 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  list: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Space.lg,
    paddingBottom: Space.xl,
  },
  separator: { height: Space.lg },
  footer: { marginTop: Space.lg, gap: Space.sm },
  quickLabel: { marginLeft: Space.xs },
  quickWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
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
    justifyContent: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
});
