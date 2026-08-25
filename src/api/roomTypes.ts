import { apiClient } from './client';
import { RoomType, RoomTypeDetail } from '@/types/room';

export type RoomTypeListParams = {
  capacity?: number;
  priceMin?: number;
  priceMax?: number;
  search?: string;
};

export const roomTypesApi = {
  list: (params?: RoomTypeListParams) =>
    apiClient.get<RoomType[]>('/room-types', { params }).then((r) => r.data),

  detail: (id: string) =>
    apiClient.get<RoomTypeDetail>(`/room-types/${id}`).then((r) => r.data),
};
