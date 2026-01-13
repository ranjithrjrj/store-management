// FILE PATH: lib/themes.ts
// Theme configuration system with multiple color schemes

export type ThemeName = 'emerald' | 'blue' | 'purple' | 'teal' | 'slate';

export type Theme = {
  name: ThemeName;
  displayName: string;
  description: string;
  colors: {
    // Primary colors
    primary: string;
    primaryHover: string;
    primaryLight: string;
    primaryLighter: string;
    
    // Accent colors
    accent: string;
    accentHover: string;
    
    // Semantic colors (keep consistent across themes)
    success: string;
    successLight: string;
    warning: string;
    warningLight: string;
    danger: string;
    dangerLight: string;
    
    // Neutral colors (keep consistent)
    gray50: string;
    gray100: string;
    gray200: string;
    gray300: string;
    gray500: string;
    gray600: string;
    gray700: string;
    gray900: string;
  };
  
  // Tailwind class mappings for easy use
  classes: {
    // Buttons
    btnPrimary: string;
    btnPrimaryHover: string;
    btnSecondary: string;
    btnSecondaryHover: string;
    
    // Backgrounds
    bgPrimary: string;
    bgPrimaryLight: string;
    bgPrimaryLighter: string;
    
    // Text
    textPrimary: string;
    textPrimaryHover: string;
    
    // Borders
    borderPrimary: string;
    
    // Badges
    badgePrimary: string;
    badgeAccent: string;
    
    // Focus rings
    focusRing: string;
  };
};

