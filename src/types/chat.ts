import { AvailableRoomType } from './room';
import { Booking } from './booking';

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  message: string;
  dataCard?: ChatDataCard;
  createdAt?: string;
};

export type ChatDataCard = {
  roomTypes?: AvailableRoomType[];
  booking?: Booking;
  [key: string]: unknown;
};

export type SendChatMessageDto = {
  sessionId: string;
  message: string;
  conversationHistory?: { role: ChatRole; message: string }[];
};

export type SendChatMessageResponse = {
  reply: string;
  actionType?: string;
  dataCard?: ChatDataCard;
  functionCalled?: string;
};

export type ChatHandoverDto = {
  sessionId: string;
  reason: string;
};
