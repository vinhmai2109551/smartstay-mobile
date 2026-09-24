export type RoomType = {
  roomTypeId: string;
  name: string;
  description?: string;
  basePrice: number;
  capacity: number;
  amenities: string[];
  images: string[];
  status?: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
};

export type RoomTypeDetail = RoomType;

export type AvailableRoomType = RoomType & {
  availableCount: number;
};

export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'MAINTENANCE';

export type SearchAvailabilityParams = {
  checkIn: string;
  checkOut: string;
  guests: number;
  roomTypeId?: string;
};