export const themes: Record<ThemeName, Theme> = {
  emerald: {
    name: 'emerald',
    displayName: 'Emerald Green',
    description: 'Fresh and inviting - Perfect for growth and prosperity',
    colors: {
      primary: '#10b981',
      primaryHover: '#059669',
      primaryLight: '#d1fae5',
      primaryLighter: '#ecfdf5',
      accent: '#f97316',
      accentHover: '#ea580c',
      success: '#10b981',
      successLight: '#d1fae5',
      warning: '#f59e0b',
      warningLight: '#fef3c7',
      danger: '#ef4444',
      dangerLight: '#fee2e2',
      gray50: '#f9fafb',
      gray100: '#f3f4f6',
      gray200: '#e5e7eb',
      gray300: '#d1d5db',
      gray500: '#6b7280',
      gray600: '#4b5563',
      gray700: '#374151',
      gray900: '#111827',
    },
    classes: {
      btnPrimary: 'bg-emerald-600 hover:bg-emerald-700',
      btnPrimaryHover: 'hover:bg-emerald-700',
      btnSecondary: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50',
      btnSecondaryHover: 'hover:bg-emerald-50',
      bgPrimary: 'bg-emerald-600',
      bgPrimaryLight: 'bg-emerald-100',
      bgPrimaryLighter: 'bg-emerald-50',
      textPrimary: 'text-emerald-600',
      textPrimaryHover: 'text-emerald-700',
      borderPrimary: 'border-emerald-300',
      badgePrimary: 'bg-emerald-100 text-emerald-800',
      badgeAccent: 'bg-orange-100 text-orange-800',
      focusRing: 'focus:ring-emerald-500',
    },
  },
  
  blue: {
    name: 'blue',
    displayName: 'Ocean Blue',
    description: 'Classic and trustworthy - Professional standard',
    colors: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      primaryLight: '#dbeafe',
      primaryLighter: '#eff6ff',
      accent: '#8b5cf6',
      accentHover: '#7c3aed',
      success: '#10b981',
      successLight: '#d1fae5',
      warning: '#f59e0b',
      warningLight: '#fef3c7',
      danger: '#ef4444',
      dangerLight: '#fee2e2',
      gray50: '#f9fafb',
      gray100: '#f3f4f6',
      gray200: '#e5e7eb',
      gray300: '#d1d5db',
      gray500: '#6b7280',
      gray600: '#4b5563',
      gray700: '#374151',
      gray900: '#111827',
    },
    classes: {
      btnPrimary: 'bg-blue-600 hover:bg-blue-700',
      btnPrimaryHover: 'hover:bg-blue-700',
      btnSecondary: 'border-blue-300 text-blue-700 hover:bg-blue-50',
      btnSecondaryHover: 'hover:bg-blue-50',
      bgPrimary: 'bg-blue-600',
      bgPrimaryLight: 'bg-blue-100',
      bgPrimaryLighter: 'bg-blue-50',
      textPrimary: 'text-blue-600',
      textPrimaryHover: 'text-blue-700',
      borderPrimary: 'border-blue-300',
      badgePrimary: 'bg-blue-100 text-blue-800',
      badgeAccent: 'bg-purple-100 text-purple-800',
      focusRing: 'focus:ring-blue-500',
    },
  },
  
  purple: {
    name: 'purple',
    displayName: 'Deep Purple',
    description: 'Premium and modern - Tech-forward look',
    colors: {
      primary: '#8b5cf6',
      primaryHover: '#7c3aed',
      primaryLight: '#ede9fe',
      primaryLighter: '#f5f3ff',
      accent: '#ec4899',
      accentHover: '#db2777',
      success: '#10b981',
      successLight: '#d1fae5',
      warning: '#f59e0b',
      warningLight: '#fef3c7',
      danger: '#ef4444',
      dangerLight: '#fee2e2',
      gray50: '#f9fafb',
      gray100: '#f3f4f6',
      gray200: '#e5e7eb',
      gray300: '#d1d5db',
      gray500: '#6b7280',
      gray600: '#4b5563',
      gray700: '#374151',
      gray900: '#111827',
    },
    classes: {
      btnPrimary: 'bg-purple-600 hover:bg-purple-700',
      btnPrimaryHover: 'hover:bg-purple-700',
      btnSecondary: 'border-purple-300 text-purple-700 hover:bg-purple-50',
      btnSecondaryHover: 'hover:bg-purple-50',
      bgPrimary: 'bg-purple-600',
      bgPrimaryLight: 'bg-purple-100',
      bgPrimaryLighter: 'bg-purple-50',
      textPrimary: 'text-purple-600',
      textPrimaryHover: 'text-purple-700',
      borderPrimary: 'border-purple-300',
      badgePrimary: 'bg-purple-100 text-purple-800',
      badgeAccent: 'bg-pink-100 text-pink-800',
      focusRing: 'focus:ring-purple-500',
    },
  },
  
  teal: {
    name: 'teal',
    displayName: 'Teal Cyan',
    description: 'Modern and energetic - Fresh commerce look',
    colors: {
      primary: '#14b8a6',
      primaryHover: '#0d9488',
      primaryLight: '#ccfbf1',
      primaryLighter: '#f0fdfa',
      accent: '#f59e0b',
      accentHover: '#d97706',
      success: '#10b981',
      successLight: '#d1fae5',
      warning: '#f59e0b',
      warningLight: '#fef3c7',
      danger: '#ef4444',
      dangerLight: '#fee2e2',
      gray50: '#f9fafb',
      gray100: '#f3f4f6',
      gray200: '#e5e7eb',
      gray300: '#d1d5db',
      gray500: '#6b7280',
      gray600: '#4b5563',
      gray700: '#374151',
      gray900: '#111827',
    },
    classes: {
      btnPrimary: 'bg-teal-600 hover:bg-teal-700',
      btnPrimaryHover: 'hover:bg-teal-700',
      btnSecondary: 'border-teal-300 text-teal-700 hover:bg-teal-50',
      btnSecondaryHover: 'hover:bg-teal-50',
      bgPrimary: 'bg-teal-600',
      bgPrimaryLight: 'bg-teal-100',
      bgPrimaryLighter: 'bg-teal-50',
      textPrimary: 'text-teal-600',
      textPrimaryHover: 'text-teal-700',
      borderPrimary: 'border-teal-300',
      badgePrimary: 'bg-teal-100 text-teal-800',
      badgeAccent: 'bg-amber-100 text-amber-800',
      focusRing: 'focus:ring-teal-500',
    },
  },
  
  slate: {
    name: 'slate',
    displayName: 'Slate Modern',
    description: 'Minimal and sophisticated - Premium aesthetic',
    colors: {
      primary: '#0ea5e9',
      primaryHover: '#0284c7',
      primaryLight: '#e0f2fe',
      primaryLighter: '#f0f9ff',
      accent: '#f43f5e',
      accentHover: '#e11d48',
      success: '#10b981',
      successLight: '#d1fae5',
      warning: '#f59e0b',
      warningLight: '#fef3c7',
      danger: '#ef4444',
      dangerLight: '#fee2e2',
      gray50: '#f8fafc',
      gray100: '#f1f5f9',
      gray200: '#e2e8f0',
      gray300: '#cbd5e1',
      gray500: '#64748b',
      gray600: '#475569',
      gray700: '#334155',
      gray900: '#0f172a',
    },
    classes: {
      btnPrimary: 'bg-sky-600 hover:bg-sky-700',
      btnPrimaryHover: 'hover:bg-sky-700',
      btnSecondary: 'border-slate-300 text-slate-700 hover:bg-slate-50',
      btnSecondaryHover: 'hover:bg-slate-50',
      bgPrimary: 'bg-sky-600',
      bgPrimaryLight: 'bg-sky-100',
      bgPrimaryLighter: 'bg-sky-50',
      textPrimary: 'text-sky-600',
      textPrimaryHover: 'text-sky-700',
      borderPrimary: 'border-slate-300',
      badgePrimary: 'bg-sky-100 text-sky-800',
      badgeAccent: 'bg-rose-100 text-rose-800',
      focusRing: 'focus:ring-sky-500',
    },
  },
};

export const defaultTheme: ThemeName = 'emerald';

export function getTheme(themeName: ThemeName = defaultTheme): Theme {
  return themes[themeName] || themes[defaultTheme];
}

export function getThemeNames(): { name: ThemeName; displayName: string; description: string }[] {
  return Object.values(themes).map(t => ({
    name: t.name,
    displayName: t.displayName,
    description: t.description,
  }));
}