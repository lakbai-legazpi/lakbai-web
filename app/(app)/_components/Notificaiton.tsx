'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

type NotificationType = 'delete-confirmation' | 'rename-confirmation';
type ToastType = 'success' | 'error';

interface NotificationProps {
  type: NotificationType;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: (value?: string) => void | Promise<void>;
  isLoading?: boolean;
  initialValue?: string;
  title?: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmLoadingLabel?: string;
  inputPlaceholder?: string;
}

interface NotificationConfig {
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  confirmLoadingLabel: string;
  inputPlaceholder?: string;
}

const notificationConfigs: Record<NotificationType, NotificationConfig> = {
  'delete-confirmation': {
    title: 'Delete chat?',
    description: 'This action cannot be undone',
    cancelLabel: 'Cancel',
    confirmLabel: 'Delete',
    confirmLoadingLabel: 'Deleting...'
  },
  'rename-confirmation': {
    title: 'Rename chat',
    description: 'Enter the new name for your chat',
    cancelLabel: 'Cancel',
    confirmLabel: 'Rename',
    confirmLoadingLabel: 'Renaming...',
    inputPlaceholder: 'Chat name'
  }
};

export default function Notification({
  type,
  isOpen,
  onCancel,
  onConfirm,
  isLoading = false,
  initialValue = '',
  title,
  description,
  cancelLabel,
  confirmLabel,
  confirmLoadingLabel,
  inputPlaceholder
}: NotificationProps) {
  const [inputValue, setInputValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const config = notificationConfigs[type];
  const isRenameType = type === 'rename-confirmation';
  const resolvedTitle = title ?? config.title;
  const resolvedDescription = description ?? config.description;
  const resolvedCancelLabel = cancelLabel ?? config.cancelLabel;
  const resolvedConfirmLabel = confirmLabel ?? config.confirmLabel;
  const resolvedConfirmLoadingLabel =
    confirmLoadingLabel ?? config.confirmLoadingLabel;
  const resolvedInputPlaceholder = inputPlaceholder ?? config.inputPlaceholder;

  const handleConfirm = async () => {
    if (isRenameType) {
      await onConfirm(inputValue);
    } else {
      await onConfirm();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 z-50 bg-black/20 backdrop-blur-sm'
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className='fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl'>
        {/* Header */}
        <div className='border-border relative border-b px-6 py-4'>
          <h2 className='text-text-main text-lg font-semibold'>
            {resolvedTitle}
          </h2>
          <p className='text-text-muted mt-1 text-sm'>{resolvedDescription}</p>
          <button
            onClick={onCancel}
            className='hover:bg-surface absolute top-4 right-4 rounded-md p-1 transition-colors'
            disabled={isLoading}
          >
            <X size={20} className='text-text-muted' />
          </button>
        </div>

        {/* Input field if needed */}
        {isRenameType && (
          <div className='border-border border-b px-6 py-4'>
            <input
              type='text'
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder={resolvedInputPlaceholder}
              className='bg-surface border-border placeholder:text-text-muted text-text-main focus:border-primary-500 w-full rounded-lg border px-4 py-2 text-sm outline-none'
              disabled={isLoading}
              autoFocus
            />
          </div>
        )}

        {/* Footer with buttons */}
        <div className='flex gap-3 px-6 py-4'>
          <button
            onClick={onCancel}
            className='border-border text-text-main hover:bg-surface flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'
            disabled={isLoading}
          >
            {resolvedCancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            className='bg-primary-500 hover:bg-primary-600 flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50'
            disabled={isLoading || (isRenameType && !inputValue.trim())}
          >
            {isLoading ? resolvedConfirmLoadingLabel : resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}

// Toast notification component
interface ToastProps {
  isOpen: boolean;
  message: string;
  type?: ToastType;
  onClose?: () => void;
  duration?: number;
}

export function Toast({
  isOpen,
  message,
  type = 'success',
  onClose,
  duration = 3000
}: ToastProps) {
  if (!isOpen) return null;

  return (
    <div className='animate-in fade-in slide-in-from-top-4 fixed top-8 left-1/2 z-[9999] -translate-x-1/2 duration-300'>
      <div
        className={`flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium shadow-lg ${
          type === 'success'
            ? 'border border-green-200 bg-green-50 text-green-900'
            : 'border border-red-200 bg-red-50 text-red-900'
        }`}
      >
        {type === 'success' ? (
          <CheckCircle2 className='h-4 w-4 text-green-600' />
        ) : (
          <AlertCircle className='h-4 w-4 text-red-600' />
        )}
        {message}
      </div>
    </div>
  );
}

// Export for backward compatibility
export const DeleteConfirmationDialog = Notification;
