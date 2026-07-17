"use client";

import { useState, useEffect } from "react";
import { api, ApiError } from "@/lib/api";
import { diffWords, stripHtml } from "@/lib/diff";
import Button from "@/components/ui/Button";

/**
 * Slide-over panel to view revision history, diffs, and restore.
 * @param {{
 *   slug: string;
 *   onClose: () => void;
 *   onRestore: (restoredPost: Object) => void;
 *   currentTitle: string;
 *   currentSubtitle: string;
 *   currentContent: string;
 * }} props
 */
export default function PostRevisions({
  slug,
  onClose,
  onRestore,
  currentTitle,
  currentSubtitle,
  currentContent,
}) {
  const [revisions, setRevisions] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [listError, setListError] = useState("");
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    setLoadingList(true);
    setListError("");
    api
      .get(`/api/posts/${slug}/revisions`)
      .then((res) => {
        setRevisions(res.revisions);
      })
      .catch((err) => {
        setListError(err instanceof ApiError ? err.message : "Failed to load revisions.");
      })
      .finally(() => {
        setLoadingList(false);
      });
  }, [slug]);

  const selectRevision = (revisionId) => {
    setLoadingDetails(true);
    setDetailsError("");
    setSelectedRevision(null);
    api
      .get(`/api/posts/${slug}/revisions/${revisionId}`)
      .then((res) => {
        setSelectedRevision(res.revision);
      })
      .catch((err) => {
        setDetailsError(err instanceof ApiError ? err.message : "Failed to load revision details.");
      })
      .finally(() => {
        setLoadingDetails(false);
      });
  };

  const handleRestore = async (revisionId) => {
    if (!window.confirm("Are you sure you want to restore this revision? It will overwrite the current content in your editor.")) {
      return;
    }
    setRestoring(true);
    setDetailsError("");
    try {
      const res = await api.post(`/api/posts/${slug}/revisions/${revisionId}/restore`);
      onRestore(res.post);
      onClose();
    } catch (err) {
      setDetailsError(err instanceof ApiError ? err.message : "Failed to restore revision.");
    } finally {
      setRestoring(false);
    }
  };

  /**
   * Helper to render diff words into HTML spans.
   */
  const renderDiff = (oldText, newText) => {
    const diffs = diffWords(oldText, newText);
    return diffs.map((part, idx) => {
      if (part.type === "addition") {
        return (
          <ins key={idx} className="bg-green-100 text-green-800 no-underline px-0.5 rounded">
            {part.value}
          </ins>
        );
      }
      if (part.type === "deletion") {
        return (
          <del key={part.value + idx} className="bg-red-100 text-red-800 line-through px-0.5 rounded">
            {part.value}
          </del>
        );
      }
      return <span key={idx}>{part.value}</span>;
    });
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-2xl border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h2 className="font-serif text-lg font-bold text-ink">Revision History</h2>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-md text-ink-soft hover:bg-gray-100 hover:text-ink"
          aria-label="Close panel"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Revision List */}
        <div className="w-1/3 shrink-0 overflow-y-auto border-r border-gray-100 p-4">
          {loadingList ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
            </div>
          ) : listError ? (
            <p className="text-xs text-red-600">{listError}</p>
          ) : revisions.length === 0 ? (
            <p className="text-xs text-ink-soft py-4 text-center">No edits recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {revisions.map((rev) => {
                const isSelected = selectedRevision && selectedRevision._id === rev._id;
                return (
                  <button
                    key={rev._id}
                    onClick={() => selectRevision(rev._id)}
                    className={`w-full rounded-lg p-2.5 text-left transition-colors border ${
                      isSelected
                        ? "border-accent-500 bg-accent-50/50"
                        : "border-transparent hover:bg-gray-50"
                    }`}
                  >
                    <p className="text-xs font-semibold text-ink">
                      {new Date(rev.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-[10px] text-ink-faint">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </p>
                    <p className="mt-1 truncate text-[10px] text-ink-soft">
                      by @{rev.editedBy?.username}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Revision Details / Diff */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
          {loadingDetails ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
            </div>
          ) : detailsError ? (
            <p className="text-sm text-red-600">{detailsError}</p>
          ) : !selectedRevision ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <svg className="h-10 w-10 text-ink-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 8v4l3 3" />
                <circle cx="12" cy="12" r="9" />
              </svg>
              <p className="mt-2 text-sm text-ink-soft">Select an edit revision to compare differences.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header stats & restore */}
              <div className="flex items-start justify-between gap-4 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div>
                  <p className="text-xs font-semibold text-ink-soft">Comparing Revision</p>
                  <p className="text-xs text-ink-faint">{new Date(selectedRevision.createdAt).toLocaleString()}</p>
                </div>
                <Button
                  size="xs"
                  disabled={restoring}
                  onClick={() => handleRestore(selectedRevision._id)}
                >
                  {restoring ? "Restoring…" : "Restore"}
                </Button>
              </div>

              {/* Diffs */}
              <div className="space-y-4">
                {/* Title Diff */}
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint mb-2">Title Diff</p>
                  <h3 className="font-serif text-lg font-bold text-ink whitespace-pre-wrap leading-tight">
                    {renderDiff(selectedRevision.title, currentTitle)}
                  </h3>
                </div>

                {/* Subtitle Diff */}
                {(selectedRevision.subtitle || currentSubtitle) && (
                  <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint mb-2">Subtitle Diff</p>
                    <p className="text-sm text-ink-soft whitespace-pre-wrap">
                      {renderDiff(selectedRevision.subtitle || "", currentSubtitle || "")}
                    </p>
                  </div>
                )}

                {/* Content Diff */}
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint mb-2">Body Plaintext Diff</p>
                  <div className="text-sm text-ink whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                    {renderDiff(stripHtml(selectedRevision.contentHtml), stripHtml(currentContent))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
