export type Promotion = {
  id: string;
  code: string;
  description: string;
  discountType: 'PERCENT' | 'AMOUNT';
  discountValue: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  isActive?: boolean;
};

export type ValidatePromotionResponse = {
  valid: boolean;
  discountAmount: number;
  promotion?: Promotion;
};
