"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

export default function AdminStatsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/api/admin/stats")
      .then((res) => {
        setData(res.stats);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load admin stats.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        {error}
      </div>
    );
  }

  const { users, posts, reports, historical30Days } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Dashboard Overview</h1>
        <p className="text-sm text-ink-soft">Real-time metrics and historical activity breakdown.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Total Users</p>
          <p className="mt-2 text-3xl font-bold text-ink">{users.total}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Stories (Pub / Draft)</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-ink">{posts.published}</span>
            <span className="text-sm text-ink-soft">/ {posts.draft} drafts</span>
          </div>
          {posts.hidden > 0 && (
            <p className="mt-1 text-xs font-medium text-amber-600">{posts.hidden} moderated (hidden)</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Reports (Pending)</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-ink">{reports.pending}</span>
            <span className="text-sm text-ink-soft">
              / {reports.actioned + reports.dismissed} resolved
            </span>
          </div>
        </div>
      </div>

      {/* 30-Day Activity Table */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold tracking-tight text-ink mb-4">
          Recent 30-Day Signups and Posts (Raw Timeline)
        </h2>
        {historical30Days.signups.length === 0 && historical30Days.posts.length === 0 ? (
          <p className="text-sm text-ink-soft py-4 text-center">No signups or post creations recorded in the last 30 days.</p>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 pb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  <th className="py-2">Date</th>
                  <th className="py-2">New Signups</th>
                  <th className="py-2">Stories Published</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {/* Aggregate keys and render sorted list */}
                {Object.keys(
                  [...historical30Days.signups, ...historical30Days.posts].reduce((acc, curr) => {
                    acc[curr._id] = true;
                    return acc;
                  }, {})
                )
                  .sort((a, b) => b.localeCompare(a))
                  .slice(0, 10)
                  .map((date) => {
                    const signup = historical30Days.signups.find((s) => s._id === date);
                    const post = historical30Days.posts.find((p) => p._id === date);
                    return (
                      <tr key={date} className="hover:bg-gray-50/50">
                        <td className="py-2.5 font-medium text-ink">{date}</td>
                        <td className="py-2.5 text-ink-soft">{signup ? signup.count : 0}</td>
                        <td className="py-2.5 text-ink-soft">{post ? post.count : 0}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
