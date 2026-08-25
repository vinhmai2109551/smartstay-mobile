export type Amenity = {
  id: string;
  name: string;
  icon?: string;
};

export type RoomType = {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  capacity: number;
  amenities: Amenity[] | string[];
  images: string[];
  status?: 'ACTIVE' | 'INACTIVE';
  avgRating?: number;
};

export type RoomTypeDetail = RoomType & {
  roomTypeDetail?: Record<string, unknown>;
};

export type AvailableRoomType = RoomType & {
  availableCount?: number;
};

export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'BOOKED' | 'CLEANING' | 'MAINTENANCE';

export type Room = {
  id: string;
  roomNumber: string;
  floorId: string;
  roomTypeId: string;
  status: RoomStatus;
};

export type SearchAvailabilityParams = {
  checkIn: string;
  checkOut: string;
  guests: number;
  roomTypeId?: string;
};
