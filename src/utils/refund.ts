import { BookingRefundRequest, CancellationPreview, MyRefundRequest } from '@/types/refund';

type RefundLike = Pick<BookingRefundRequest | MyRefundRequest, 'status' | 'refundProcessingSlaHours'> & {
  // Optional: BookingRefundRequest (embedded in GET /bookings/:id) has no createdAt at
  // all (see RefundRequestService.findByBookingId on the backend) — only MyRefundRequest
  // (GET /refund-requests/mine) does. Without it we genuinely cannot know whether the
  // request is overdue, so we say it isn't rather than guessing a timestamp.
  createdAt?: string;
};

// Mirrors BookingHistoryPage.jsx's isRefundOverdue (web): still PENDING, and at least
// refundProcessingSlaHours have passed since createdAt. Recomputed from `now` on every
// call — no polling needed, a screen focus/refetch is enough to catch up.
export function isRefundOverdue(refund: RefundLike, now: number = Date.now()): boolean {
  if (refund.status !== 'PENDING' || !refund.createdAt) return false;
  const hoursSincePending = (now - new Date(refund.createdAt).getTime()) / (60 * 60 * 1000);
  return hoursSincePending >= refund.refundProcessingSlaHours;
}

export type RefundDisplayState = 'pending' | 'overdue' | 'completed' | 'rejected';

export function getRefundDisplayState(
  refund: RefundLike | null | undefined,
  now: number = Date.now(),
): RefundDisplayState | null {
  if (!refund) return null;
  if (refund.status === 'COMPLETED') return 'completed';
  if (refund.status === 'REJECTED') return 'rejected';
  return isRefundOverdue(refund, now) ? 'overdue' : 'pending';
}

export type CancellationPreviewState = 'full' | 'partial' | 'none' | 'notPaid';

// `paidAmount` is the booking's own paidAmount, not preview.refundAmount — an unpaid
// booking still gets a CancellationPreview from the backend (refundPercent/refundAmount
// would just be meaningless 0s), so it has to be checked separately from the client side.
export function describeCancellationPreview(
  preview: CancellationPreview,
  paidAmount: number,
): CancellationPreviewState {
  if (paidAmount <= 0) return 'notPaid';
  // Matches BookingService.cancel()'s own `isNoRefund = preview.hoursUntilCheckIn <= 0`.
  if (preview.hoursUntilCheckIn <= 0) return 'none';
  return preview.refundPercent >= 100 ? 'full' : 'partial';
}
