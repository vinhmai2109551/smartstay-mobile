import { filterRooms } from './roomFilter';

const rooms = [
  { name: 'Standard', basePrice: 800_000 },
  { name: 'Deluxe', basePrice: 1_000_000 },
  { name: 'Suite', basePrice: 4_000_000 },
];
const names = (r: typeof rooms) => r.map((x) => x.name);

describe('filterRooms', () => {
  test('all + no names keeps everything', () => {
    expect(names(filterRooms(rooms, 'all', []))).toEqual(['Standard', 'Deluxe', 'Suite']);
  });
  test('price bounds are [min, max)', () => {
    expect(names(filterRooms(rooms, 'under1m', []))).toEqual(['Standard']);
    expect(names(filterRooms(rooms, '1to2m', []))).toEqual(['Deluxe']);
    expect(names(filterRooms(rooms, 'over4m', []))).toEqual(['Suite']);
  });
  test('room type names combine with price', () => {
    expect(names(filterRooms(rooms, 'all', ['Suite', 'Standard']))).toEqual(['Standard', 'Suite']);
    expect(names(filterRooms(rooms, 'under1m', ['Suite']))).toEqual([]);
  });
});
