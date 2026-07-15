"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatCount } from "@/lib/utils";

const MAX = 50;

/**
 * Multi-clap button. Optimistically increments, batches rapid clicks,
 * and disables past the 50-per-user cap with a visual cue.
 * @param {{ slug: string, initialTotal: number, initialViewer: number }} props
 */
export default function ClapButton({ slug, initialTotal, initialViewer }) {
  const { user } = useAuth();
  const router = useRouter();
  const [total, setTotal] = useState(initialTotal || 0);
  const [viewer, setViewer] = useState(initialViewer || 0);
  const [animate, setAnimate] = useState(false);
  const pending = useRef(0);
  const timer = useRef(/** @type {any} */ (null));

  const capped = viewer >= MAX;

  const flush = async () => {
    const count = pending.current;
    pending.current = 0;
    if (count <= 0) return;
    try {
      const data = await api.post(`/api/posts/${slug}/clap`, { count });
      setTotal(data.totalClaps);
      setViewer(data.viewerClapCount);
    } catch (err) {
      // Roll back optimistic changes on failure
      setTotal((t) => Math.max(0, t - count));
      setViewer((v) => Math.max(0, v - count));
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login");
      }
    }
  };

  const onClap = () => {
    if (!user) {
      router.push(`/login?next=/p/${slug}`);
      return;
    }
    if (viewer >= MAX) return;

    setViewer((v) => Math.min(MAX, v + 1));
    setTotal((t) => t + 1);
    pending.current += 1;
    setAnimate(true);
    setTimeout(() => setAnimate(false), 300);

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 500);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onClap}
        disabled={capped}
        aria-label={capped ? "Clap limit reached" : "Clap for this story"}
        title={capped ? "You've reached the 50-clap limit" : "Clap"}
        className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${
          viewer > 0
            ? "border-accent-600 text-accent-600"
            : "border-gray-300 text-ink-soft hover:border-ink hover:text-ink"
        } ${capped ? "cursor-not-allowed opacity-60" : ""} ${animate ? "animate-clap" : ""}`}
      >
        <ClapIcon filled={viewer > 0} />
      </button>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-medium text-ink">{formatCount(total)}</span>
        {viewer > 0 && (
          <span className="text-xs text-ink-faint">
            {capped ? "max" : `you: ${viewer}`}
          </span>
        )}
      </div>
    </div>
  );
}

/** @param {{ filled: boolean }} props */
function ClapIcon({ filled }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path
        d="M11 11l-1.7-3.4a1.4 1.4 0 012.5-1.2L14 10"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M7 13.2v-1.4a1.4 1.4 0 012.8 0M9.8 12V9.2a1.4 1.4 0 012.8 0V12M12.6 11.4a1.4 1.4 0 012.8 0v2.1c0 3.2-2 5.9-5.4 5.9s-5-2.6-5-5.3v-1.1a1.4 1.4 0 012.8 0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
