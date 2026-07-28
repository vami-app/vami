"use client";

import { useState, useRef } from "react";
import RequireAuth from "@/components/layout/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import Avatar from "@/components/ui/Avatar";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import SubscribeModal from "@/components/membership/SubscribeModal";
import WriterLedgerCard from "@/components/membership/WriterLedgerCard";

function SettingsForm() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [allEmails, setAllEmails] = useState(user.emailPrefs ? user.emailPrefs.allEmails : true);
  const [digestFrequency, setDigestFrequency] = useState(user.emailPrefs ? user.emailPrefs.digestFrequency : "weekly");
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const data = await api.patch("/api/users/me", {
        name,
        bio,
        emailPrefs: { allEmails, digestFrequency },
      });
      setUser(data.user);
      setMessage("Profile saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append("avatar", file);
    setError("");
    try {
      const data = await api.upload("/api/users/me/avatar", form);
      setUser(data.user);
      setMessage("Avatar updated.");
    } catch (err) {
      setError("Avatar upload failed.");
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-8 font-serif text-3xl font-bold">Settings</h1>

      {/* Avatar */}
      <div className="mb-8 flex items-center gap-4">
        <Avatar src={user.avatarUrl} name={user.name} size="xl" />
        <div>
          <Button variant="secondary" size="sm" onClick={() => fileRef.current && fileRef.current.click()}>
            Change avatar
          </Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
          <p className="mt-2 text-xs text-ink-faint">JPEG, PNG, WEBP or GIF. Max 5MB.</p>
        </div>
      </div>

      <form onSubmit={saveProfile} className="space-y-5">
        {message && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <div>
          <Input
            as="textarea"
            label="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 200))}
            placeholder="Tell readers a little about yourself"
          />
          <p className="mt-1 text-right text-xs text-ink-faint">{bio.length}/200</p>
        </div>

        {/* Email Preferences */}
        <div className="border-t border-gray-200 pt-6 space-y-4">
          <h2 className="text-lg font-medium text-ink">Email Preferences</h2>
          
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allEmails}
              onChange={(e) => {
                setAllEmails(e.target.checked);
                if (!e.target.checked) {
                  setDigestFrequency("off");
                } else {
                  setDigestFrequency("weekly");
                }
              }}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="text-sm font-medium text-ink">Receive notifications and story updates</span>
              <p className="text-xs text-ink-faint">Get emails when authors you follow publish new stories.</p>
            </div>
          </label>

          <div className={`pl-7 transition-opacity ${allEmails ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
            <label className="block text-sm font-medium text-ink mb-1">Digest Frequency</label>
            <select
              value={digestFrequency}
              disabled={!allEmails}
              onChange={(e) => setDigestFrequency(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
            >
              <option value="weekly">Weekly digest of top stories</option>
              <option value="off">No digest (notifications only)</option>
            </select>
          </div>
          
          <p className="text-xs text-ink-faint italic">
            You'll still receive account security and password reset emails even if other notifications are turned off.
          </p>
        </div>

        {/* Membership & Subscription Status */}
        <div className="border-t border-gray-200 pt-6 space-y-4">
          <h2 className="text-lg font-medium text-ink">Membership & Billing</h2>
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink">Inkwell Membership</span>
                {user.membershipStatus === "active" ? (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    Active (₹499/mo)
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                    Free Reader
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-ink-soft">
                {user.membershipStatus === "active"
                  ? "You have full access to all member-only stories and support Partner Program writers."
                  : "Subscribe to unlock member-only stories and directly support writers."}
              </p>
            </div>

            {user.membershipStatus === "active" ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={async () => {
                  if (confirm("Cancel your test membership subscription?")) {
                    try {
                      await api.post("/api/membership/cancel");
                      const data = await api.get("/api/users/me");
                      setUser(data.user);
                      setMessage("Subscription canceled.");
                    } catch (err) {
                      setError("Failed to cancel subscription.");
                    }
                  }
                }}
              >
                Cancel
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => setShowSubscribeModal(true)}
              >
                Subscribe
              </Button>
            )}
          </div>
        </div>

        {/* Writer Partner Program Ledger */}
        <div className="border-t border-gray-200 pt-6 space-y-4">
          <WriterLedgerCard />
        </div>

        <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-ink-soft border-t border-gray-200">
          <p><strong>Username:</strong> @{user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </form>

      {showSubscribeModal && (
        <SubscribeModal
          onClose={() => setShowSubscribeModal(false)}
          onSuccess={async () => {
            setShowSubscribeModal(false);
            const data = await api.get("/api/users/me");
            setUser(data.user);
          }}
        />
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsForm />
    </RequireAuth>
  );
}
