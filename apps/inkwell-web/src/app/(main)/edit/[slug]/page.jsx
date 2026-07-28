"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import RequireAuth from "@/components/layout/RequireAuth";
import StoryComposer from "@/components/editor/StoryComposer";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

/**
 * @param {{ params: Promise<{ slug: string }> }} props
 */
export default function EditStoryPage({ params }) {
  const { slug } = use(params);
  const { user, loading: authLoading } = useAuth();
  const [initial, setInitial] = useState(null);
  const [state, setState] = useState("loading"); // loading | ready | notfound | forbidden

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    api
      .get(`/api/posts/${slug}`)
      .then((d) => {
        if (!active) return;
        const p = d.post;
        if (!user || p.author?.username !== user.username) {
          setState("forbidden");
          return;
        }
        setInitial({
          slug: p.slug,
          title: p.title,
          subtitle: p.subtitle,
          contentHtml: p.contentHtml,
          coverImage: p.coverImage,
          tags: p.tags,
          status: p.status,
        });
        setState("ready");
      })
      .catch((err) => {
        if (!active) return;
        setState(err instanceof ApiError && err.status === 404 ? "notfound" : "notfound");
      });
    return () => {
      active = false;
    };
  }, [slug, user, authLoading]);

  return (
    <RequireAuth>
      {state === "loading" && (
        <div className="mx-auto max-w-reading px-4 py-16 text-ink-soft">Loading story…</div>
      )}
      {state === "notfound" && (
        <div className="mx-auto max-w-reading px-4 py-24 text-center">
          <h1 className="font-serif text-2xl font-bold">Story not found</h1>
          <Link href="/" className="mt-4 inline-block text-accent-600 hover:underline">← Home</Link>
        </div>
      )}
      {state === "forbidden" && (
        <div className="mx-auto max-w-reading px-4 py-24 text-center">
          <h1 className="font-serif text-2xl font-bold">You can only edit your own stories</h1>
          <Link href="/" className="mt-4 inline-block text-accent-600 hover:underline">← Home</Link>
        </div>
      )}
      {state === "ready" && initial && <StoryComposer mode="edit" initial={initial} />}
    </RequireAuth>
  );
}
