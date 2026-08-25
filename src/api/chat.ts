import { apiClient } from './client';
import { ChatHandoverDto, ChatMessage, SendChatMessageDto, SendChatMessageResponse } from '@/types/chat';

export const chatApi = {
  sendMessage: (dto: SendChatMessageDto) =>
    apiClient.post<SendChatMessageResponse>('/chat/message', dto).then((r) => r.data),

  handover: (dto: ChatHandoverDto) =>
    apiClient.post<{ message: string }>('/chat/handover', dto).then((r) => r.data),

  history: (sessionId: string) =>
    apiClient.get<{ messages: ChatMessage[] }>(`/chat/history/${sessionId}`).then((r) => r.data.messages),
};
