import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { STORAGE_KEYS } from '../constants';

const ThemeContext = createContext(null);

const getInitialTheme = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.THEME);
  return saved === 'day' ? 'day' : 'night';
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isNight: theme === 'night',
      setTheme,
      toggleTheme: () =>
        setTheme((current) => (current === 'night' ? 'day' : 'night')),
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
