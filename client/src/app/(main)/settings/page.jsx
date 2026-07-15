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
      const data = await api.patch("/api/users/me", { name, bio });
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

        <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-ink-soft">
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
