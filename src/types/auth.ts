export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export type User = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  status?: string;
  isLocked?: boolean;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type LoginDto = {
  email: string;
  password: string;
};

export type RegisterDto = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
};

export type ChangePasswordDto = {
  oldPassword: string;
  newPassword: string;
};

export type LoginResponse = AuthTokens & { user: User };
export type RegisterResponse = { user: User };
