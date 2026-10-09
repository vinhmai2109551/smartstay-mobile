import { AvailableRoomType } from '@/types/room';

// Lowercase, strip Vietnamese diacritics and markdown, collapse spaces — so "**Standard Room**"
// in a reply matches the room named "Standard Room", and "rẻ nhất" matches "re nhat".
function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[*_`#]/g, '')
    .replace(/\s+/g, ' ');
}

type Superlative = (rooms: AvailableRoomType[]) => AvailableRoomType;

const byPrice = (direction: 1 | -1): Superlative => (rooms) =>
  rooms.reduce((best, room) => (direction * (room.basePrice - best.basePrice) < 0 ? room : best));
const byCapacity: Superlative = (rooms) => rooms.reduce((best, room) => (room.capacity > best.capacity ? room : best));

// Question phrasings (already normalized) that ask for exactly one room.
const SUPERLATIVES: { patterns: RegExp; pick: Superlative }[] = [
  { patterns: /\b(re nhat|gia thap nhat|tiet kiem nhat|cheapest|lowest price)\b/, pick: byPrice(1) },
  {
    patterns: /\b(dat nhat|gia cao nhat|cao cap nhat|sang nhat|xin nhat|most expensive|luxurious|best room)\b/,
    pick: byPrice(-1),
  },
  { patterns: /\b(nhieu khach nhat|rong nhat|lon nhat|nhieu nguoi nhat|largest|biggest)\b/, pick: byCapacity },
];

/**
 * The backend returns every available room type with an AI reply, even when the reply
 * is about one of them. Keep the cards the answer is actually about:
 * 1. the room types the reply names (in the order it names them), else all of them;
 * 2. narrowed to a single room when the question asks for "the cheapest/priciest/biggest"
 *    — even if the reply compared several.
 * Long lists that are left are collapsed by the chat bubble.
 */
export function pickRelevantRooms(reply: string, question: string, rooms: AvailableRoomType[] | null | undefined) {
  if (!rooms?.length) return rooms ?? null;

  const replyText = normalize(reply);
  const mentioned = rooms
    .map((room) => ({ room, at: replyText.indexOf(normalize(room.name)) }))
    .filter(({ at }) => at >= 0)
    .sort((a, b) => a.at - b.at)
    .map(({ room }) => room);
  const candidates = mentioned.length ? mentioned : rooms;

  const superlative = SUPERLATIVES.find(({ patterns }) => patterns.test(normalize(question)));
  return superlative ? [superlative.pick(candidates)] : candidates;
}
