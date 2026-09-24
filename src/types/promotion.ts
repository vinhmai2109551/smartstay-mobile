export type DiscountType = 'PERCENTAGE' | 'FIXED';

export type Promotion = {
  promotionId: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usedCount?: number;
  isActive?: boolean;
};

export type ValidatePromotionResponse = {
  valid: boolean;
  discountAmount: number;
  promotion?: Promotion;
};
