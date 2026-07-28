"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

/**
 * Custom hook to fetch and manage highlights on a story slug.
 * @param {string} slug
 */
export function useHighlights(slug) {
  const { user } = useAuth();
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHighlights = useCallback(async () => {
    if (!slug || !user) {
      setHighlights([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`/api/posts/${slug}/highlights/mine`);
      setHighlights(res.highlights || []);
      setError(null);
    } catch (err) {
      console.error("Failed to load highlights:", err);
      setError(err.message || "Failed to load highlights");
    } finally {
      setLoading(false);
    }
  }, [slug, user]);

  useEffect(() => {
    fetchHighlights();
  }, [fetchHighlights]);

  const createHighlight = useCallback(
    async ({ quote, contextBefore = "", contextAfter = "", note = "" }) => {
      if (!user) throw new Error("You must be signed in to highlight text");
      const res = await api.post(`/api/posts/${slug}/highlights`, {
        quote,
        contextBefore,
        contextAfter,
        note,
      });
      const newHighlight = res.highlight;
      setHighlights((prev) => [...prev, newHighlight]);
      return newHighlight;
    },
    [slug, user]
  );

  const updateNote = useCallback(async (id, note) => {
    const res = await api.patch(`/api/highlights/${id}`, { note });
    const updated = res.highlight;
    setHighlights((prev) => prev.map((h) => (h.id === id || h._id === id ? updated : h)));
    return updated;
  }, []);

  const deleteHighlight = useCallback(async (id) => {
    await api.delete(`/api/highlights/${id}`);
    setHighlights((prev) => prev.filter((h) => h.id !== id && h._id !== id));
  }, []);

  return {
    highlights,
    loading,
    error,
    createHighlight,
    updateNote,
    deleteHighlight,
    refreshHighlights: fetchHighlights,
  };
}
