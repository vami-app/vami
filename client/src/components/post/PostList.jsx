"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import PostCard from "./PostCard";
import { FeedSkeleton } from "@/components/ui/Skeleton";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

/**
 * Cursor-paginated, infinite-scrolling list of posts.
 * @param {{ query?: Record<string,string>, showStatus?: boolean, emptyMessage?: string }} props
 */
export default function PostList({ query = {}, showStatus = false, emptyMessage = "No stories yet." }) {
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Serialize query so the effect re-runs when filters change
  const queryKey = JSON.stringify(query);
  const loadingRef = useRef(false);

  const buildUrl = useCallback(
    (cur) => {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) if (v) params.set(k, v);
      if (cur) params.set("cursor", cur);
      params.set("limit", "10");
      return `/api/posts?${params.toString()}`;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryKey]
  );

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const data = await api.get(buildUrl(cursor));
      setPosts((prev) => [...prev, ...data.posts]);
      setCursor(data.nextCursor);
      setHasMore(Boolean(data.nextCursor));
    } catch (err) {
      setError("Could not load stories.");
      setHasMore(false);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [buildUrl, cursor, hasMore]);

  // Reset + initial load whenever the query changes
  useEffect(() => {
    setPosts([]);
    setCursor(null);
    setHasMore(true);
    setError("");
    setLoading(true);
    loadingRef.current = true;
    (async () => {
      try {
        const data = await api.get(buildUrl(null));
        setPosts(data.posts);
        setCursor(data.nextCursor);
        setHasMore(Boolean(data.nextCursor));
      } catch (err) {
        setError("Could not load stories.");
        setHasMore(false);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  const sentinelRef = useInfiniteScroll(loadMore, { hasMore, loading });

  if (loading && posts.length === 0) return <FeedSkeleton />;

  if (!loading && posts.length === 0) {
    return <p className="py-16 text-center text-ink-soft">{error || emptyMessage}</p>;
  }

  return (
    <div>
      {posts.map((p) => (
        <PostCard key={p.id || p.slug} post={p} showStatus={showStatus} />
      ))}
      {hasMore && (
        <div ref={sentinelRef} className="py-8 text-center text-sm text-ink-faint">
          {loading ? "Loading more…" : ""}
        </div>
      )}
      {error && posts.length > 0 && (
        <p className="py-4 text-center text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
