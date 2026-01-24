// FILE PATH: components/ui/ConfirmDialog.tsx
// Reusable confirmation dialog component

import React from 'react';
import { AlertTriangle, Trash2, Power } from 'lucide-react';
import { Button, ButtonVariant } from './Button';
import { Card } from './Card';

type ConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false
}) => {
  if (!isOpen) return null;

  // Map ConfirmDialog variant to Button variant
  const buttonVariant: ButtonVariant = variant === 'warning' ? 'primary' : variant;

  const icons = {
    danger: <Trash2 className="h-6 w-6 text-red-600" />,
    warning: <AlertTriangle className="h-6 w-6 text-amber-600" />,
    primary: <Power className="h-6 w-6 text-blue-600" />
  };

  const bgColors = {
    danger: 'bg-red-100',
    warning: 'bg-amber-100',
    primary: 'bg-blue-100'
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <div className="text-center">
          <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${bgColors[variant]} mb-4`}>
            {icons[variant]}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-6">{message}</p>
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="secondary"
              fullWidth
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              variant={buttonVariant}
              fullWidth
              loading={loading}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
