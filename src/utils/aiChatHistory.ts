import { persistedStorage } from '@/store/persistedStorage';
import { AiConversationMessage, ChatMessage } from '@/types/chat';

// Port of the web's components/aiChatHistory.js: remember the conversationId per user
// so reopening the app resumes the same chat, and rebuild the messages (with their
// room/promotion/booking cards) from GET /ai-agent/conversations/:id.

// Per user, so another account signing in on the same phone can't read it. SecureStore
// keys allow only letters, digits, ".", "-" and "_" — hence no ":" like the web key.
const storageKey = (userId: string) => `vika-ai-conversation.${userId}`;

// Storage failures only lose the "resume chat" convenience — never break the chat.
export async function readStoredConversationId(userId: string) {
  try {
    return (await persistedStorage.getItem(storageKey(userId))) as string | null;
  } catch {
    return null;
  }
}

export async function storeConversationId(userId: string, conversationId: string) {
  try {
    await persistedStorage.setItem(storageKey(userId), conversationId);
  } catch {
    // ignore
  }
}

export async function clearStoredConversationId(userId: string) {
  try {
    await persistedStorage.removeItem(storageKey(userId));
  } catch {
    // ignore
  }
}

type Widgets = Pick<ChatMessage, 'rooms' | 'promotions' | 'booking' | 'bookingFormRequest'>;

/**
 * The backend stores each turn as USER → TOOL (0..n) → MODEL. The cards shown under a
 * reply aren't on the MODEL row but in the TOOL results just before it, so collect them
 * and attach them to the reply — the same way AiAgentService builds a live response.
 */
export function buildMessagesFromHistory(history: AiConversationMessage[]): ChatMessage[] {
  const messages: ChatMessage[] = [];
  let widgets: Widgets = {};
  // A pending proposal lives across turns until a booking is created (a live response
  // always carries conversation.pendingBooking), so it isn't reset per turn.
  let activePendingBooking: ChatMessage['pendingBooking'] = null;

  for (const message of history ?? []) {
    if (message.role === 'USER') {
      widgets = {};
      messages.push({ role: 'USER', content: message.content ?? '' });
      continue;
    }

    if (message.role === 'TOOL') {
      const result = message.toolResult;
      if (!result?.success) continue;
      switch (message.toolName) {
        case 'search_rooms':
          if (Array.isArray(result.data)) widgets.rooms = result.data;
          break;
        case 'check_availability':
          if (result.data) widgets.rooms = [result.data];
          break;
        case 'get_promotions':
          if (Array.isArray(result.data)) widgets.promotions = result.data;
          break;
        case 'propose_booking':
          activePendingBooking = result.data ?? null;
          break;
        case 'create_booking':
          widgets.booking = result.data;
          activePendingBooking = null;
          break;
        case 'request_booking_form':
          widgets.bookingFormRequest = result.data;
          break;
        default:
          break;
      }
      continue;
    }

    if (message.role === 'MODEL') {
      messages.push({ role: 'MODEL', content: message.content ?? '', ...widgets, pendingBooking: activePendingBooking });
      widgets = {};
    }
  }

  return messages;
}
