import { cx } from "@/lib/utils";

/**
 * @param {{ className?: string }} props
 */
export function Skeleton({ className = "" }) {
  return <div className={cx("animate-pulse rounded bg-gray-200", className)} />;
}

/** A single feed card skeleton. */
export function PostCardSkeleton({ variant = "grid" }) {
  if (variant === "grid") {
    return (
      <div className="flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div>
          <Skeleton className="mb-3.5 aspect-[16/9] w-full rounded-lg" />
          <div className="mb-2.5 flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="mb-2 h-5 w-5/6" />
          <Skeleton className="mb-2 h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    );
  }

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
export function FeedSkeleton({ count = 6, variant = "grid" }) {
  return (
    <div className={variant === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : ""}>
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} variant={variant} />
      ))}
    </div>
  );
}

