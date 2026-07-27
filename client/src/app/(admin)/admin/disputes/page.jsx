"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import DisputeQueueCard from "@/components/moderation/DisputeQueueCard";
import Button from "@/components/ui/Button";

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterStatus, setFilterStatus] = useState("submitted");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDisputes = (currentPage = 1, status = "submitted") => {
    setLoading(true);
    setError("");
    api
      .get(`/api/moderation/disputes/queue?page=${currentPage}&limit=10&status=${status}`)
      .then((res) => {
        setDisputes(res.disputes || []);
        setPage(res.pagination?.page || 1);
        setTotalPages(res.pagination?.pages || 1);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load dispute queue.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDisputes(1, filterStatus);
  }, [filterStatus]);

  const handleDecision = async (disputeId, decision, reviewerNote, razorpaySettled) => {
    setError("");
    setSuccess("");
    try {
      const res = await api.patch(`/api/moderation/disputes/${disputeId}/decision`, {
        decision,
        reviewerNote,
        razorpaySettled,
      });

      setSuccess(`Dispute successfully marked as ${decision}.`);

      if (filterStatus === "submitted" || filterStatus === "under_review") {
        setDisputes((prev) => prev.filter((d) => d._id !== disputeId));
      } else {
        setDisputes((prev) => prev.map((d) => (d._id === disputeId ? res.dispute : d)));
      }
    } catch (err) {
      throw new ApiError(400, err instanceof ApiError ? err.message : "Failed to submit decision.");
    }
  };

  const filterTabs = [
    { label: "Submitted Queue", value: "submitted" },
    { label: "Under Review", value: "under_review" },
    { label: "Upheld Actions", value: "upheld" },
    { label: "Overturned Actions", value: "overturned" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink dark:text-white">
            Appeals & Due Process Queue
          </h1>
          <p className="text-xs text-ink-soft dark:text-gray-400">
            Review writer appeal statements submitted during the 7-day hold window before actions are finalized.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400">
          {success}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {filterTabs.map((tab) => {
          const isActive = filterStatus === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => {
                setFilterStatus(tab.value);
                setPage(1);
              }}
              className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
                isActive
                  ? "border-accent-600 text-accent-700 dark:border-accent-400 dark:text-accent-300"
                  : "border-transparent text-ink-soft hover:text-ink dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Queue List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-ink-soft dark:text-gray-400">
          Loading appeals queue...
        </div>
      ) : disputes.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto mb-3 h-10 w-10 text-ink-faint dark:text-gray-500">🛡️</div>
          <h3 className="text-sm font-bold text-ink dark:text-white">No Disputes in Queue</h3>
          <p className="mt-1 text-xs text-ink-soft dark:text-gray-400">
            There are currently no dispute appeals with status <span className="font-semibold">{filterStatus}</span>.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <DisputeQueueCard
              key={dispute._id}
              dispute={dispute}
              onDecision={handleDecision}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button
            variant="secondary"
            disabled={page <= 1 || loading}
            onClick={() => fetchDisputes(page - 1, filterStatus)}
          >
            Previous
          </Button>
          <span className="text-xs text-ink-soft dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={page >= totalPages || loading}
            onClick={() => fetchDisputes(page + 1, filterStatus)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
