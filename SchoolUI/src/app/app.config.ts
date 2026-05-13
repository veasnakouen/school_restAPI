import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { ThemeService } from './core/services/theme.service';
import { PrimeNGThemeService } from './core/services/primeng-theme.service';
import { providePrimeNG } from 'primeng/config';
import { ConfirmationService, MessageService } from 'primeng/api';
import Aura from '@primeng/themes/aura';
import Lara from '@primeng/themes/lara';
import Nora from '@primeng/themes/nora';
import { DARK_THEME_IDS } from './core/services/theme.service';

const PRIMENG_PRESET_MAP: Record<string, any> = {
  aura: Aura,
  lara: Lara,
  nora: Nora
};

const DARK_THEMES = DARK_THEME_IDS;

export function getPrimeNGDarkModeSelector(): string {
  return DARK_THEMES.map(t => `[data-theme="${t}"]`).join(', ');
}

export function getPrimeNGPreset(): any {
  const preset = PrimeNGThemeService ? (window as any).primengPreset || 'aura' : 'aura';
  return PRIMENG_PRESET_MAP[preset] || Aura;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimations(),
    provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [ThemeService, PrimeNGThemeService],
      useFactory: (theme: ThemeService, primengTheme: PrimeNGThemeService) => () => {
        theme.initialize();
        primengTheme.initialize();
      }
    },
    provideHttpClient(withInterceptors([authInterceptor])),
    ConfirmationService,
    MessageService,
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: getPrimeNGDarkModeSelector(),
          ripple: true
        }
      }
    })
  ]
};