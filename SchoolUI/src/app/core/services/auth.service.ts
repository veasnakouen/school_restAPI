import { computed, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap, throwError } from 'rxjs';
import { ApiClientService } from './api-client.service';
import {
  AuthResponse,
  AuthSession,
  SidebarSummaryResponse,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  UpdateProfileRequest,
  UserProfile,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ConfirmEmailRequest,
  ResendConfirmationEmailRequest
} from '../../models/auth.model';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionSignal = signal<AuthSession | null>(null);

  readonly session = this.sessionSignal.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.sessionSignal()?.accessToken));

  /** Returns true if the current user has the 'Admin' role. */
  isAdmin(): boolean {
    const session = this.sessionSignal();
    return !!session && Array.isArray(session.roles) && session.roles.includes('Admin');
  }

  constructor(
    private readonly api: ApiClientService,
    private readonly storage: TokenStorageService,
    private readonly router: Router
  ) {
    this.sessionSignal.set(this.storage.read());
  }

  login(request: LoginRequest) {
    return this.api.post<AuthResponse>('Auth/login', request).pipe(tap((response) => this.persist(response)));
  }

  register(request: RegisterRequest) {
    return this.api.post<AuthResponse>('Auth/register', request).pipe(tap((response) => this.persist(response)));
  }

  forgotPassword(request: ForgotPasswordRequest) {
    return this.api.post<{ message: string; isSuccess: boolean }>('Auth/forgot-password', request);
  }

  resetPassword(request: ResetPasswordRequest) {
    return this.api.post<{ message: string; isSuccess: boolean }>('Auth/reset-password', request);
  }

  confirmEmail(request: ConfirmEmailRequest) {
    return this.api.get<{ message: string; isSuccess: boolean }>('Auth/confirm-email', request);
  }

  resendConfirmationEmail(request: ResendConfirmationEmailRequest) {
    return this.api.post<{ message: string; isSuccess: boolean; userId?: string; confirmationToken?: string }>(
      'Auth/resend-confirmation-email',
      request
    );
  }

  refresh() {
    const session = this.sessionSignal();
    if (!session) {
      return throwError(() => new Error('No active session.'));
    }

    const request: RefreshTokenRequest = {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken
    };

    return this.api.post<AuthResponse>('Auth/refresh', request).pipe(tap((response) => this.persist(response)));
  }

  profile() {
    return this.api.get<UserProfile>('Auth/profile');
  }

  sidebarSummary() {
    return this.api.get<SidebarSummaryResponse>('Auth/sidebar-summary');
  }

  updateProfile(request: UpdateProfileRequest) {
    return this.api.put<string>('Auth/update-profile', request);
  }

  updateSession(update: Partial<AuthSession>): void {
    const session = this.sessionSignal();
    if (!session) {
      return;
    }

    const nextSession = {
      ...session,
      ...update
    };

    this.storage.write(nextSession);
    this.sessionSignal.set(nextSession);
  }

  logout(): void {
    this.storage.clear();
    this.sessionSignal.set(null);
    void this.router.navigate(['/login']);
  }

  private persist(response: AuthResponse): void {
    const session: AuthSession = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresAt: response.expiresAt,
      userId: response.userId,
      email: response.email,
      fullName: response.fullName,
      roles: response.role ?? []
    };

    this.storage.write(session);
    this.sessionSignal.set(session);
  }
}
