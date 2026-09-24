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

export type BookingFormRequest = Record<string, unknown>;

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

// A local chat-bubble entry — mirrors SendChatMessageResponse's structured
// fields so the UI can render room/promotion/booking cards under a reply.
export type ChatMessage = {
  role: ChatRole;
  content: string;
  rooms?: AvailableRoomType[] | null;
  promotions?: Promotion[] | null;
  pendingBooking?: PendingBooking | null;
  booking?: ConfirmedBooking | null;
};
