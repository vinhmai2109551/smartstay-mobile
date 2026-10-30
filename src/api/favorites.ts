import { RoomType } from "@/types/room";
import { apiClient } from "./client";

export const favoritesApi = {
  mine: () => apiClient.get<RoomType[]>("/favorites/me").then((r) => r.data),

  add: (roomTypeId: string) =>
    apiClient
      .post<{
        roomTypeId: string;
        isFavorite: boolean;
      }>(`/favorites/${roomTypeId}`)
      .then((r) => r.data),

  remove: (roomTypeId: string) =>
    apiClient
      .delete<{
        roomTypeId: string;
        isFavorite: boolean;
      }>(`/favorites/${roomTypeId}`)
      .then((r) => r.data),
};
