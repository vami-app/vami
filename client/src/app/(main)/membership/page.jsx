"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import SubscribeModal from "@/components/membership/SubscribeModal";

export default function MembershipPage() {
  const { user } = useAuth();
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  const isMember = user && user.membershipStatus === "active";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      {/* Hero Section */}
      <div className="text-center">
        <span className="inline-block rounded-full bg-accent-100 px-3.5 py-1 text-xs font-semibold text-accent-700 mb-4">
          Inkwell Reader Membership
        </span>
        <h1 className="font-serif text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl">
          One Membership. Access Every Writer.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-soft sm:text-xl">
          No paywall fatigue. No 25 separate Substack subscriptions. One single membership unlocks full access to every story on Inkwell while directly supporting the writers you read.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          {isMember ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-emerald-800">
              <p className="font-semibold text-base">You are an Active Inkwell Member</p>
              <p className="text-xs text-emerald-700 mt-1">Thank you for supporting independent writers across Inkwell.</p>
            </div>
          ) : (
            <Button size="lg" onClick={() => setShowSubscribeModal(true)}>
              {user ? "Upgrade for $4.99/mo" : "Get Started — $4.99/mo"}
            </Button>
          )}
        </div>
      </div>

      {/* Value Pillars */}
      <div className="mt-16 grid gap-8 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="font-serif text-lg font-bold text-ink">Zero Subscription Fatigue</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Never hit individual writer paywalls again. Pay once, read everything across every publication and independent author.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <h3 className="font-serif text-lg font-bold text-ink">Read-Time Payout Pool</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            100% of the member payout pool is distributed directly to writers based on the actual time members spend reading their work.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 15l-2 5l9-11h-5l2-5l-9 11h5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="font-serif text-lg font-bold text-ink">3 Free Reads / Month</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Non-members receive 3 free full story reads every calendar month before requiring a membership.
          </p>
        </div>
      </div>

      {/* Transparent Breakdown Section */}
      <div className="mt-16 rounded-2xl border border-gray-200 bg-gray-50/50 p-8">
        <h2 className="font-serif text-2xl font-bold text-ink">How Your Membership Fee Is Distributed</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Inkwell believes in complete financial transparency. We operate on a formula-fidelity pool split where your active reading directly funds the authors you love.
        </p>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3 text-sm">
            <span className="font-medium text-ink">Monthly Reader Membership</span>
            <span className="font-mono font-bold text-ink">$4.99 / mo</span>
          </div>
          <div className="flex items-center justify-between border-b border-gray-200 pb-3 text-sm">
            <span className="font-medium text-ink">Writer Payout Pool Distribution</span>
            <span className="font-mono text-emerald-700 font-semibold">Proportional to Active Read Time</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-ink">Sovereign Data Export</span>
            <span className="font-semibold text-indigo-700">Full Reader & Payout Export Anytime</span>
          </div>
        </div>
      </div>

      {showSubscribeModal && (
        <SubscribeModal onClose={() => setShowSubscribeModal(false)} />
      )}
    </div>
  );
}
