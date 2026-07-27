"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

export default function DisputeQueueCard({ dispute, onDecision }) {
  const [reviewerNote, setReviewerNote] = useState("");
  const [razorpaySettled, setRazorpaySettled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDecision = async (decision) => {
    setError("");
    setLoading(true);
    try {
      await onDecision(dispute._id, decision, reviewerNote, razorpaySettled);
    } catch (err) {
      setError(err.message || "Failed to process decision.");
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    under_review: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
    upheld: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    overturned: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-4 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-accent-100 flex items-center justify-center font-bold text-accent-700 dark:bg-accent-950 dark:text-accent-300">
            {dispute.filedBy?.name ? dispute.filedBy.name[0].toUpperCase() : "W"}
          </div>
          <div>
            <div className="font-bold text-ink dark:text-white">
              {dispute.filedBy?.name || "Writer"} (@{dispute.filedBy?.username || "unknown"})
            </div>
            <div className="text-xs text-ink-faint dark:text-gray-400">
              Filed {dispute.filedAt ? formatDate(dispute.filedAt) : "Recently"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${statusColors[dispute.status] || "bg-gray-100 text-gray-800"}`}>
            {dispute.status.replace("_", " ")}
          </span>
          {dispute.reconciliationFlag && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
              Manual Reconciliation
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/40">
          <div className="text-xs font-bold uppercase tracking-wider text-ink-faint dark:text-gray-400">
            Original Enforcement Detail
          </div>
          <div className="mt-2 text-xs text-ink-soft dark:text-gray-300">
            <span className="font-semibold text-ink dark:text-white">Action:</span> {dispute.actionType}
          </div>
          <div className="mt-1 text-xs text-ink-soft dark:text-gray-300">
            <span className="font-semibold text-ink dark:text-white">Target Model:</span> {dispute.targetModel}
          </div>
          <div className="mt-1 text-xs text-ink-soft dark:text-gray-300">
            <span className="font-semibold text-ink dark:text-white">Reason Given:</span> {dispute.originalReason}
          </div>
          <div className="mt-1 text-[11px] text-ink-faint dark:text-gray-400">
            Hold Expires: {dispute.windowExpiresAt ? formatDate(dispute.windowExpiresAt) : "N/A"}
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-inner dark:border-gray-800 dark:bg-gray-800/20">
          <div className="text-xs font-bold uppercase tracking-wider text-ink-faint dark:text-gray-400">
            Writer Appeal Statement
          </div>
          <p className="mt-2 whitespace-pre-wrap text-xs italic text-ink dark:text-gray-200">
            "{dispute.writerStatement}"
          </p>
        </div>
      </div>

      {dispute.status === "submitted" || dispute.status === "under_review" ? (
        <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
          {error && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-ink-soft dark:text-gray-300">
                Reviewer Note / Decision Justification
              </label>
              <input
                type="text"
                value={reviewerNote}
                onChange={(e) => setReviewerNote(e.target.value)}
                placeholder="Enter justification for the decision..."
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-ink focus:border-accent-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {dispute.actionType === "payout_adjustment" && (
              <label className="flex items-center gap-2 text-xs font-medium text-ink-soft dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={razorpaySettled}
                  onChange={(e) => setRazorpaySettled(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                />
                Razorpay payout already settled externally (flags for manual operator reconciliation)
              </label>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                disabled={loading}
                onClick={() => handleDecision("upheld")}
                className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                Uphold Action
              </Button>
              <Button
                disabled={loading}
                onClick={() => handleDecision("overturned")}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Overturn & Restore
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 border-t border-gray-100 pt-3 text-xs text-ink-faint dark:border-gray-800 dark:text-gray-400">
          Reviewed by <span className="font-semibold text-ink dark:text-gray-200">{dispute.reviewedBy?.name || "Admin"}</span> • Note: "{dispute.reviewerNote || "No note provided"}"
        </div>
      )}
    </div>
  );
}
