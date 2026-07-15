"use client";

import { useState, useEffect } from "react";
import RequireAuth from "@/components/layout/RequireAuth";
import PostCard from "@/components/post/PostCard";
import { FeedSkeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";

function BookmarksList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/users/me/bookmarks")
      .then((d) => setPosts(d.posts))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-feed px-4 py-10">
      <h1 className="mb-6 font-serif text-3xl font-bold">Saved stories</h1>
      {loading ? (
        <FeedSkeleton count={3} />
      ) : posts.length === 0 ? (
        <p className="py-16 text-center text-ink-soft">
          You haven&apos;t saved any stories yet. Tap the bookmark icon on a story to save it.
        </p>
      ) : (
        posts.map((p) => <PostCard key={p.id || p.slug} post={p} />)
      )}
    </div>
  );
}

export default function BookmarksPage() {
  return (
    <RequireAuth>
      <BookmarksList />
    </RequireAuth>
  );
}
