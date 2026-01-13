// FILE PATH: components/ui/Button.tsx
// Themed button component with variants

'use client';
import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const { theme } = useTheme();

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-base',
  };

  const variantClasses = {
    primary: `${theme.classes.btnPrimary} text-white shadow-sm`,
    secondary: `bg-white ${theme.classes.btnSecondary} border`,
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    ghost: `${theme.classes.textPrimary} ${theme.classes.btnSecondaryHover}`,
  };

  const baseClasses = 'rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center gap-2';
  const disabledClasses = 'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-current';
  const widthClass = fullWidth ? 'w-full' : '';
  const activeClasses = 'active:scale-95';

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${widthClass} ${activeClasses} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};