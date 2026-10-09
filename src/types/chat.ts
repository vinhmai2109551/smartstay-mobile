import { AvailableRoomType } from './room';
import { Promotion } from './promotion';

export type PendingBooking = {
  proposalId: string;
  roomTypeId: string;
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestInfo: { fullName: string; phone: string };
  extraServiceIds: string[];
  promotionCode: string | null;
  paymentMethod: 'CASH' | 'PAYOS';
  roomAmount: number;
  serviceAmount: number;
  discountAmount: number;
  vatAmount: number;
  totalAmount: number;
};

export type ConfirmedBooking = {
  bookingId: string;
  status: string;
  totalAmount: number;
  paymentMethod: 'CASH' | 'PAYOS';
};

// Sent when the AI calls `request_booking_form`: what it already knows, to prefill the form.
export type BookingFormRequest = {
  roomTypeId?: string;
  roomTypeName?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
};

export type SendChatMessageDto = {
  conversationId?: string;
  message: string;
  confirmProposalId?: string;
};

export type SendChatMessageResponse = {
  conversationId: string;
  reply: string;
  rooms: AvailableRoomType[] | null;
  promotions: Promotion[] | null;
  pendingBooking: PendingBooking | null;
  booking: ConfirmedBooking | null;
  bookingFormRequest: BookingFormRequest | null;
};

export type ChatRole = 'USER' | 'MODEL';

// One stored row of GET /ai-agent/conversations/:id. TOOL rows carry the cards
// (rooms, proposal, booking…) that were shown under the following MODEL reply.
export type AiConversationMessage = {
  messageId: string;
  role: 'USER' | 'MODEL' | 'TOOL';
  content: string | null;
  createdAt: string;
  toolName?: string | null;
  toolResult?: { success?: boolean; data?: any } | null;
};

// A local chat-bubble entry — mirrors SendChatMessageResponse's structured
// fields so the UI can render room/promotion/booking cards under a reply.
export type ChatMessage = {
  role: ChatRole;
  content: string;
  rooms?: AvailableRoomType[] | null;
  promotions?: Promotion[] | null;
  pendingBooking?: PendingBooking | null;
  booking?: ConfirmedBooking | null;
  bookingFormRequest?: BookingFormRequest | null;
};
