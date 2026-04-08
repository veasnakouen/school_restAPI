export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  roles?: string[];
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ConfirmEmailRequest {
  userId: string;
  token: string;
}

export interface ResendConfirmationEmailRequest {
  email: string;
}

export interface RefreshTokenRequest {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  userId: string;
  email: string;
  fullName: string;
  role?: string[];
  isSuccess?: boolean;
  message?: string | null;
  phoneNumber?: string | null;
  accessFailedCount?: number;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  phoneNumber?: string | null;
  phoneNumberConfirmed: boolean;
  accessFailedCount: number;
}

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber: string;
}
