// FILE PATH: components/ui/LoadingSpinner.tsx
// Loading spinner and skeleton loader components

'use client';
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text }) => {
  const { theme } = useTheme();
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <svg
        className={`animate-spin ${sizeClasses[size]} ${theme.classes.textPrimary}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  );
};

export const SkeletonLine: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded h-4 ${className}`}></div>
);

export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
    <div className="space-y-3">
      <SkeletonLine className="w-3/4" />
      <SkeletonLine className="w-1/2" />
      <SkeletonLine className="w-5/6" />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="animate-pulse space-y-3">
    <div className="grid grid-cols-4 gap-4 bg-gray-50 p-3 rounded">
      {[...Array(4)].map((_, i) => (
        <SkeletonLine key={i} className="h-3" />
      ))}
    </div>
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="grid grid-cols-4 gap-4 p-3">
        {[...Array(4)].map((_, j) => (
          <SkeletonLine key={j} className="h-3" />
        ))}
      </div>
    ))}
  </div>
);