import { apiClient } from './client';
import { Paginated } from '@/types/common';
import { CreateReviewDto, Review } from '@/types/review';

export const reviewsApi = {
  create: (dto: CreateReviewDto) => apiClient.post<{ review: Review }>('/reviews', dto).then((r) => r.data.review),

  byRoomType: (roomTypeId: string, page = 1, limit = 10) =>
    apiClient
      .get<Paginated<Review> & { avgRating: number }>('/reviews', { params: { roomTypeId, page, limit } })
      .then((r) => r.data),
};
