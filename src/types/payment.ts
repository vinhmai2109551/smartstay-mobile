export type CreatePayosLinkResponse = {
  checkoutUrl: string;
  // Raw VietQR payload string — render it as a QR code locally, it is not an image URL.
  // null when the backend has no QR for this link (e.g. an existing link PayOS won't
  // return the QR of again); the checkout screen falls back to the payment page then.
  qrCode: string | null;
  // Missing in that same existing-link case.
  expiredAt?: number;
  // Bank-transfer details for the "Open banking app" / transfer-info flow — optional so
  // this keeps working against a backend that doesn't send them yet.
  bin?: string;
  accountNumber?: string;
  accountName?: string;
  amount?: number;
  description?: string;
  orderCode?: string;
};
