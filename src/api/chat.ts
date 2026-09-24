import { apiClient } from './client';
import { SendChatMessageDto, SendChatMessageResponse } from '@/types/chat';

type AiConversationMessage = {
  messageId: string;
  role: 'USER' | 'MODEL' | 'TOOL';
  content: string | null;
  createdAt: string;
};

// Chat with the AI concierge — search rooms, ask FAQs, and book by
// conversation (POST /ai-agent/chat). Distinct from human-staff chat
// (/chat/conversations + WebSocket), which isn't wired up yet.
export const aiChatApi = {
  sendMessage: (dto: SendChatMessageDto) =>
    apiClient.post<SendChatMessageResponse>('/ai-agent/chat', dto).then((r) => r.data),

  conversationHistory: (conversationId: string) =>
    apiClient.get<AiConversationMessage[]>(`/ai-agent/conversations/${conversationId}`).then((r) => r.data),
};
