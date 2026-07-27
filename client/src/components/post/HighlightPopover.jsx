"use client";

import { useState } from "react";

/**
 * Floating popover for adding/editing a note on a highlight or creating a new highlight.
 */
export default function HighlightPopover({
  position,
  initialQuote,
  initialNote = "",
  onSave,
  onDelete,
  onClose,
  isExisting = false,
}) {
  const [note, setNote] = useState(initialNote);
  const [loading, setLoading] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(Boolean(initialNote) || isExisting);

  const handleSave = async () => {
    try {
      setLoading(true);
      await onSave(note);
      onClose();
    } catch (err) {
      alert(err.message || "Failed to save highlight");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    try {
      setLoading(true);
      await onDelete();
      onClose();
    } catch (err) {
      alert(err.message || "Failed to delete highlight");
    } finally {
      setLoading(false);
    }
  };

  if (!position) return null;

  return (
    <div
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      className="absolute z-50 -translate-x-1/2 -translate-y-full pb-2 animate-fadeIn"
    >
      <div className="w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-800 dark:bg-gray-900 text-ink dark:text-gray-100">
        {!showNoteInput ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 min-h-[44px] inline-flex items-center justify-center rounded-lg bg-accent-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-accent-700 transition"
            >
              ✨ Highlight
            </button>
            <button
              onClick={() => setShowNoteInput(true)}
              className="min-h-[44px] inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-ink hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              📝 Add Note
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase text-ink-faint dark:text-gray-400">
              {isExisting ? "Edit Annotation" : "Add Annotation Note"}
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add your note or reflection..."
              maxLength={500}
              className="w-full rounded-lg border border-gray-200 p-2 text-xs outline-none focus:border-accent-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              rows={3}
            />
            <div className="flex items-center justify-between pt-1">
              {isExisting && onDelete ? (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                >
                  Remove
                </button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onClose}
                  className="min-h-[44px] inline-flex items-center rounded-md px-2.5 py-1 text-xs text-ink-soft hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="min-h-[44px] inline-flex items-center rounded-md bg-accent-600 px-3 py-1 text-xs font-semibold text-white hover:bg-accent-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
