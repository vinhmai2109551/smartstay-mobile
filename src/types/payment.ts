export type CreatePayosLinkResponse = {
  checkoutUrl: string;
  // Raw VietQR payload string — render it as a QR code locally, it is not an image URL.
  // Null when the backend can't generate a QR for this link; the checkout screen falls
  // back to the "Open payment page" button in that case.
  qrCode: string | null;
  expiredAt: number;
  // Bank-transfer details for the "Open banking app" / transfer-info flow — optional so
  // this keeps working against a backend that doesn't send them yet.
  bin?: string;
  accountNumber?: string;
  accountName?: string;
  amount?: number;
  description?: string;
  orderCode?: string;
};
