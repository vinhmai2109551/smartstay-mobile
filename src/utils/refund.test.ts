import { describeCancellationPreview, getRefundDisplayState, isRefundOverdue } from './refund';
import { CancellationPreview, RefundRequestStatus } from '@/types/refund';

const NOW = new Date('2026-01-10T00:00:00.000Z').getTime();

function refund(status: RefundRequestStatus, hoursAgo: number, slaHours = 24) {
  return {
    status,
    refundProcessingSlaHours: slaHours,
    createdAt: new Date(NOW - hoursAgo * 60 * 60 * 1000).toISOString(),
  };
}

describe('isRefundOverdue', () => {
  it.each<[RefundRequestStatus, number, boolean]>([
    ['PENDING', 23, false], // before the SLA
    ['PENDING', 24, true], // exactly at the SLA boundary
    ['PENDING', 25, true], // after the SLA
    ['COMPLETED', 48, false], // never overdue once resolved, no matter how old
    ['REJECTED', 48, false],
  ])('status=%s, %sh since createdAt -> overdue=%s', (status, hoursAgo, expected) => {
    expect(isRefundOverdue(refund(status, hoursAgo), NOW)).toBe(expected);
  });
});

describe('getRefundDisplayState', () => {
  it('returns null when there is no refund request', () => {
    expect(getRefundDisplayState(null, NOW)).toBeNull();
    expect(getRefundDisplayState(undefined, NOW)).toBeNull();
  });

  it.each<[RefundRequestStatus, number, ReturnType<typeof getRefundDisplayState>]>([
    ['PENDING', 1, 'pending'],
    ['PENDING', 24, 'overdue'],
    ['COMPLETED', 1, 'completed'],
    ['REJECTED', 1, 'rejected'],
  ])('status=%s, %sh ago -> %s', (status, hoursAgo, expected) => {
    expect(getRefundDisplayState(refund(status, hoursAgo), NOW)).toBe(expected);
  });
});

describe('describeCancellationPreview', () => {
  function preview(partial: Partial<CancellationPreview>): CancellationPreview {
    return { hoursUntilCheckIn: 72, refundPercent: 100, refundAmount: 0, freeCancellationHours: 48, ...partial };
  }

  it('returns notPaid when the booking has no paidAmount, regardless of the preview', () => {
    expect(describeCancellationPreview(preview({ refundPercent: 100 }), 0)).toBe('notPaid');
  });

  it('returns full for a 100% refund', () => {
    expect(describeCancellationPreview(preview({ refundPercent: 100 }), 500_000)).toBe('full');
  });

  it('returns partial for a 50% refund', () => {
    expect(describeCancellationPreview(preview({ refundPercent: 50, hoursUntilCheckIn: 10 }), 500_000)).toBe('partial');
  });

  it('returns none once past check-in time, even if refundPercent is still 0', () => {
    expect(describeCancellationPreview(preview({ refundPercent: 0, hoursUntilCheckIn: -2 }), 500_000)).toBe('none');
  });
});
