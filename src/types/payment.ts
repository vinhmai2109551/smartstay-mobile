export type CreatePayosLinkResponse = {
  checkoutUrl: string;
  // Raw VietQR payload string — render it as a QR code locally, it is not an image URL.
  // null when the link already existed (e.g. created when booking through the AI chat):
  // PayOS doesn't return the QR of an existing link, only its checkout page.
  qrCode: string | null;
  // Missing in that same existing-link case.
  expiredAt?: number;
};
