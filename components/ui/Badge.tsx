// FILE PATH: components/ui/Badge.tsx
// Themed badge component with icon support

'use client';
import React, { ReactNode } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export type BadgeVariant = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
export type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  icon,
  children,
  className = '',
}) => {
  const { theme } = useTheme();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
  };

  const variantClasses = {
    primary: theme.classes.badgePrimary,
    accent: theme.classes.badgeAccent,
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    neutral: 'bg-gray-100 text-gray-800',
  };

  const baseClasses = 'inline-flex items-center gap-1 rounded font-medium';

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
};