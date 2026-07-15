"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { api, ApiError, resolveMedia } from "@/lib/api";
import Button from "@/components/ui/Button";

// Tiptap must be client-only (no SSR)
const StoryEditor = dynamic(() => import("./StoryEditor"), {
  ssr: false,
  loading: () => <div className="min-h-[50vh] animate-pulse rounded bg-gray-50" />,
});

/**
 * @typedef {Object} StoryDraft
 * @property {string} [slug]
 * @property {string} title
 * @property {string} subtitle
 * @property {string} contentHtml
 * @property {string} coverImage
 * @property {string[]} tags
 * @property {string} status
 */

/**
 * Create/edit composer for a story. Handles title, subtitle, cover image,
 * body (Tiptap), tags, and save-draft / publish actions.
 * @param {{ initial?: Partial<StoryDraft>, mode: 'create'|'edit' }} props
 */
export default function StoryComposer({ initial = {}, mode }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title || "");
  const [subtitle, setSubtitle] = useState(initial.subtitle || "");
  const [contentHtml, setContentHtml] = useState(initial.contentHtml || "<p></p>");
  const [coverImage, setCoverImage] = useState(initial.coverImage || "");
  const [tags, setTags] = useState(initial.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [slug, setSlug] = useState(initial.slug || null);
  const [status, setStatus] = useState(initial.status || "draft");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t]);
    }
    setTagInput("");
  };

  /** @param {React.KeyboardEvent} e */
  const onTagKey = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !tagInput && tags.length) {
      setTags(tags.slice(0, -1));
    }
  };

  const uploadCover = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append("image", file);
    try {
      const data = await api.upload("/api/uploads/image", form);
      setCoverImage(data.url);
    } catch (err) {
      setError("Cover upload failed.");
    }
  };

  /**
   * Persist the story. On create, POSTs then switches to edit mode for the
   * new slug so subsequent saves update the same post.
   * @param {'draft'|'published'} nextStatus
   */
  const save = async (nextStatus) => {
    if (!title.trim()) {
      setError("Please add a title before saving.");
      return;
    }
    setBusy(true);
    setError("");
    const payload = { title, subtitle, contentHtml, coverImage, tags, status: nextStatus };
    try {
      if (mode === "create" && !slug) {
        const data = await api.post("/api/posts", payload);
        setSlug(data.post.slug);
        setStatus(data.post.status);
        if (nextStatus === "published") {
          router.push(`/p/${data.post.slug}`);
        } else {
          router.replace(`/edit/${data.post.slug}`);
        }
      } else {
        const data = await api.patch(`/api/posts/${slug}`, payload);
        setStatus(data.post.status);
        if (nextStatus === "published") {
          router.push(`/p/${data.post.slug}`);
        }
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save story.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!slug || !window.confirm("Delete this story permanently?")) return;
    setBusy(true);
    try {
      await api.del(`/api/posts/${slug}`);
      router.push("/");
    } catch (err) {
      setError("Could not delete story.");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-reading px-4 py-8">
      {/* Action bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-ink-soft">
          {status === "published" ? "Published" : "Draft"}
          {mode === "edit" && " · editing"}
        </span>
        <div className="flex items-center gap-2">
          {mode === "edit" && (
            <Button variant="danger" size="sm" onClick={remove} disabled={busy}>
              Delete
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => save("draft")} disabled={busy}>
            Save draft
          </Button>
          <Button size="sm" onClick={() => save("published")} disabled={busy}>
            {busy ? "Saving…" : status === "published" ? "Update" : "Publish"}
          </Button>
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {/* Cover image */}
      <div className="mb-6">
        {coverImage ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resolveMedia(coverImage)} alt="Cover" className="w-full rounded-lg object-cover" />
            <button
              onClick={() => setCoverImage("")}
              className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-sm text-white"
            >
              Remove
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft hover:text-ink">
            <span className="rounded-full border border-gray-300 px-3 py-1.5">+ Add cover image</span>
            <input type="file" accept="image/*" className="hidden" onChange={uploadCover} />
          </label>
        )}
      </div>

      {/* Title */}
      <textarea
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        rows={1}
        className="mb-2 w-full resize-none font-serif text-3xl font-bold leading-tight text-ink placeholder:text-ink-faint focus:outline-none sm:text-4xl"
      />
      {/* Subtitle */}
      <input
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        placeholder="Add a subtitle…"
        className="mb-6 w-full text-lg text-ink-soft placeholder:text-ink-faint focus:outline-none sm:text-xl"
      />

      {/* Body */}
      <StoryEditor value={contentHtml} onChange={setContentHtml} />

      {/* Tags */}
      <div className="mt-10 border-t border-gray-100 pt-6">
        <label className="mb-2 block text-sm font-medium text-ink">Tags (up to 5)</label>
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-300 px-3 py-2">
          {tags.map((t) => (
            <span key={t} className="flex items-center gap-1 rounded-full bg-accent-100 px-3 py-1 text-sm text-accent-700">
              {t}
              <button onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`Remove ${t}`} className="text-accent-500 hover:text-accent-700">
                ×
              </button>
            </span>
          ))}
          {tags.length < 5 && (
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={onTagKey}
              onBlur={addTag}
              placeholder={tags.length ? "Add another…" : "Add a tag and press Enter"}
              className="min-w-[140px] flex-1 py-1 text-sm focus:outline-none"
            />
          )}
        </div>
      </div>
    </div>
  );
}
