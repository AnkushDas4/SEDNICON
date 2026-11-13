import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const ThemeContext = createContext();

function systemTheme() {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('sednicon-theme');
        if (stored === 'dark' || stored === 'light') return stored;
      } catch {
        /* storage unavailable */
      }
      return systemTheme();
    }
    return 'light';
  });
  const hasMounted = useRef(false);

  useEffect(() => {
    const root = document.documentElement;

    // Suppress every transition for the swap so colors don't smear,
    // then restore them on the next frame. Skipped on first render.
    if (hasMounted.current) {
      root.classList.add('theme-switching');
    }
    root.classList.toggle('dark', theme === 'dark');

    if (!hasMounted.current) {
      hasMounted.current = true;
      return undefined;
    }
    // Force a style flush before transitions come back.
    void root.offsetWidth;
    const frame = requestAnimationFrame(() => {
      root.classList.remove('theme-switching');
    });
    return () => {
      cancelAnimationFrame(frame);
      root.classList.remove('theme-switching');
    };
  }, [theme]);

  // Follow system preference changes until the user picks a theme explicitly.
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      let stored = null;
      try {
        stored = localStorage.getItem('sednicon-theme');
      } catch {
        /* storage unavailable */
      }
      if (stored !== 'dark' && stored !== 'light') {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Persist only explicit choices, so the system listener stays live otherwise.
  const setExplicitTheme = (next) => {
    try {
      localStorage.setItem('sednicon-theme', next);
    } catch {
      /* storage unavailable */
    }
    setTheme(next);
  };

  const toggleTheme = () => {
    setExplicitTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setExplicitTheme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
