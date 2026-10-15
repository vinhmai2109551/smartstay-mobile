// Mirrors the backend's public review shape (ReviewService.toPublicResponse).
export type Review = {
  reviewId: string;
  rating: number;
  comment: string;
  reviewDate: string;
  reply: string | null;
  authorName: string;
  roomTypeId: string | null;
  roomTypeName: string | null;
};

// GET /reviews/me also says which booking each review belongs to.
export type MyReview = Review & { bookingId: string | null };

export type CreateReviewDto = {
  bookingId: string;
  // 0.5–5 in half-star steps.
  rating: number;
  // 5–1000 characters.
  comment: string;
};

export const REVIEW_COMMENT_MIN = 5;
export const REVIEW_COMMENT_MAX = 1000;
