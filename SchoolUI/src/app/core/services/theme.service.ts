import { computed, Injectable, signal } from '@angular/core';

const DAISYUI_THEME_ORDER = [
  'light',
  'dark',
  'cupcake',
  'bumblebee',
  'emerald',
  'corporate',
  'synthwave',
  'retro',
  'cyberpunk',
  'valentine',
  'halloween',
  'garden',
  'forest',
  'aqua',
  'lofi',
  'pastel',
  'fantasy',
  'wireframe',
  'black',
  'luxury',
  'dracula',
  'cmyk',
  'autumn',
  'business',
  'acid',
  'lemonade',
  'night',
  'coffee',
  'winter',
  'dim',
  'nord',
  'sunset'
] as const;

export type ThemeName = (typeof DAISYUI_THEME_ORDER)[number];

export interface ThemeOption {
  id: ThemeName;
  name: string;
}

const THEME_LABEL_OVERRIDES: Partial<Record<ThemeName, string>> = {
  cmyk: 'CMYK',
  lofi: 'Lo-Fi'
};

const DARK_THEME_NAMES: ThemeName[] = [
  'dark',
  'synthwave',
  'halloween',
  'forest',
  'aqua',
  'black',
  'luxury',
  'dracula',
  'business',
  'night',
  'coffee',
  'dim',
  'sunset'
];

const DARK_THEME_SET = new Set<ThemeName>(DARK_THEME_NAMES);

const THEME_OPTIONS: ThemeOption[] = DAISYUI_THEME_ORDER.map((id) => ({
  id,
  name: THEME_LABEL_OVERRIDES[id] ?? `${id.charAt(0).toUpperCase()}${id.slice(1)}`
}));

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly KEY = 'theme';
  private readonly DEFAULT_THEME: ThemeName = 'dark';
  readonly themes = THEME_OPTIONS;

  private readonly theme = signal<ThemeName>(this.readTheme());

  readonly isDark = computed(() => {
    return this.isDarkTheme(this.theme());
  });
  readonly themeName = this.theme.asReadonly();
  readonly themeDisplayName = computed(() => this.themes.find((option) => option.id === this.theme())?.name ?? this.theme());
  readonly themeLabel = computed(() => (this.isDark() ? 'Dark' : 'Light'));

  constructor() {}

  initialize(): void {
    this.applyTheme(this.theme());
  }

  setTheme(theme: ThemeName): void {
    this.theme.set(theme);
    this.applyTheme(theme);
    this.persistTheme(theme);
  }

  toggle(): void {
    const nextTheme: ThemeName = this.isDark() ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }

  private readTheme(): ThemeName {
    if (typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem(this.KEY);
      if (savedTheme && this.isValidTheme(savedTheme)) {
        return savedTheme;
      }
    }
    return this.DEFAULT_THEME;
  }

  private isValidTheme(theme: string): theme is ThemeName {
    return (DAISYUI_THEME_ORDER as readonly string[]).includes(theme);
  }

  private isDarkTheme(theme: ThemeName): boolean {
    return DARK_THEME_SET.has(theme);
  }

  private applyTheme(theme: ThemeName): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.style.setProperty('color-scheme', this.isDarkTheme(theme) ? 'dark' : 'light');
      if (document.body) {
        document.body.setAttribute('data-theme', theme);
        document.body.style.setProperty('color-scheme', this.isDarkTheme(theme) ? 'dark' : 'light');
      }
    }
  }

  private persistTheme(theme: ThemeName): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.KEY, theme);
    }
  }
}
