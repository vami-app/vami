"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";

export default function SovereignExportCard() {
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleExport = async () => {
    setDownloading(true);
    setMessage("");
    setError("");

    try {
      // Trigger browser zip download
      const response = await fetch("/api/users/me/export", {
        method: "GET",
        headers: {
          Accept: "application/zip, application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to prepare export archive.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "inkwell-sovereign-export.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage("Sovereign data & payment-relationships export downloaded successfully.");
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Export failed.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-ink dark:text-white">
              Data & Sovereign Payment Portability
            </h3>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              SOVEREIGN
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-soft dark:text-gray-400">
            Export your complete subscriber directory, post archives, and verifiable payment relationship audit logs (`payment-relationships.json`).
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 text-blue-600 dark:text-blue-400">ℹ️</div>
          <div className="text-xs text-blue-900 dark:text-blue-300">
            <span className="font-semibold">2026 Card Processor Disclosure:</span> Your export contains timestamped proof of subscriber relationships, amounts paid, and Razorpay customer references. Automated recurring auto-charge tokens remain governed by Razorpay security bounds and require subscribers to re-authenticate if migrating to a new card processor.
          </div>
        </div>
      </div>

      {message && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mt-5 flex items-center justify-end">
        <Button
          onClick={handleExport}
          disabled={downloading}
          className="bg-ink text-white hover:bg-gray-800 dark:bg-accent-600 dark:hover:bg-accent-700"
        >
          {downloading ? "Preparing Export Archive…" : "Export Sovereign Data Package (.zip)"}
        </Button>
      </div>
    </div>
  );
}
