import type { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

// Amenities are free-text from the backend, so match on keywords (lower-cased, Vietnamese or English).
const RULES: [RegExp, IconName][] = [
  [/wi-?fi|internet/, 'wifi'],
  [/điều hòa|điều hoà|máy lạnh|air ?con|a\/c/, 'snow-outline'],
  [/tivi|tv|truyền hình|smart tv/, 'tv-outline'],
  [/hồ bơi|bể bơi|pool/, 'water-outline'],
  [/bồn tắm|bath|vòi sen|shower|phòng tắm/, 'water-outline'],
  [/ăn sáng|bữa sáng|breakfast/, 'cafe-outline'],
  [/minibar|tủ lạnh|fridge/, 'wine-outline'],
  [/ban công|balcony|view|hướng biển|biển|sea/, 'sunny-outline'],
  [/vườn|garden/, 'leaf-outline'],
  [/đỗ xe|bãi xe|parking|gửi xe/, 'car-outline'],
  [/két|safe/, 'lock-closed-outline'],
  [/giường|bed/, 'bed-outline'],
  [/bàn làm việc|desk|làm việc/, 'laptop-outline'],
  [/gym|thể hình|fitness/, 'barbell-outline'],
  [/spa|massage/, 'flower-outline'],
  [/thú cưng|pet/, 'paw-outline'],
  [/máy sấy|hair ?dryer/, 'flash-outline'],
];

export function amenityIcon(amenity: string): IconName {
  const text = amenity.toLowerCase();
  return RULES.find(([pattern]) => pattern.test(text))?.[1] ?? 'checkmark-circle-outline';
}
