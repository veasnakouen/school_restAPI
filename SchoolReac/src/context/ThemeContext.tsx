import React, { createContext, useState, useContext, useMemo, useEffect, useCallback, ReactNode } from "react";
import { flushSync } from "react-dom";

// Based on daisyUI themes from the original Angular project
const themes = [
  { id: 'light', name: 'Default Light' }, { id: 'dark', name: 'Default Dark' },
  { id: 'cupcake', name: 'Cupcake' }, { id: 'bumblebee', name: 'Bumblebee' },
  { id: 'emerald', name: 'Emerald' }, { id: 'corporate', name: 'Corporate' },
  { id: 'synthwave', name: 'Synthwave' }, { id: 'retro', name: 'Retro' },
  { id: 'cyberpunk', name: 'Cyberpunk' }, { id: 'valentine', name: 'Valentine' },
  { id: 'halloween', name: 'Halloween' }, { id: 'garden', name: 'Garden' },
  { id: 'forest', name: 'Forest' }, { id: 'aqua', name: 'Aqua' },
  { id: 'lofi', name: 'Lofi' }, { id: 'pastel', name: 'Pastel' },
  { id: 'fantasy', name: 'Fantasy' }, { id: 'wireframe', name: 'Wireframe' },
  { id: 'black', name: 'Black' }, { id: 'luxury', name: 'Luxury' },
  { id: 'dracula', name: 'Dracula' }, { id: 'cmyk', name: 'CMYK' },
  { id: 'autumn', name: 'Autumn' }, { id: 'business', name: 'Business' },
  { id: 'acid', name: 'Acid' }, { id: 'lemonade', name: 'Lemonade' },
  { id: 'night', name: 'Night' }, { id: 'coffee', name: 'Coffee' },
  { id: 'winter', name: 'Winter' },
];

type ThemeName = typeof themes[number]['id'];
export type ThemeAnimationPreset = 'eclipse-bloom' | 'silky-dissolve' | 'shutter-split' | 'diagonal';

export const THEME_ANIMATION_OPTIONS: { id: ThemeAnimationPreset; label: string }[] = [
  { id: 'eclipse-bloom', label: 'Eclipse Bloom' },
  { id: 'silky-dissolve', label: 'Studio Dissolve' },
  { id: 'shutter-split', label: 'Center Curtain' },
  { id: 'diagonal', label: 'Diagonal Prism' },
];

export interface ThemeTransitionOrigin {
  x: number;
  y: number;
}

const DARK_THEMES = ['dark', 'synthwave', 'halloween', 'forest', 'black', 'luxury', 'dracula', 'night', 'coffee'];
const PRESET_STORAGE_KEY = 'themeAnimationPreset';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleDarkMode: (
    origin?: ThemeTransitionOrigin | React.MouseEvent<HTMLElement>,
    presetOverride?: ThemeAnimationPreset
  ) => void;
  isDark: boolean;
  themeDisplayName: string;
  availableThemes: typeof themes;
  animationPreset: ThemeAnimationPreset;
  setAnimationPreset: (preset: ThemeAnimationPreset) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

const getInitialTheme = (): ThemeName => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedPrefs = window.localStorage.getItem('theme');
    if (storedPrefs && themes.some(t => t.id === storedPrefs)) {
      return storedPrefs as ThemeName;
    }
    const userMedia = window.matchMedia('(prefers-color-scheme: dark)');
    if (userMedia.matches) {
      return 'dark';
    }
  }
  return 'light';
};

const getInitialPreset = (): ThemeAnimationPreset => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem(PRESET_STORAGE_KEY);
    if (stored && THEME_ANIMATION_OPTIONS.some(o => o.id === stored)) {
      return stored as ThemeAnimationPreset;
    }
  }
  return 'eclipse-bloom';
};

const resolveOriginCoords = (origin?: ThemeTransitionOrigin | React.MouseEvent<HTMLElement>) => {
  if (!origin || typeof window === 'undefined') {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
    return { x: w - 48, y: 32 };
  }
  if ('currentTarget' in origin && origin.currentTarget) {
    const rect = origin.currentTarget.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    return { x: origin.clientX, y: origin.clientY };
  }
  return { x: (origin as ThemeTransitionOrigin).x, y: (origin as ThemeTransitionOrigin).y };
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeName>(getInitialTheme);
  const [animationPreset, setAnimationPresetState] = useState<ThemeAnimationPreset>(getInitialPreset);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setAnimationPreset = useCallback((preset: ThemeAnimationPreset) => {
    setAnimationPresetState(preset);
    if (typeof window !== 'undefined') {
      localStorage.setItem(PRESET_STORAGE_KEY, preset);
    }
  }, []);

  const isDark = useMemo(() => DARK_THEMES.includes(theme), [theme]);

  const applyAnimatedThemeChange = useCallback(
    (
      nextTheme: ThemeName,
      origin?: ThemeTransitionOrigin | React.MouseEvent<HTMLElement>,
      preset: ThemeAnimationPreset = animationPreset
    ) => {
      if (typeof document === 'undefined' || typeof window === 'undefined') {
        setThemeState(nextTheme);
        return;
      }

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const docWithTransition = document as Document & {
        startViewTransition?: (cb: () => void) => { finished: Promise<void> };
      };

      if (!prefersReduced && typeof docWithTransition.startViewTransition === 'function') {
        const root = document.documentElement;
        const { x, y } = resolveOriginCoords(origin);
        root.style.setProperty('--theme-x', `${x}px`);
        root.style.setProperty('--theme-y', `${y}px`);

        const nextIsDark = DARK_THEMES.includes(nextTheme);
        const attrValue =
          preset === 'diagonal'
            ? nextIsDark
              ? 'diagonal-dark'
              : 'diagonal-light'
            : preset;

        root.setAttribute('data-theme-transition', attrValue);
        const transition = docWithTransition.startViewTransition(() => {
          flushSync(() => {
            setThemeState(nextTheme);
          });
        });

        transition.finished.finally(() => {
          if (root.getAttribute('data-theme-transition') === attrValue) {
            root.removeAttribute('data-theme-transition');
          }
        });
        return;
      }

      if (!prefersReduced) {
        document.documentElement.classList.add('theme-transitioning');
        window.setTimeout(() => {
          document.documentElement.classList.remove('theme-transitioning');
        }, 380);
      }
      setThemeState(nextTheme);
    },
    [animationPreset]
  );

  const toggleDarkMode = useCallback(
    (origin?: ThemeTransitionOrigin | React.MouseEvent<HTMLElement>, presetOverride?: ThemeAnimationPreset) => {
      applyAnimatedThemeChange(isDark ? 'light' : 'dark', origin, presetOverride ?? animationPreset);
    },
    [animationPreset, applyAnimatedThemeChange, isDark]
  );

  const themeDisplayName = useMemo(() => themes.find(t => t.id === theme)?.name || theme, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: setThemeState,
      isDark,
      toggleDarkMode,
      themeDisplayName,
      availableThemes: themes,
      animationPreset,
      setAnimationPreset,
    }),
    [theme, isDark, toggleDarkMode, themeDisplayName, animationPreset, setAnimationPreset]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
