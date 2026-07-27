"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { api, ApiError, resolveMedia } from "@/lib/api";
import Button from "@/components/ui/Button";
import PostRevisions from "./PostRevisions";

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
  const [aiAssisted, setAiAssisted] = useState(initial.aiAssisted || "none");
  const [scheduledAt, setScheduledAt] = useState(initial.scheduledAt ? new Date(initial.scheduledAt).toISOString().slice(0, 16) : "");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showRevisions, setShowRevisions] = useState(false);

  // Publication Submission State
  const [myPubs, setMyPubs] = useState([]);
  const [selectedPubSlug, setSelectedPubSlug] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState(initial.submissionStatus || "none");
  const [reviewNote, setReviewNote] = useState(initial.reviewNote || "");
  const [pubName, setPubName] = useState("");
  const [showPubModal, setShowPubModal] = useState(false);
  const [pubSuccessMsg, setPubSuccessMsg] = useState("");

  useEffect(() => {
    // Fetch publications current user belongs to
    api.get("/api/publications/mine")
      .then((res) => setMyPubs(res.publications || []))
      .catch(() => setMyPubs([]));
  }, []);

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
      return null;
    }
    setBusy(true);
    setError("");
    const payload = {
      title,
      subtitle,
      contentHtml,
      coverImage,
      tags,
      status: nextStatus,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      aiAssisted,
    };
    try {
      let currentSlug = slug;
      if (mode === "create" && !slug) {
        const data = await api.post("/api/posts", payload);
        currentSlug = data.post.slug;
        setSlug(data.post.slug);
        setStatus(data.post.status);
        if (nextStatus === "published") {
          router.push(`/p/${data.post.slug}`);
        } else {
          router.replace(`/edit/${data.post.slug}`);
        }
      } else {
        const data = await api.patch(`/api/posts/${slug}`, payload);
        currentSlug = data.post.slug;
        setStatus(data.post.status);
        if (nextStatus === "published") {
          router.push(`/p/${data.post.slug}`);
        }
      }
      return currentSlug;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save story.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const handlePubSubmit = async () => {
    if (!selectedPubSlug) {
      setError("Please select a publication first.");
      return;
    }
    setBusy(true);
    setError("");
    setPubSuccessMsg("");
    try {
      let activeSlug = slug;
      if (!activeSlug) {
        activeSlug = await save("draft");
      }
      if (!activeSlug) return;

      const res = await api.post(`/api/posts/${activeSlug}/submit`, { publicationSlug: selectedPubSlug });
      setSubmissionStatus(res.post.submissionStatus);
      setReviewNote(res.post.reviewNote || "");
      setShowPubModal(false);
      setPubSuccessMsg(`Successfully submitted to publication for review.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit to publication.");
    } finally {
      setBusy(false);
    }
  };

  const handleWithdrawPub = async () => {
    if (!slug || !window.confirm("Withdraw this story from the publication?")) return;
    setBusy(true);
    try {
      const res = await api.del(`/api/posts/${slug}/submit`);
      setSubmissionStatus("none");
      setReviewNote("");
      setPubSuccessMsg("Submission withdrawn.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not withdraw submission.");
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
      {/* Publication Review Alert Banner */}
      {submissionStatus !== "none" && (
        <div className={`mb-6 rounded-lg p-4 border text-sm flex flex-wrap items-center justify-between gap-2 ${
          submissionStatus === "approved" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
          submissionStatus === "pending" ? "bg-amber-50 border-amber-200 text-amber-800" :
          submissionStatus === "changes_requested" ? "bg-orange-50 border-orange-200 text-orange-800" :
          "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          <div>
            <span className="font-bold capitalize">Publication Status: {submissionStatus.replace("_", " ")}</span>
            {reviewNote && <p className="mt-1 text-xs opacity-90"><strong>Review Note:</strong> {reviewNote}</p>}
          </div>
          {submissionStatus === "pending" && (
            <button onClick={handleWithdrawPub} className="text-xs font-semibold underline hover:no-underline">
              Withdraw
            </button>
          )}
        </div>
      )}

      {pubSuccessMsg && <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{pubSuccessMsg}</p>}

      {/* Action bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-ink-soft">
          {status === "published" ? "Published" : "Draft"}
          {mode === "edit" && " · editing"}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {myPubs.length > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setShowPubModal(true)}>
              {submissionStatus === "none" ? "Submit to publication" : "Publication status"}
            </Button>
          )}
          {mode === "edit" && (
            <Button variant="ghost" size="sm" onClick={() => setShowRevisions(true)}>
              Revisions
            </Button>
          )}
          {mode === "edit" && (
            <Button variant="danger" size="sm" onClick={remove} disabled={busy}>
              Delete
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setShowScheduleModal(true)}>
            {scheduledAt ? "Scheduled" : "Schedule"}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => save("draft")} disabled={busy}>
            Save draft
          </Button>
          <Button size="sm" onClick={() => save("published")} disabled={busy}>
            {busy ? "Saving…" : status === "published" ? "Update" : "Publish"}
          </Button>
        </div>
      </div>

      {/* Post Scheduling Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="font-serif text-xl font-bold text-ink mb-2">Schedule Story Publication</h3>
            <p className="text-xs text-ink-soft mb-4">
              Set a future date and time for this story to auto-publish. The post will remain a draft until that time.
            </p>

            <label className="block text-xs font-semibold text-ink mb-1">Scheduled Date & Time</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent mb-4"
            />

            <div className="flex justify-between items-center gap-2">
              {scheduledAt && (
                <button
                  type="button"
                  onClick={() => { setScheduledAt(""); setShowScheduleModal(false); }}
                  className="text-xs text-red-600 hover:underline"
                >
                  Clear Schedule
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="ghost" size="sm" onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => { save("draft"); setShowScheduleModal(false); }}>
                  Save Schedule
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Publication Submit Modal */}
      {showPubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="font-serif text-xl font-bold text-ink mb-2">Submit Story to Publication</h3>
            <p className="text-xs text-ink-soft mb-4">
              Select a publication where you are an editor or writer. Editors will review your submission before it appears on the publication page.
            </p>

            <label className="block text-xs font-semibold text-ink mb-1">Publication</label>
            <select
              value={selectedPubSlug}
              onChange={(e) => setSelectedPubSlug(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent mb-4"
            >
              <option value="">Select a publication...</option>
              {myPubs.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.name} ({p.role})
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowPubModal(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handlePubSubmit} disabled={busy || !selectedPubSlug}>
                {busy ? "Submitting..." : "Submit for Review"}
              </Button>
            </div>
          </div>
        </div>
      )}

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

      {/* AI Authorship Disclosure */}
      <div className="mt-6 border-t border-gray-100 pt-6">
        <label className="mb-1 block text-sm font-medium text-ink">AI Authorship Disclosure</label>
        <p className="mb-2 text-xs text-ink-soft">Disclose if artificial intelligence was used in editing or co-writing this story.</p>
        <select
          value={aiAssisted}
          onChange={(e) => setAiAssisted(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="none">None — Entirely human authored</option>
          <option value="edited">AI-edited — AI assisted with copyediting/structure</option>
          <option value="co-written">AI co-written — AI generated narrative/draft text</option>
        </select>
      </div>

      {showRevisions && slug && (
        <PostRevisions
          slug={slug}
          onClose={() => setShowRevisions(false)}
          onRestore={(restoredPost) => {
            setTitle(restoredPost.title || "");
            setSubtitle(restoredPost.subtitle || "");
            setContentHtml(restoredPost.contentHtml || "<p></p>");
            setCoverImage(restoredPost.coverImage || "");
            setTags(restoredPost.tags || []);
          }}
          currentTitle={title}
          currentSubtitle={subtitle}
          currentContent={contentHtml}
        />
      )}
    </div>
  );
}
