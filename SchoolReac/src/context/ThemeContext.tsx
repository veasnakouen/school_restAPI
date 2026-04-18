import React, { createContext, useState, useContext, useMemo, useEffect, ReactNode } from "react";

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

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleDarkMode: () => void;
  isDark: boolean;
  themeDisplayName: string;
  availableThemes: typeof themes;
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

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeName>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const isDark = useMemo(() => {
    const darkThemes = ['dark', 'synthwave', 'halloween', 'forest', 'black', 'luxury', 'dracula', 'night', 'coffee'];
    return darkThemes.includes(theme);
  }, [theme]);

  const toggleDarkMode = () => setThemeState(isDark ? 'light' : 'dark');
  const themeDisplayName = useMemo(() => themes.find(t => t.id === theme)?.name || theme, [theme]);

  const value = { theme, setTheme: setThemeState, isDark, toggleDarkMode, themeDisplayName, availableThemes: themes };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};