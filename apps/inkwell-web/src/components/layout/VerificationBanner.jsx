"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";

export default function VerificationBanner() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!user || user.emailVerified) return null;

  const handleResend = async () => {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await api.post("/api/auth/resend-verification");
      setMessage("Verification email sent! Please check your inbox.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to resend verification email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-indigo-50 border-b border-indigo-150 text-indigo-900 py-3 px-4">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-sm font-medium">
          Please verify your email address (<strong>{user.email}</strong>). 
          You won't be able to publish stories until your email is verified.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          {message ? (
            <span className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded border border-green-200">{message}</span>
          ) : error ? (
            <span className="text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded border border-red-200">{error}</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={loading}
              className="text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1.5 rounded disabled:opacity-50 transition"
            >
              {loading ? "Resending..." : "Resend Verification"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
