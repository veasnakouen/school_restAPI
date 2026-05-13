import { Injectable, signal, computed } from '@angular/core';

export type PrimeNGPreset = 'aura' | 'lara' | 'nora';

export interface PrimeNGThemeOption {
  id: PrimeNGPreset;
  name: string;
  description: string;
}

export const PRIMENG_THEME_OPTIONS: PrimeNGThemeOption[] = [
  { id: 'aura', name: 'Aura', description: 'Modern, rounded with soft shadows' },
  { id: 'lara', name: 'Lara', description: 'Clean, minimalist design' },
  { id: 'nora', name: 'Nora', description: 'Fresh, vibrant colors' }
];

@Injectable({ providedIn: 'root' })
export class PrimeNGThemeService {
  private readonly KEY = 'primeng_theme';
  private readonly DEFAULT_PRESET: PrimeNGPreset = 'aura';
  
  private readonly preset = signal<PrimeNGPreset>(this.readPreset());
  
  readonly currentPreset = this.preset.asReadonly();
  readonly themes = PRIMENG_THEME_OPTIONS;

  constructor() {}

  initialize(): void {
    this.applyTheme(this.preset());
  }

  readPreset(): PrimeNGPreset {
    try {
      const saved = localStorage.getItem(this.KEY);
      if (saved && PRIMENG_THEME_OPTIONS.find(p => p.id === saved)) {
        return saved as PrimeNGPreset;
      }
    } catch {}
    return this.DEFAULT_PRESET;
  }

  persistPreset(preset: PrimeNGPreset): void {
    try {
      localStorage.setItem(this.KEY, preset);
    } catch {}
  }

  setPreset(preset: PrimeNGPreset): void {
    this.preset.set(preset);
    this.persistPreset(preset);
    this.applyTheme(preset);
  }

  getPreset(): PrimeNGPreset {
    return this.preset();
  }

  applyTheme(preset: PrimeNGPreset): void {
    const root = document.documentElement;
    root.classList.remove('primeng-aura', 'primeng-lara', 'primeng-nora');
    root.classList.add(`primeng-${preset}`);
  }
}