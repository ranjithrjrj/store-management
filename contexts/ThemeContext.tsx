// FILE PATH: contexts/ThemeContext.tsx
// Theme context to provide theme throughout the app

'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, ThemeName, getTheme, defaultTheme } from '@/lib/themes';
import { supabase } from '@/lib/supabase';

type ThemeContextType = {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (themeName: ThemeName) => Promise<void>;
  isLoading: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>(defaultTheme);
  const [theme, setThemeState] = useState<Theme>(getTheme(defaultTheme));
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from database on mount
  useEffect(() => {
    loadThemeFromDB();
  }, []);

  async function loadThemeFromDB() {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('theme')
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0 && data[0].theme) {
        const savedTheme = data[0].theme as ThemeName;
        setThemeName(savedTheme);
        setThemeState(getTheme(savedTheme));
      }
    } catch (err) {
      console.error('Error loading theme:', err);
      // Use default theme on error
    } finally {
      setIsLoading(false);
    }
  }

  async function setTheme(newThemeName: ThemeName) {
    try {
      // Update database
      const { error } = await supabase
        .from('store_settings')
        .update({ theme: newThemeName })
        .eq('id', (await supabase.from('store_settings').select('id').limit(1).single()).data?.id);

      if (error) throw error;

      // Update state
      setThemeName(newThemeName);
      setThemeState(getTheme(newThemeName));
    } catch (err) {
      console.error('Error saving theme:', err);
      throw err;
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}