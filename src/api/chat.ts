import { apiClient } from "./client";
import {
  AiConversationMessage,
  ReceptionMessage,
  SendChatMessageDto,
  SendChatMessageResponse,
} from "@/types/chat";

// Chat with the AI concierge — search rooms, ask FAQs, and book by
// conversation (POST /ai-agent/chat). Distinct from human-staff chat
// (/chat/conversations + WebSocket), which isn't wired up yet.
const AI_CHAT_TIMEOUT_MS = 90_000;
export const aiChatApi = {
  sendMessage: (dto: SendChatMessageDto) =>
    apiClient
      .post<SendChatMessageResponse>("/ai-agent/chat", dto, {
        timeout: AI_CHAT_TIMEOUT_MS,
      })
      .then((r) => r.data),

  conversationHistory: (conversationId: string) =>
    apiClient
      .get<AiConversationMessage[]>(`/ai-agent/conversations/${conversationId}`)
      .then((r) => r.data),
};

// Chat with the hotel's reception staff: REST for the conversation and its
// history, the shared socket ('chat:join' / 'chat:message') for live messages.
export const receptionChatApi = {
  // Returns the guest's open conversation, creating it on first use.
  openConversation: () =>
    apiClient
      .post<{ conversationId: string }>("/chat/conversations")
      .then((r) => r.data),

  messages: (conversationId: string) =>
    apiClient
      .get<ReceptionMessage[]>(`/chat/conversations/${conversationId}/messages`)
      .then((r) => r.data),

  // Images go over HTTP first (multipart can't ride the socket); the returned URL
  // is then sent as the message's attachmentUrl.
  uploadAttachment: (image: { uri: string; name: string; type: string }) => {
    const form = new FormData();
    form.append("file", image as unknown as Blob);
    return apiClient
      .post<{ url: string; type: "IMAGE" }>("/chat/attachments", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};
