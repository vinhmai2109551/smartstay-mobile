export type PaymentStatus = 'PAID' | 'PENDING' | 'FAILED';

export type CreatePaymentLinkDto = {
  bookingId: string;
  amount: number;
};

export type CreatePaymentLinkResponse = {
  checkoutUrl: string;
  qrCode: string;
  paymentLinkId: string;
};

export type PaymentStatusResponse = {
  status: PaymentStatus;
};
