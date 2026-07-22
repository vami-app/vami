"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

/**
 * WriterLedgerCard — Component displaying writer payout earnings ledger history
 */
export default function WriterLedgerCard() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get("/api/writer/payout-ledger")
      .then((res) => {
        if (active) {
          setEntries(res.entries || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load payout ledger:", err);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm animate-pulse">
        <div className="h-5 w-40 rounded bg-gray-200" />
        <div className="mt-4 h-16 w-full rounded bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-ink">Partner Program Payout Ledger</h3>
          <p className="text-xs text-ink-soft">Engagement-weighted subscriber pool revenue breakdown</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          Test Mode Active
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="py-8 text-center text-sm text-ink-soft">
          No payout ledger entries calculated yet for current billing window.
        </div>
      ) : (
        <div className="mt-4 divide-y divide-gray-100">
          {entries.map((entry) => {
            const payoutAmount = (entry.payoutCents / 100).toFixed(2);
            const poolAmount = (entry.poolCents / 100).toFixed(2);
            const sharePercent =
              entry.platformActiveSeconds > 0
                ? ((entry.eligibleActiveSeconds / entry.platformActiveSeconds) * 100).toFixed(1)
                : "0.0";

            return (
              <div key={entry._id || entry.computedAt} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-ink text-sm">
                    Period: {formatDate(entry.periodStart)} – {formatDate(entry.periodEnd)}
                  </p>
                  <p className="text-xs text-ink-soft mt-0.5">
                    {Math.round(entry.eligibleActiveSeconds / 60)} member-reading mins ({sharePercent}% of pool)
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-600 text-base">₹{payoutAmount}</span>
                  <p className="text-[11px] text-ink-faint">of ₹{poolAmount} pool</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
