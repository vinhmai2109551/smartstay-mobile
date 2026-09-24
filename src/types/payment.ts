export type CreatePayosLinkResponse = {
  checkoutUrl: string;
  // Raw VietQR payload string — render it as a QR code locally, it is not an image URL.
  qrCode: string;
  expiredAt: number;
};
