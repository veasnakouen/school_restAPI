import { computed, Injectable, signal } from '@angular/core';

type ThemeName = 'night' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly KEY = 'app-theme';

  private readonly theme = signal<ThemeName>(this.readTheme());

  readonly isDark = computed(() => this.theme() === 'night');
  readonly themeName = this.theme.asReadonly();

  constructor() {
    this.applyTheme(this.theme());
  }

  initialize(): void {
    this.applyTheme(this.theme());
  }

  toggle(): void {
    const nextTheme: ThemeName = this.theme() === 'night' ? 'light' : 'night';
    this.theme.set(nextTheme);
    this.applyTheme(nextTheme);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.KEY, nextTheme);
    }
  }

  private readTheme(): ThemeName {
    return typeof localStorage !== 'undefined' && localStorage.getItem(this.KEY) === 'light' ? 'light' : 'night';
  }

  private applyTheme(theme: ThemeName): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      if (document.body) {
        document.body.setAttribute('data-theme', theme);
      }
    }
  }
}
