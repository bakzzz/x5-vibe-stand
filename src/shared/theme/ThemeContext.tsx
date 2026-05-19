import React, { createContext, useContext, useState } from 'react';
import { ThemeConfig } from 'antd';
import { themeTokens as defaultTokens } from './tokens';

interface ThemeContextType {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTokens,
  setTheme: () => {},
  resetTheme: () => {},
});

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('hub-theme-v2');
    return saved ? JSON.parse(saved) : defaultTokens;
  });

  const setTheme = (newTheme: ThemeConfig) => {
    setThemeState(newTheme);
    localStorage.setItem('hub-theme-v2', JSON.stringify(newTheme));
  };

  const resetTheme = () => {
    setThemeState(defaultTokens);
    localStorage.removeItem('hub-theme-v2');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppTheme = () => useContext(ThemeContext);
