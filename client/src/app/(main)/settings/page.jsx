"use client";

import { useState, useRef } from "react";
import RequireAuth from "@/components/layout/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import Avatar from "@/components/ui/Avatar";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

function SettingsForm() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [allEmails, setAllEmails] = useState(user.emailPrefs ? user.emailPrefs.allEmails : true);
  const [digestFrequency, setDigestFrequency] = useState(user.emailPrefs ? user.emailPrefs.digestFrequency : "weekly");
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

        <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-ink-soft border-t border-gray-200">
          <p><strong>Username:</strong> @{user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </form>
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
