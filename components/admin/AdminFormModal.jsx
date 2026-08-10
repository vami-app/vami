'use client';

/**
 * Shared admin create/edit dialog — matches Categories modal chrome.
 */
export default function AdminFormModal({
  open,
  onClose,
  title,
  children,
  wide = false,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-[5.5rem] md:pb-4 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-form-modal-title"
    >
      <div
        className="fixed inset-0 bg-surface/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={[
          'relative bg-surface rounded-lg p-6 sm:p-8 shadow-2xl w-full max-h-[calc(100dvh-7.5rem)] md:max-h-[90vh] overflow-y-auto hide-scrollbar border border-border-subtle z-10 animate-in zoom-in-95 duration-200',
          wide ? 'max-w-2xl' : 'max-w-lg',
        ].join(' ')}
      >
        <h3
          id="admin-form-modal-title"
          className="text-2xl font-headline font-light text-text-primary tracking-tight"
        >
          {title}
        </h3>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
