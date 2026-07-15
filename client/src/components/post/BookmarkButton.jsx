"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

/**
 * Bookmark toggle button.
 * @param {{ slug: string, initial: boolean, withLabel?: boolean }} props
 */
export default function BookmarkButton({ slug, initial, withLabel = false }) {
  const { user } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(Boolean(initial));
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (!user) {
      router.push(`/login?next=/p/${slug}`);
      return;
    }
    setBusy(true);
    const optimistic = !saved;
    setSaved(optimistic);
    try {
      const data = await api.post(`/api/posts/${slug}/bookmark`);
      setSaved(data.bookmarked);
    } catch (err) {
      setSaved(!optimistic);
      if (err instanceof ApiError && err.status === 401) router.push("/login");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={saved ? "Remove bookmark" : "Save story"}
      title={saved ? "Saved" : "Save for later"}
      className={`flex h-11 items-center justify-center gap-2 rounded-full px-3 transition-colors ${
        saved ? "text-accent-600" : "text-ink-soft hover:text-ink"
      }`}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path d="M6 4h12v16l-6-4-6 4V4z" strokeLinejoin="round" />
      </svg>
      {withLabel && <span className="text-sm">{saved ? "Saved" : "Save"}</span>}
    </button>
  );
}
