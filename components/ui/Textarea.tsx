// FILE PATH: components/ui/Textarea.tsx
// Themed textarea component

'use client';
import React, { TextareaHTMLAttributes } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  required,
  className = '',
  ...props
}) => {
  const { theme } = useTheme();

  const baseTextareaClasses = 'w-full px-3 py-2 border rounded-lg transition-all duration-200 text-gray-900 placeholder:text-gray-400 resize-vertical';
  const focusClasses = `${theme.classes.focusRing} focus:ring-2 focus:ring-opacity-20 focus:border-current`;
  const errorClasses = error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        className={`${baseTextareaClasses} ${focusClasses} ${errorClasses} ${className}`}
        {...props}
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};
