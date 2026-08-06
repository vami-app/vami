'use client';

import { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { Text } from '@/components/atoms/text';
import { Spinner } from '@/components/atoms/spinner';

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Item',
  description = 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDanger = true,
  isLoading = false,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      aria-labelledby="confirm-modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => !isLoading && onClose()}
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div className="relative bg-surface rounded-3xl p-6 sm:p-8 shadow-2xl max-w-md w-full border border-border-subtle z-10 animate-in zoom-in-95 duration-200">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-5 right-5 h-10 w-10 rounded-full"
          aria-label="Close modal"
        >
          <Icon icon={X} size="md" />
        </Button>

        <div className="flex flex-col items-start">
          <div className={`p-3.5 rounded-2xl mb-4 inline-flex items-center justify-center ${
            isDanger ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200/50 dark:border-red-900/50' : 'bg-surface-muted text-text-primary border border-border-subtle'
          }`}>
            <Icon icon={isDanger ? AlertTriangle : Trash2} size="lg" />
          </div>

          <Text as="h3" variant="headline" className="text-xl font-semibold tracking-tight" id="confirm-modal-title">
            {title}
          </Text>
          <Text variant="body" className="mt-2 text-sm leading-relaxed">
            {description}
          </Text>

          <div className="mt-8 w-full flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full"
            >
              {cancelText}
            </Button>
            <Button
              variant={isDanger ? "destructive" : "default"}
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full"
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Processing…
                </>
              ) : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
