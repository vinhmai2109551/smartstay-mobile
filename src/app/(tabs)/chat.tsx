import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import { aiChatApi } from '@/api/chat';
import { getApiErrorMessage } from '@/api/client';
import { ChatBubble } from '@/components/ChatBubble';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ChatMessage } from '@/types/chat';

const WELCOME_MESSAGE: ChatMessage = {
  role: 'MODEL',
  content:
    'Xin chào! Mình là trợ lý ảo của SmartStay 👋 Bạn muốn tìm phòng theo ngày nào, cho bao nhiêu khách? Mình có thể tư vấn và đặt phòng giúp bạn ngay tại đây.',
};

export default function ChatScreen() {
  const theme = useTheme();
  const conversationIdRef = useRef<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
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
        { role: 'MODEL', content: getApiErrorMessage(error, 'Trợ lý AI hiện chưa phản hồi được, vui lòng thử lại.') },
      ]);
    } finally {
      setSending(false);
      setConfirmingProposalId(null);
      scrollToEnd();
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || sending) return;
    setMessages((prev) => [...prev, { role: 'USER', content: text }]);
    setInput('');
    scrollToEnd();
    send(text);
  };

  const handleConfirmBooking = (proposalId: string) => {
    if (sending) return;
    setConfirmingProposalId(proposalId);
    setMessages((prev) => [...prev, { role: 'USER', content: 'Xác nhận đặt phòng' }]);
    scrollToEnd();
    send('Xác nhận đặt phòng', proposalId);
  };

  return (
    <Screen scroll={false} padded={false}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, index) => String(index)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ChatBubble
              message={item}
              confirming={sending && item.pendingBooking?.proposalId === confirmingProposalId}
              onConfirmBooking={handleConfirmBooking}
            />
          )}
          onContentSizeChange={scrollToEnd}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.three }} />}
        />

        <View style={[styles.inputBar, { borderColor: theme.border, backgroundColor: theme.background }]}>
          <TextField
            style={styles.input}
            placeholder="Nhắn tin để tìm và đặt phòng..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            multiline
          />
          <Pressable
            onPress={handleSend}
            disabled={sending || !input.trim()}
            style={[styles.sendButton, { backgroundColor: theme.primary, opacity: sending || !input.trim() ? 0.5 : 1 }]}>
            <Ionicons name="send" size={18} color={theme.primaryText} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: Spacing.three },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    padding: Spacing.two,
    borderTopWidth: 1,
  },
  input: { flex: 1, maxHeight: 100 },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
});
