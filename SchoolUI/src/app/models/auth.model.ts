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
  imageUrl?: string | null;
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
  imageUrl?: string | null;
  roles: string[];
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  imageUrl?: string | null;
  roles: string[];
  phoneNumber?: string | null;
  phoneNumberConfirmed: boolean;
  accessFailedCount: number;
}

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber: string;
}

export interface SidebarSummaryResponse {
  profile: UserProfile;
  classes: import('./paging.model').PagedResult<import('./academic.model').ClassDto>;
  students: import('./paging.model').PagedResult<import('./academic.model').StudentDto>;
  products: import('./paging.model').PagedResult<import('./inventory.model').ProductDto> | null;
  errors: {
    classes: string | null;
    students: string | null;
    products: string | null;
  };
}
