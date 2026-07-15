"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PostList from "@/components/post/PostList";

function SearchResults() {
  const params = useSearchParams();
  const q = params.get("q") || "";

  return (
    <div className="mx-auto max-w-feed px-4 py-8">
      <p className="text-sm text-ink-soft">Search results for</p>
      <h1 className="mb-6 font-serif text-3xl font-bold">
        {q ? `“${q}”` : "Explore stories"}
      </h1>
      {q ? (
        <PostList
          query={{ q }}
          emptyMessage={`No stories match “${q}”. Try a different term or tag.`}
        />
      ) : (
        <PostList emptyMessage="No stories yet." />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-ink-soft">Loading…</div>}>
      <SearchResults />
    </Suspense>
  );
}
