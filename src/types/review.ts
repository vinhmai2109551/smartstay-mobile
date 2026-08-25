export type Review = {
  id: string;
  bookingId: string;
  roomTypeId?: string;
  rating: number;
  comment: string;
  createdAt?: string;
  userFullName?: string;
};

export type CreateReviewDto = {
  bookingId: string;
  rating: number;
  comment: string;
};
