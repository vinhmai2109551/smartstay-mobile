import { buildMessagesFromHistory } from './aiChatHistory';
import { AiConversationMessage } from '@/types/chat';

function row(partial: Partial<AiConversationMessage>): AiConversationMessage {
  return {
    messageId: 'm',
    role: 'USER',
    content: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

describe('buildMessagesFromHistory', () => {
  it('returns an empty array for empty history', () => {
    expect(buildMessagesFromHistory([])).toEqual([]);
  });

  it('attaches rooms from a successful search_rooms TOOL row to the following MODEL reply', () => {
    const rooms = [{ roomTypeId: 'r1' }];
    const history = [
      row({ messageId: 'u1', role: 'USER', content: 'tìm phòng' }),
      row({ messageId: 't1', role: 'TOOL', toolName: 'search_rooms', toolResult: { success: true, data: rooms } }),
      row({ messageId: 'm1', role: 'MODEL', content: 'đây là các phòng' }),
    ];

    const messages = buildMessagesFromHistory(history);

    expect(messages).toHaveLength(2);
    expect(messages[1].rooms).toEqual(rooms);
  });

  it('ignores a TOOL row whose toolResult.success is false', () => {
    const history = [
      row({ messageId: 'u1', role: 'USER', content: 'tìm phòng' }),
      row({
        messageId: 't1',
        role: 'TOOL',
        toolName: 'search_rooms',
        toolResult: { success: false, data: [{ roomTypeId: 'r1' }] },
      }),
      row({ messageId: 'm1', role: 'MODEL', content: 'không tìm được phòng' }),
    ];

    const messages = buildMessagesFromHistory(history);

    expect(messages[1].rooms).toBeUndefined();
  });

  it('keeps a pending booking proposal across turns until a booking is created', () => {
    const proposal = { proposalId: 'p1' };
    const history = [
      row({
        messageId: 't1',
        role: 'TOOL',
        toolName: 'propose_booking',
        toolResult: { success: true, data: proposal },
      }),
      row({ messageId: 'm1', role: 'MODEL', content: 'xác nhận đặt phòng?' }),
      row({ messageId: 'u1', role: 'USER', content: 'đồng ý' }),
      row({ messageId: 'm2', role: 'MODEL', content: 'đang xử lý...' }),
    ];

    const messages = buildMessagesFromHistory(history);

    // messages = [MODEL m1, USER u1, MODEL m2]
    expect(messages[0].pendingBooking).toEqual(proposal);
    expect(messages[2].pendingBooking).toEqual(proposal);
  });

  it('clears the pending proposal once create_booking runs', () => {
    const proposal = { proposalId: 'p1' };
    const booking = { bookingId: 'b1' };
    const history = [
      row({
        messageId: 't1',
        role: 'TOOL',
        toolName: 'propose_booking',
        toolResult: { success: true, data: proposal },
      }),
      row({ messageId: 'm1', role: 'MODEL', content: 'xác nhận đặt phòng?' }),
      row({ messageId: 't2', role: 'TOOL', toolName: 'create_booking', toolResult: { success: true, data: booking } }),
      row({ messageId: 'm2', role: 'MODEL', content: 'đã tạo đơn' }),
    ];

    const messages = buildMessagesFromHistory(history);

    // messages = [MODEL m1, MODEL m2]
    expect(messages[1].booking).toEqual(booking);
    expect(messages[1].pendingBooking).toBeNull();
  });
});
