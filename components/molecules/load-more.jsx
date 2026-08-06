import { Button } from '@/components/atoms/button';
import { Spinner } from '@/components/atoms/spinner';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/utils';

export function LoadMore({ onLoadMore, hasNext, isLoading, className }) {
  if (!hasNext && !isLoading) {
    return (
      <div className={cn("mt-12 text-center", className)}>
        <Text variant="caption">You&apos;ve reached the end of the list.</Text>
      </div>
    );
  }

  return (
    <div className={cn("mt-12 flex justify-center", className)}>
      <Button
        variant="outline"
        onClick={onLoadMore}
        disabled={isLoading || !hasNext}
        className="px-8 py-3"
      >
        {isLoading ? (
          <>
            <Spinner size="sm" className="mr-2" />
            Loading more...
          </>
        ) : (
          'Load More'
        )}
      </Button>
    </div>
  );
}
