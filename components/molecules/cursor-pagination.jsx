import { Button } from '@/components/atoms/button';
import { Spinner } from '@/components/atoms/spinner';
import { cn } from '@/lib/utils';

export function CursorPagination({ onNext, onPrev, hasNext, hasPrev, isLoading, className }) {
  return (
    <div className={cn("flex items-center justify-between px-4 py-3 bg-surface border-t border-border-subtle sm:px-6", className)}>
      <div className="flex justify-between flex-1 sm:justify-end space-x-3">
        <Button
          variant="outline"
          onClick={onPrev}
          disabled={!hasPrev || isLoading}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={onNext}
          disabled={!hasNext || isLoading}
        >
          {isLoading && <Spinner size="sm" className="mr-2" />}
          Next
        </Button>
      </div>
    </div>
  );
}
