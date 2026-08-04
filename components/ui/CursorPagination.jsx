import { Loader2 } from 'lucide-react';

export default function CursorPagination({ onNext, onPrev, hasNext, hasPrev, isLoading }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-surface border-t border-border-subtle sm:px-6">
      <div className="flex justify-between flex-1 sm:justify-end space-x-3">
        <button
          onClick={onPrev}
          disabled={!hasPrev || isLoading}
          className="relative inline-flex items-center rounded-md bg-surface px-3 py-2 text-sm font-semibold text-text-primary ring-1 ring-inset ring-border-subtle hover:bg-surface-subtle focus-visible:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext || isLoading}
          className="relative inline-flex items-center rounded-md bg-surface px-3 py-2 text-sm font-semibold text-text-primary ring-1 ring-inset ring-border-subtle hover:bg-surface-subtle focus-visible:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Next
        </button>
      </div>
    </div>
  );
}
