import { computed, Injectable, signal } from '@angular/core';

export type LandingRoute = 'dashboard' | 'profile' | 'students' | 'reports' | 'api-console';

export interface UserPreferences {
  sidebarOpen: boolean;
  sidebarOverlay: boolean;
  compactMode: boolean;
  emailNotifications: boolean;
  desktopNotifications: boolean;
  defaultLandingRoute: LandingRoute;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  sidebarOpen: true,
  sidebarOverlay: false,
  compactMode: false,
  emailNotifications: true,
  desktopNotifications: false,
  defaultLandingRoute: 'dashboard'
};

@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private readonly storageKey = 'school-ui.preferences';
  private readonly stateSignal = signal<UserPreferences>(this.readPreferences());

  readonly preferences = this.stateSignal.asReadonly();
  readonly sidebarOpen = computed(() => this.stateSignal().sidebarOpen);
  readonly sidebarOverlay = computed(() => this.stateSignal().sidebarOverlay);
  readonly compactMode = computed(() => this.stateSignal().compactMode);
  readonly emailNotifications = computed(() => this.stateSignal().emailNotifications);
  readonly desktopNotifications = computed(() => this.stateSignal().desktopNotifications);
  readonly defaultLandingRoute = computed(() => this.stateSignal().defaultLandingRoute);

  update(partial: Partial<UserPreferences>): void {
    const nextPreferences = this.normalize(partial, this.stateSignal());
    this.stateSignal.set(nextPreferences);
    this.persist(nextPreferences);
  }

  reset(): void {
    this.stateSignal.set(DEFAULT_PREFERENCES);
    this.persist(DEFAULT_PREFERENCES);
  }

  private readPreferences(): UserPreferences {
    if (typeof localStorage === 'undefined') {
      return DEFAULT_PREFERENCES;
    }

    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return DEFAULT_PREFERENCES;
    }

    try {
      return this.normalize(JSON.parse(raw) as Partial<UserPreferences>);
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  private normalize(preferences: Partial<UserPreferences>, fallback: UserPreferences = DEFAULT_PREFERENCES): UserPreferences {
    return {
      sidebarOpen: typeof preferences.sidebarOpen === 'boolean' ? preferences.sidebarOpen : fallback.sidebarOpen,
      sidebarOverlay: typeof preferences.sidebarOverlay === 'boolean' ? preferences.sidebarOverlay : fallback.sidebarOverlay,
      compactMode: typeof preferences.compactMode === 'boolean' ? preferences.compactMode : fallback.compactMode,
      emailNotifications:
        typeof preferences.emailNotifications === 'boolean' ? preferences.emailNotifications : fallback.emailNotifications,
      desktopNotifications:
        typeof preferences.desktopNotifications === 'boolean'
          ? preferences.desktopNotifications
          : fallback.desktopNotifications,
      defaultLandingRoute: this.isLandingRoute(preferences.defaultLandingRoute)
        ? preferences.defaultLandingRoute
        : fallback.defaultLandingRoute
    };
  }

  private isLandingRoute(value: unknown): value is LandingRoute {
    return value === 'dashboard' || value === 'profile' || value === 'students' || value === 'reports' || value === 'api-console';
  }

  private persist(preferences: UserPreferences): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(preferences));
  }
}