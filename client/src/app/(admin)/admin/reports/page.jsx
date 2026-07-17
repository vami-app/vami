"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import Button from "@/components/ui/Button";

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReports = (currentPage = 1, status = "pending") => {
    setLoading(true);
    setError("");
    api
      .get(`/api/admin/reports?page=${currentPage}&limit=10&status=${status}`)
      .then((res) => {
        setReports(res.reports);
        setPage(res.pagination.page);
        setTotalPages(res.pagination.pages);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load reports queue.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReports(1, filterStatus);
  }, [filterStatus]);

  const handleResolve = async (reportId, status) => {
    setError("");
    setSuccess("");
    try {
      const res = await api.patch(`/api/admin/reports/${reportId}`, { status });
      setSuccess(`Report successfully marked as ${status}.`);
      
      // If we are looking at pending reports, we remove the resolved target's reports from the list
      if (filterStatus === "pending") {
        const resolvedReport = reports.find(r => r._id === reportId);
        if (resolvedReport) {
          // Remove all reports on the same target since resolving one actions/dismisses all pending on same target
          setReports((prev) =>
            prev.filter((r) => !(r.targetType === resolvedReport.targetType && String(r.targetId) === String(resolvedReport.targetId)))
          );
        }
      } else {
        // Update status of the resolved report in memory
        setReports((prev) =>
          prev.map((r) => (r._id === reportId ? { ...r, status: res.report.status } : r))
        );
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Failed to resolve report.`);
    }
  };

  const handleUnhide = async (targetType, targetId) => {
    setError("");
    setSuccess("");
    const path = targetType === "post" ? `/api/admin/posts/${targetId}/unhide` : `/api/admin/comments/${targetId}/unhide`;
    try {
      await api.patch(path);
      setSuccess(`${targetType === "post" ? "Story" : "Comment"} has been made visible again.`);
      
      // Refresh the queue list to update visibility representation
      fetchReports(page, filterStatus);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Failed to unhide content.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Moderation Queue</h1>
          <p className="text-sm text-ink-soft">Review user-submitted reports and take action against violating content.</p>
        </div>

        {/* Status Selector */}
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {["pending", "actioned", "dismissed"].map((s) => (
            <button
              key={s}
              onClick={() => {
                setFilterStatus(s);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                filterStatus === s
                  ? "bg-white text-ink shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Reports Listing */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
          <p className="text-sm text-ink-soft">No reports in this queue.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => {
            const isTargetHidden = r.target ? r.target.moderationStatus === "hidden" : true;
            return (
              <div
                key={r._id}
                className={`rounded-xl border bg-white p-5 shadow-sm space-y-4 ${
                  r.priorityFlag && r.status === "pending" ? "border-amber-400 bg-amber-50/20" : "border-gray-200"
                }`}
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {r.priorityFlag && r.status === "pending" && (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 uppercase">
                        High Priority (3+ reports)
                      </span>
                    )}
                    <span className="text-xs text-ink-soft">
                      Reported by <span className="font-semibold text-ink">@{r.reporter?.username}</span>
                    </span>
                    <span className="text-ink-faint text-xs">·</span>
                    <span className="text-xs text-ink-soft">
                      Reason: <span className="font-semibold text-red-600 capitalize">{r.reason}</span>
                    </span>
                  </div>
                  <span className="text-xs text-ink-faint">
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* Details if provided */}
                {r.details && (
                  <div className="rounded-lg bg-gray-50 p-3 text-xs text-ink-soft border border-gray-100">
                    <p className="font-semibold text-ink mb-1">Reporter comments:</p>
                    <p>{r.details}</p>
                  </div>
                )}

                {/* Content snippet */}
                <div className="border-l-4 border-gray-200 pl-4 py-1">
                  {r.targetType === "post" ? (
                    <div>
                      <p className="text-xs font-semibold text-ink-faint uppercase mb-1">Reported Post</p>
                      {r.target ? (
                        <div>
                          <p className="font-bold text-sm text-ink">{r.target.title}</p>
                          <p className="text-xs text-ink-soft">by @{r.target.author?.username}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-red-600 italic">Post hard-deleted or unavailable.</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-ink-faint uppercase mb-1">Reported Comment</p>
                      {r.target ? (
                        <div>
                          <p className="text-sm text-ink whitespace-pre-wrap">"{r.target.content}"</p>
                          <p className="text-xs text-ink-soft mt-1">
                            by @{r.target.author?.username} on story: {r.target.post?.title}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-red-600 italic">Comment hard-deleted or unavailable.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Status indicator on Target */}
                {r.target && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-semibold text-ink-soft">Target Visibility:</span>
                    <span
                      className={`font-semibold ${
                        isTargetHidden ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {isTargetHidden ? "Hidden (Moderated)" : "Visible"}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <div>
                    {r.target && isTargetHidden && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleUnhide(r.targetType, r.targetId)}
                      >
                        Restore Visibility
                      </Button>
                    )}
                  </div>
                  {r.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleResolve(r._id, "dismissed")}
                      >
                        Dismiss Report
                      </Button>
                      <button
                        onClick={() => handleResolve(r._id, "actioned")}
                        className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors shadow-sm"
                      >
                        Action (Hide Content)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-ink-soft">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => fetchReports(page - 1, filterStatus)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => fetchReports(page + 1, filterStatus)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
