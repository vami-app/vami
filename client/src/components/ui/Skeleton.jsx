import { cx } from "@/lib/utils";

/**
 * @param {{ className?: string }} props
 */
export function Skeleton({ className = "" }) {
  return <div className={cx("animate-pulse rounded bg-gray-200", className)} />;
}

/** A single feed card skeleton. */
export function PostCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 border-b border-gray-100 py-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex-1">
        <div className="mb-3 flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="mb-2 h-6 w-3/4" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="mt-4 flex gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
      <Skeleton className="h-24 w-full rounded sm:h-20 sm:w-28" />
    </div>
  );
}

/** A list of feed skeletons. */
export function FeedSkeleton({ count = 5 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}
