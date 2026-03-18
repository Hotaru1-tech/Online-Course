import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeCtx = createContext(null);

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

export function ThemeProvider({ children }) {
  const [theme] = useState('dark');

  useEffect(() => {
    applyTheme('dark');
    localStorage.setItem('theme', 'dark');
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggle() {
        // dark-only
      },
      set(theme) {
        // dark-only
      }
    }),
    [theme]
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('ThemeProvider missing');
  return ctx;
}
