"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import RequireAuth from "@/components/layout/RequireAuth";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <WriterDashboardContent />
    </RequireAuth>
  );
}

function WriterDashboardContent() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [activeTab, setActiveTab] = useState("analytics");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      api.get("/api/writer/analytics").catch((e) => null),
      api.get("/api/writer/payout-ledger").catch((e) => null),
    ]).then(([analyticsRes, ledgerRes]) => {
      if (!active) return;
      if (analyticsRes && analyticsRes.analytics) {
        setAnalytics(analyticsRes.analytics);
      }
      if (ledgerRes && ledgerRes.entries) {
        setLedgerEntries(ledgerRes.entries);
      }
      setLoading(false);
    }).catch((err) => {
      if (active) {
        setError(err.message || "Failed to load dashboard data");
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center text-ink-soft dark:text-gray-400">
        Loading writer dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  const posts = analytics?.posts || [];
  const trend = analytics?.trend || [];
  const followerCount = analytics?.followerCount || 0;

  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalClaps = posts.reduce((sum, p) => sum + (p.totalClaps || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.commentCount || 0), 0);

  // Maximum value for scaling SVG chart
  const maxViewsInTrend = Math.max(...trend.map((t) => t.views || 0), 5);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink dark:text-gray-100">Writer Dashboard</h1>
          <p className="mt-1 text-sm text-ink-soft dark:text-gray-400">
            Performance insights and payout records for {user?.name}
          </p>
        </div>
        <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-900">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
              activeTab === "analytics"
                ? "bg-white text-accent-600 shadow-sm dark:bg-gray-800 dark:text-accent-400"
                : "text-ink-soft hover:text-ink dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Analytics & Audience
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
              activeTab === "ledger"
                ? "bg-white text-accent-600 shadow-sm dark:bg-gray-800 dark:text-accent-400"
                : "text-ink-soft hover:text-ink dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Payout History
          </button>
        </div>
      </div>

      {activeTab === "analytics" && (
        <div className="space-y-8">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Followers" value={followerCount} icon="👥" />
            <StatCard label="Total Views" value={totalViews} icon="👁️" />
            <StatCard label="Total Claps" value={totalClaps} icon="👏" />
            <StatCard label="Comments" value={totalComments} icon="💬" />
          </div>

          {/* 30-day Trend Chart */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-bold text-ink dark:text-gray-100">30-Day Story Views</h2>
            <p className="text-xs text-ink-soft dark:text-gray-400">Daily read event counts across all stories</p>

            <div className="mt-6 h-48 w-full">
              {trend.length > 0 ? (
                <div className="flex h-full items-end gap-1 pt-6">
                  {trend.map((item, idx) => {
                    const heightPercent = Math.round(((item.views || 0) / maxViewsInTrend) * 100);
                    return (
                      <div
                        key={item.date || idx}
                        className="group relative flex flex-1 flex-col items-center h-full justify-end"
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-8 hidden rounded bg-gray-900 px-2 py-1 text-[10px] text-white group-hover:block dark:bg-gray-700 z-10 whitespace-nowrap">
                          {item.date}: {item.views} views
                        </div>
                        <div
                          style={{ height: `${Math.max(heightPercent, 4)}%` }}
                          className={`w-full rounded-t transition-all ${
                            item.views > 0
                              ? "bg-accent-500 hover:bg-accent-600 dark:bg-accent-600 dark:hover:bg-accent-500"
                              : "bg-gray-100 dark:bg-gray-800"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-ink-soft dark:text-gray-400">
                  No view data recorded in the last 30 days.
                </div>
              )}
            </div>
          </div>

          {/* Per-post Analytics Table */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-ink dark:text-gray-100">Story Performance Breakdown</h2>
            </div>
            {posts.length === 0 ? (
              <div className="p-8 text-center text-sm text-ink-soft dark:text-gray-400">
                You have not published any stories yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold uppercase text-ink-soft dark:bg-gray-800/50 dark:text-gray-400">
                    <tr>
                      <th className="px-6 py-3">Title</th>
                      <th className="px-4 py-3">Views</th>
                      <th className="px-4 py-3">Claps</th>
                      <th className="px-4 py-3">Comments</th>
                      <th className="px-4 py-3">Avg Read Time</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {posts.map((post) => (
                      <tr key={post.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                        <td className="px-6 py-4 font-medium text-ink dark:text-gray-200">
                          <Link href={`/p/${post.slug}`} className="hover:underline">
                            {post.title}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-ink-soft dark:text-gray-400">{post.views}</td>
                        <td className="px-4 py-4 text-ink-soft dark:text-gray-400">{post.totalClaps}</td>
                        <td className="px-4 py-4 text-ink-soft dark:text-gray-400">{post.commentCount}</td>
                        <td className="px-4 py-4 text-ink-soft dark:text-gray-400">
                          {post.avgReadTimeSeconds > 0 ? `${post.avgReadTimeSeconds}s` : "—"}
                        </td>
                        <td className="px-4 py-4">
                          {post.isCurrentlyHidden ? (
                            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                              Currently Hidden
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              {post.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "ledger" && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-bold text-ink dark:text-gray-100">Writer Payout History</h2>
            <p className="text-xs text-ink-soft dark:text-gray-400">
              Calculated monthly revenue allocations based on reader engagement duration
            </p>
          </div>
          {ledgerEntries.length === 0 ? (
            <div className="p-8 text-center text-sm text-ink-soft dark:text-gray-400">
              No payout ledger entries available yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold uppercase text-ink-soft dark:bg-gray-800/50 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3">Period</th>
                    <th className="px-4 py-3">Eligible Active Sec</th>
                    <th className="px-4 py-3">Platform Total Sec</th>
                    <th className="px-4 py-3">Pool (Cents)</th>
                    <th className="px-4 py-3">Payout Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {ledgerEntries.map((entry) => (
                    <tr key={entry._id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                      <td className="px-6 py-4 text-ink dark:text-gray-200">
                        {formatDate(entry.periodStart)} – {formatDate(entry.periodEnd)}
                      </td>
                      <td className="px-4 py-4 text-ink-soft dark:text-gray-400">
                        {entry.eligibleActiveSeconds}s
                      </td>
                      <td className="px-4 py-4 text-ink-soft dark:text-gray-400">
                        {entry.platformActiveSeconds}s
                      </td>
                      <td className="px-4 py-4 text-ink-soft dark:text-gray-400">
                        ${(entry.poolCents / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 font-semibold text-emerald-600 dark:text-emerald-400">
                        ${(entry.payoutCents / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-soft dark:text-gray-400">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-ink dark:text-gray-100">{value}</p>
    </div>
  );
}
