import { computed, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { ApiClientService } from './api-client.service';
import {
  AuthResponse,
  AuthSession,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  UpdateProfileRequest,
  UserProfile
} from '../../models/auth.model';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionSignal = signal<AuthSession | null>(null);

  readonly session = this.sessionSignal.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.sessionSignal()?.accessToken));

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
    return this.api.post<string>('Auth/register', request);
  }

  refresh(): Promise<void> {
    const session = this.sessionSignal();
    if (!session) {
      return Promise.resolve();
    }

    const request: RefreshTokenRequest = {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken
    };

    return new Promise((resolve, reject) => {
      this.api.post<AuthResponse>('Auth/refresh', request).subscribe({
        next: (response) => {
          this.persist(response);
          resolve();
        },
        error: reject
      });
    });
  }

  profile() {
    return this.api.get<UserProfile>('Auth/profile');
  }

  updateProfile(request: UpdateProfileRequest) {
    return this.api.put<string>('Auth/update-profile', request);
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
