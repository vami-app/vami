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
  const [expandedEntryId, setExpandedEntryId] = useState(null);

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

  const toggleExpand = (id) => {
    setExpandedEntryId((prev) => (prev === id ? null : id));
  };

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
            const entryId = entry._id || entry.computedAt;
            const isExpanded = expandedEntryId === entryId;
            const payoutAmount = (entry.payoutCents / 100).toFixed(2);
            const poolAmount = (entry.poolCents / 100).toFixed(2);
            const sharePercent =
              entry.platformActiveSeconds > 0
                ? ((entry.eligibleActiveSeconds / entry.platformActiveSeconds) * 100).toFixed(1)
                : "0.0";
            const breakdown = entry.breakdown;

            return (
              <div key={entryId} className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink text-sm">
                      Period: {formatDate(entry.periodStart)} – {formatDate(entry.periodEnd)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-ink-soft">
                        {Math.round(entry.eligibleActiveSeconds / 60)} member-reading mins ({breakdown?.poolSharePercentage || `${sharePercent}%`} of pool)
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleExpand(entryId)}
                        className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 underline underline-offset-2"
                      >
                        {isExpanded ? "Hide calculation" : "How this was calculated"}
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-600 text-base">₹{payoutAmount}</span>
                    <p className="text-[11px] text-ink-faint">of ₹{poolAmount} pool</p>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3.5 text-xs text-ink-soft">
                    <p className="font-semibold text-emerald-900 mb-2">Payout Calculation Breakdown</p>
                    <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                      <div>
                        <span className="text-gray-500">Attributed Read Time:</span>
                        <p className="font-medium text-gray-800">{breakdown?.attributedReadSeconds ?? entry.eligibleActiveSeconds} seconds</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Platform Pool Read Time:</span>
                        <p className="font-medium text-gray-800">{breakdown?.totalPoolReadSeconds ?? entry.platformActiveSeconds} seconds</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Your Pool Share:</span>
                        <p className="font-medium text-gray-800">{breakdown?.poolSharePercentage ?? `${sharePercent}%`}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Subscriber Pool Total:</span>
                        <p className="font-medium text-gray-800">{breakdown?.periodPoolAmountFormatted ?? `₹${poolAmount}`}</p>
                      </div>
                    </div>
                    {breakdown?.formula && (
                      <div className="mt-2.5 border-t border-emerald-200/60 pt-2 font-mono text-[10px] text-emerald-800">
                        Formula: {breakdown.formula}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
