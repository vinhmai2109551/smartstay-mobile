import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import { chatApi } from '@/api/chat';
import { getApiErrorMessage } from '@/api/client';
import { ChatBubble } from '@/components/ChatBubble';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ChatMessage } from '@/types/chat';

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  message:
    'Xin chào! Mình là trợ lý ảo của SmartStay 👋 Bạn muốn tìm phòng theo ngày nào, cho bao nhiêu khách? Mình có thể tư vấn và đặt phòng giúp bạn ngay tại đây.',
};

export default function ChatScreen() {
  const theme = useTheme();
  const sessionIdRef = useRef(Crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMessage: ChatMessage = { role: 'user', message: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const response = await chatApi.sendMessage({
        sessionId: sessionIdRef.current,
        message: text,
        conversationHistory: nextMessages.map(({ role, message }) => ({ role, message })),
      });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', message: response.reply, dataCard: response.dataCard },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', message: getApiErrorMessage(error, 'Trợ lý AI hiện chưa phản hồi được, vui lòng thử lại.') },
      ]);
    } finally {
      setSending(false);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
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
          renderItem={({ item }) => <ChatBubble message={item} />}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
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
