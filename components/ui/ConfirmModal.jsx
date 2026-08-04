'use client';

import { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmModal({
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
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-5 right-5 p-2 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-start">
          <div className={`p-3.5 rounded-2xl mb-4 inline-flex items-center justify-center ${
            isDanger ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200/50 dark:border-red-900/50' : 'bg-surface-muted text-text-primary border border-border-subtle'
          }`}>
            {isDanger ? <AlertTriangle className="h-6 w-6" /> : <Trash2 className="h-6 w-6" />}
          </div>

          <h3 className="text-xl font-headline font-semibold text-text-primary tracking-tight" id="confirm-modal-title">
            {title}
          </h3>
          <p className="mt-2 text-sm text-text-muted leading-relaxed">
            {description}
          </p>

          <div className="mt-8 w-full flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex justify-center items-center rounded-full border border-border-base px-6 py-2.5 bg-surface text-sm font-medium text-text-secondary hover:bg-surface-muted transition-colors focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`w-full sm:w-auto inline-flex justify-center items-center rounded-full px-6 py-2.5 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                isDanger
                  ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-600'
                  : 'bg-text-primary hover:opacity-90 text-text-inverse focus:ring-black'
              }`}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing…
                </span>
              ) : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
