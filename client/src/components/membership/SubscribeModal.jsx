"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";

/**
 * SubscribeModal — Razorpay Test Mode Membership Subscription Modal
 */
export default function SubscribeModal({ onClose, onSuccess }) {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("init"); // init | success

  const handleSubscribe = async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Initialize subscription session — server generates mock sub ID in test mode
      const res = await api.post("/api/membership/subscribe");
      const { subscriptionId } = res;

      // 2. Simulate Razorpay Checkout HMAC verification (test mode)
      //    In production this would be the real Razorpay SDK callback values.
      //    We generate the HMAC server-side to keep the webhook secret out of the browser.
      const mockPaymentId = `pay_${Math.random().toString(36).slice(2, 10)}`;

      // Ask the server to compute the test HMAC so the secret never touches the browser
      const { signature } = await api.post("/api/membership/test-sign", {
        paymentId: mockPaymentId,
        subscriptionId,
      });

      // 3. Verify — this validates the HMAC AND flips membershipStatus → active
      await api.post("/api/membership/verify", {
        razorpay_payment_id: mockPaymentId,
        razorpay_subscription_id: subscriptionId,
        razorpay_signature: signature,
      });

      // 4. Refresh client user state to pick up the new membershipStatus
      await refreshUser();
      setStep("success");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Subscription error:", err);
      setError(err instanceof ApiError ? err.message : "Subscription failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-gray-100">
        {step === "init" ? (
          <>
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="font-serif text-xl font-bold text-ink">Unlock Inkwell Membership</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg font-semibold">
                ✕
              </button>
            </div>

            <div className="my-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent-100 text-accent-600 font-bold text-xl">
                ✨
              </div>
              <h3 className="text-2xl font-bold text-ink">₹499 <span className="text-sm font-normal text-ink-soft">/ month</span></h3>
              <p className="mt-2 text-sm text-ink-soft">
                Unlimited access to all member-only stories, direct support for your favorite writers, and ad-free publishing.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button onClick={handleSubscribe} disabled={loading} className="w-full justify-center py-3 text-base font-medium">
                {loading ? "Processing Test Checkout..." : "Subscribe Now (Razorpay Test Mode)"}
              </Button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="text-sm text-ink-soft hover:underline py-1"
              >
                Cancel
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-ink-faint">
              🔒 Razorpay Test Mode — Zero actual charges billed.
            </p>
          </>
        ) : (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl">
              ✓
            </div>
            <h3 className="font-serif text-2xl font-bold text-ink">Welcome to Inkwell Membership!</h3>
            <p className="mt-2 text-sm text-ink-soft">
              Your subscription is now active. You have full access to all member-only stories across the platform.
            </p>
            <Button onClick={onClose} className="mt-6 w-full justify-center">
              Start Reading
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
