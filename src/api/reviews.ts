import { apiClient } from './client';
import { CreateReviewDto, MyReview, Review } from '@/types/review';

export const reviewsApi = {
  create: (dto: CreateReviewDto) => apiClient.post<Review>('/reviews', dto).then((r) => r.data),

  // Newest first; the backend returns every review for the room type, unpaginated.
  byRoomType: (roomTypeId: string) =>
    apiClient.get<Review[]>('/reviews', { params: { roomTypeId } }).then((r) => r.data),

  // The signed-in guest's own reviews — used to tell which bookings are already reviewed.
  mine: () => apiClient.get<MyReview[]>('/reviews/me').then((r) => r.data),
};
