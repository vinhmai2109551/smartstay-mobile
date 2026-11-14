export type RefundRequestStatus = 'PENDING' | 'COMPLETED' | 'REJECTED';

// GET /bookings/:id/cancellation-preview (BookingService.getCancellationPreview,
// backed by RefundRequestService.computeRefundPreview) — never computed on the client.
export type CancellationPreview = {
  hoursUntilCheckIn: number;
  refundPercent: number;
  refundAmount: number;
  freeCancellationHours: number;
};

// The `refundRequest` field embedded in GET /bookings/:id (BookingService.findById ->
// RefundRequestService.findByBookingId). Customer-facing shape only — no payerBankInfo/
// conversation/processedByUserId (admin-only fields, see the backend entity).
export type BookingRefundRequest = {
  refundRequestId: string;
  status: RefundRequestStatus;
  amount: number;
  refundPercent: number;
  reason: string | null;
  adminNote: string | null;
  proofImageUrl: string | null;
  refundProcessingSlaHours: number;
  qrImageUrl: string | null;
};

// GET /refund-requests/mine (RefundRequestService.findMine) — a flat array, one row per
// cancelled-and-paid booking of the signed-in guest.
export type MyRefundRequest = {
  refundRequestId: string;
  bookingId: string;
  amount: number;
  refundPercent: number;
  status: RefundRequestStatus;
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
  refundProcessingSlaHours: number;
};
