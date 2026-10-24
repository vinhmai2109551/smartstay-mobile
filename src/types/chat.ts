import { AvailableRoomType } from "./room";
import { BookingStatus } from "./booking";
import { Promotion } from "./promotion";

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
  paymentMethod: "CASH" | "PAYOS";
  roomAmount: number;
  serviceAmount: number;
  discountAmount: number;
  vatAmount: number;
  totalAmount: number;
};

export type ConfirmedBooking = {
  bookingId: string;
  status: BookingStatus;
  totalAmount: number;
  paymentMethod: "CASH" | "PAYOS";
  qrCode?: string;
  checkoutUrl?: string;
  expiredAt?: number;
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
  cancelProposalId?: string;
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

export type ChatRole = "USER" | "MODEL";

// One stored row of GET /ai-agent/conversations/:id. TOOL rows carry the cards
// (rooms, proposal, booking…) that were shown under the following MODEL reply.
export type AiConversationMessage = {
  messageId: string;
  role: "USER" | "MODEL" | "TOOL";
  content: string | null;
  createdAt: string;
  toolName?: string | null;
  toolResult?: { success?: boolean; data?: any } | null;
};

// A local chat-bubble entry — mirrors SendChatMessageResponse's structured
// fields so the UI can render room/promotion/booking cards under a reply.
export type ChatMessage = {
  // Stable across re-renders AND reloads: the backend's own messageId when rebuilt
  // from history (buildMessagesFromHistory), a fresh client-generated id otherwise
  // (see chat.tsx) — never the array index, so FlatList doesn't recycle a bubble's
  // local state (e.g. "show all rooms") onto a different message.
  id: string;
  role: ChatRole;
  content: string;
  rooms?: AvailableRoomType[] | null;
  promotions?: Promotion[] | null;
  pendingBooking?: PendingBooking | null;
  booking?: ConfirmedBooking | null;
  bookingFormRequest?: BookingFormRequest | null;
};

export type ReceptionMessage = {
  conversationId: string;
  messageId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  attachmentUrl: string | null;
  attachmentType: "IMAGE" | null;
  createdAt: string;
};
