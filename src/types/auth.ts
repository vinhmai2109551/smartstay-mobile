export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER';
export type UserStatus = 'Active' | 'Locked';

export type User = {
  userId: string;
  email: string;
  fullName: string;
  phone: string;
  idNumber?: string | null;
  address?: string | null;
  role: UserRole;
  status?: UserStatus;
  mustChangePassword?: boolean;
};

// Refresh token is not returned in JSON — it is set as an httpOnly cookie by
// the backend (see doc/API.md 0.2), so the client only ever handles the
// access token directly.
export type LoginResponse = {
  accessToken: string;
  user: User;
};

export type LoginDto = {
  email: string;
  password: string;
  // Required by the backend (Cloudflare Turnstile) — native apps cannot
  // produce a valid token, see doc/API.md 0.1. Password login is disabled
  // on mobile until the backend adds a native-friendly alternative.
  turnstileToken: string;
};

export type GoogleLoginDto = {
  idToken: string;
};

export type RegisterDto = {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
};

// Step 1/2 — does not create the account yet, just sends an OTP.
export type RegisterResponse = { message: string };

export type VerifyOtpDto = { email: string; otp: string };
export type ResendOtpDto = { email: string };

export type ForgotPasswordDto = { email: string };
export type VerifyResetOtpDto = { email: string; otp: string };
export type ResetPasswordDto = { email: string; otp: string; newPassword: string };

export type ChangePasswordDto = {
  oldPassword: string;
  newPassword: string;
};

export type UpdateProfileDto = {
  fullName?: string;
  phone?: string;
  address?: string;
  idNumber?: string;
};
