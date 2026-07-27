"use client";

import { useState } from "react";
import Link from "next/link";
import DisputeModal from "./DisputeModal";
import Button from "@/components/ui/Button";

export default function HeldActionBanner({ action, onDisputeFiled }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!action) return null;

  const expiresDate = action.windowExpiresAt ? new Date(action.windowExpiresAt) : null;
  const formattedDate = expiresDate ? expiresDate.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "7 days";

  return (
    <>
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-amber-900 dark:text-amber-200">
                  Enforcement Action Under Hold Review
                </h4>
                <span className="rounded-full bg-amber-200/60 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                  HELD
                </span>
              </div>
              <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                Reason: <span className="font-medium">{action.originalReason || action.reason || "Policy review"}</span>. Payout balances and account visibility are preserved during the due process window.
              </p>
              <div className="mt-2 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                Appeal window expires: <span className="font-bold">{formattedDate}</span> •{" "}
                <Link href="/legal/appeals" className="underline hover:text-amber-900 dark:hover:text-amber-200">
                  Read Appeals Policy
                </Link>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500"
            >
              File Appeal
            </Button>
          </div>
        </div>
      </div>

      <DisputeModal
        action={action}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onDisputeFiled}
      />
    </>
  );
}
