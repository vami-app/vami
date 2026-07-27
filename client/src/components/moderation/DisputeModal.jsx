"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import Button from "@/components/ui/Button";

export default function DisputeModal({ action, isOpen, onClose, onSuccess }) {
  const [statement, setStatement] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !action) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!statement.trim()) {
      setError("Please provide an appeal statement.");
      return;
    }

    if (statement.length > 2000) {
      setError("Statement must be under 2000 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/moderation/disputes", {
        actionType: action.actionType || "content_removal",
        targetRef: action.targetRef || action._id,
        targetModel: action.targetModel || "Post",
        originalReason: action.originalReason || action.reason || "Enforcement action hold",
        writerStatement: statement.trim(),
        windowExpiresAt: action.windowExpiresAt,
      });

      setStatement("");
      if (onSuccess) onSuccess(res.dispute);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit dispute appeal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-bold text-ink dark:text-white">File Moderation Appeal</h3>
            <p className="text-xs text-ink-soft dark:text-gray-400">
              Submit your statement for human review within the 7-day due process window.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-ink-faint hover:bg-gray-100 hover:text-ink dark:hover:bg-gray-800 dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
            <div className="text-xs font-semibold text-ink-soft dark:text-gray-400">Action Type</div>
            <div className="text-sm font-medium text-ink dark:text-white capitalize">
              {(action.actionType || "content_removal").replace("_", " ")}
            </div>
            <div className="mt-1 text-xs text-ink-faint dark:text-gray-400">
              Reason: <span className="text-ink dark:text-gray-200">{action.originalReason || action.reason || "Under review"}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-soft dark:text-gray-300">
              Your Appeal Statement ({statement.length}/2000)
            </label>
            <textarea
              rows={5}
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="Explain why this action should be reconsidered..."
              maxLength={2000}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Submit Appeal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
