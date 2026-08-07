import { Loader2 } from 'lucide-react';

export default function LoadMore({ onLoadMore, hasNext, isLoading }) {
  if (!hasNext && !isLoading) {
    return (
      <div className="mt-12 text-center text-text-muted text-sm font-light">
        You&apos;ve reached the end of the list.
      </div>
    );
  }

  return (
    <div className="mt-12 flex justify-center">
      <button
        onClick={onLoadMore}
        disabled={isLoading || !hasNext}
        className="inline-flex items-center justify-center rounded-lg bg-surface px-8 py-3 text-xs uppercase tracking-wider font-semibold text-primary shadow-sm ring-1 ring-inset ring-border hover:bg-surface-subtle disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading more...
          </>
        ) : (
          'Load More'
        )}
      </button>
    </div>
  );
}
