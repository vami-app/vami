"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function PublicAppealsPolicyPage() {
  const [policy, setPolicy] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/policy/moderation-appeals")
      .then((res) => {
        setPolicy(res.policy || "");
      })
      .catch(() => {
        setPolicy("");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-xs font-semibold text-accent-600 hover:underline dark:text-accent-400">
          ← Return to Inkwell
        </Link>
        <span className="rounded-full bg-accent-100 px-3 py-1 text-[11px] font-bold text-accent-700 dark:bg-accent-950 dark:text-accent-300">
          Official Policy Document
        </span>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {loading ? (
          <div className="py-12 text-center text-xs text-ink-soft dark:text-gray-400">
            Loading policy document...
          </div>
        ) : (
          <article className="prose prose-slate dark:prose-invert max-w-none">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink dark:text-white">
              Inkwell Moderation & Appeals Policy (v1.0)
            </h1>
            <p className="text-xs text-ink-soft dark:text-gray-400">
              Effective Date: July 27, 2026 • Applies to all authors, writers, and Partner Program participants.
            </p>

            <hr className="my-6 border-gray-100 dark:border-gray-800" />

            <h2 className="text-lg font-bold text-ink dark:text-white">1. Overview & Due Process Rights</h2>
            <p className="text-sm text-ink-soft dark:text-gray-300">
              Inkwell believes that content creators deserve clear explanations, fair human review, and full due process before any enforcement action reaches a permanent state. No account restriction, content removal, or payout adjustment becomes irreversible without a window in which the affected writer can submit an appeal statement.
            </p>

            <h2 className="text-lg font-bold text-ink dark:text-white">2. Appealable Actions & The 7-Day Hold Window</h2>
            <p className="text-sm text-ink-soft dark:text-gray-300">
              The following enforcement actions enter a mandatory <strong>7-day hold window</strong> prior to finalization:
            </p>
            <ul className="list-disc pl-5 text-sm text-ink-soft dark:text-gray-300 space-y-1">
              <li><strong>Account Restrictions:</strong> Account status holds or temporary deactivations.</li>
              <li><strong>Payout Adjustments:</strong> Engagement holds or partner program revenue reviews.</li>
              <li><strong>Content Removals:</strong> Hiding or removing published stories or comments.</li>
            </ul>

            <div className="my-4 rounded-xl bg-amber-50 p-4 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40">
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                Holding Guarantee: Payout ledger balances remain intact under review and are <strong>never debited or withheld</strong> from writer views during the 7-day hold window until a final review decision is rendered or the window expires without an appeal.
              </p>
            </div>

            <h2 className="text-lg font-bold text-ink dark:text-white">3. Submitting an Appeal</h2>
            <p className="text-sm text-ink-soft dark:text-gray-300">
              Writers receive an instant enforcement notice containing the specific reason and an appeal button opening the dispute submission modal. Statements must be clear, respectful, and under 2,000 characters.
            </p>

            <h2 className="text-lg font-bold text-ink dark:text-white">4. Decision Outcomes & Single Review Cycle</h2>
            <p className="text-sm text-ink-soft dark:text-gray-300">
              A human reviewer evaluates each submitted dispute. Outcome options:
            </p>
            <ul className="list-disc pl-5 text-sm text-ink-soft dark:text-gray-300 space-y-1">
              <li><strong>Upheld:</strong> The original enforcement action is confirmed and finalized permanently.</li>
              <li><strong>Overturned:</strong> The enforcement action is reversed, restoring full account/content visibility or reversing payout holds.</li>
            </ul>

            <p className="mt-4 text-xs text-ink-faint dark:text-gray-400">
              Each enforcement action is eligible for one review cycle. Review decisions rendered by platform moderators are final.
            </p>
          </article>
        )}
      </div>
    </div>
  );
}
