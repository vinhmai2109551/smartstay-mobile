import { apiClient } from './client';
import { AvailableRoomType, SearchAvailabilityParams } from '@/types/room';

export const roomsApi = {
  searchAvailability: (params: SearchAvailabilityParams) =>
    apiClient
      .get<AvailableRoomType[]>('/rooms/availability', { params })
      .then((r) => r.data),
};
