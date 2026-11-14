import { RoomType } from '@/types/room';

/** Mốc giá mỗi đêm (VND) cho bộ lọc — mobile dùng chip thay cho thanh trượt của web. */
export const PRICE_RANGES = [
  { key: 'all', min: 0, max: Infinity },
  { key: 'under1m', min: 0, max: 1_000_000 },
  { key: '1to2m', min: 1_000_000, max: 2_000_000 },
  { key: '2to4m', min: 2_000_000, max: 4_000_000 },
  { key: 'over4m', min: 4_000_000, max: Infinity },
] as const;

export type PriceRangeKey = (typeof PRICE_RANGES)[number]['key'];

/**
 * Lọc kết quả đã tải ở client, giống web (FilterSidebar): theo basePrice và tên loại phòng.
 * Khoảng giá tính [min, max); `names` rỗng = mọi loại phòng.
 */
export function filterRooms<T extends Pick<RoomType, 'basePrice' | 'name'>>(
  rooms: T[],
  priceKey: PriceRangeKey,
  names: string[],
): T[] {
  const range = PRICE_RANGES.find((r) => r.key === priceKey) ?? PRICE_RANGES[0];
  return rooms.filter(
    (room) =>
      room.basePrice >= range.min && room.basePrice < range.max && (names.length === 0 || names.includes(room.name)),
  );
}
