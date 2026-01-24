// FILE PATH: components/ui/Select.tsx
// Themed select component

'use client';
import React, { SelectHTMLAttributes, ReactNode } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  required?: boolean;
  children: ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  required,
  className = '',
  children,
  ...props
}) => {
  const { theme } = useTheme();

  const baseSelectClasses = 'w-full px-3 py-2 border rounded-lg transition-all duration-200 text-gray-900 bg-white';
  const focusClasses = `${theme.classes.focusRing} focus:ring-2 focus:ring-opacity-20 focus:border-current`;
  const errorClasses = error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300';
  const iconPaddingLeft = leftIcon ? 'pl-10' : '';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
            {leftIcon}
          </div>
        )}
        
        <select
          className={`${baseSelectClasses} ${focusClasses} ${errorClasses} ${iconPaddingLeft} ${className}`}
          {...props}
        >
          {children}
        </select>
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};
