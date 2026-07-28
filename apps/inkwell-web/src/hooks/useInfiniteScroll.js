"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Invoke `onLoadMore` when the sentinel element scrolls into view.
 * @param {() => void} onLoadMore
 * @param {{ hasMore: boolean, loading: boolean }} state
 * @returns {(node: Element|null) => void} ref callback for the sentinel
 */
export function useInfiniteScroll(onLoadMore, { hasMore, loading }) {
  const observer = useRef(/** @type {IntersectionObserver|null} */ (null));

  const sentinelRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          onLoadMore();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, onLoadMore]
  );

  useEffect(() => () => observer.current && observer.current.disconnect(), []);

  return sentinelRef;
}
