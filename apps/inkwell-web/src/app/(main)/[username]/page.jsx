"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/ui/Avatar";
import FollowButton from "@/components/profile/FollowButton";
import PostList from "@/components/post/PostList";
import { formatCount } from "@/lib/utils";

/**
 * Public author profile. Matches /@ada — the dynamic segment captures the
 * whole "@ada" string; we strip the leading "@" to get the username.
 * @param {{ params: Promise<{ username: string }> }} props
 */
export default function ProfilePage({ params }) {
  const raw = use(params).username;
  const username = decodeURIComponent(raw).replace(/^@/, "").toLowerCase();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState(null);
  const [state, setState] = useState("loading");

  useEffect(() => {
    let active = true;
    api
      .get(`/api/users/${username}`)
      .then((d) => {
        if (!active) return;
        setProfile(d.user);
        setState("ready");
      })
      .catch(() => active && setState("notfound"));
    return () => {
      active = false;
    };
  }, [username]);

  if (state === "loading") {
    return <div className="mx-auto max-w-feed px-4 py-16 text-ink-soft">Loading profile…</div>;
  }
  if (state === "notfound" || !profile) {
    return (
      <div className="mx-auto max-w-feed px-4 py-24 text-center">
        <h1 className="font-serif text-2xl font-bold">User not found</h1>
        <Link href="/" className="mt-4 inline-block text-accent-600 hover:underline">← Home</Link>
      </div>
    );
  }

  const isSelf = me && me.username === profile.username;

  return (
    <div className="mx-auto max-w-feed px-4 py-10">
      <header className="flex flex-col items-start gap-5 border-b border-gray-100 pb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar src={profile.avatarUrl} name={profile.name} size="xl" />
          <div>
            <h1 className="flex items-center gap-1.5 font-serif text-2xl font-bold text-ink sm:text-3xl">
              {profile.name}
              {profile.emailVerified && (
                <span className="inline-flex items-center text-indigo-600" title="Verified Author">
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12c0 1.357-.6 2.573-1.549 3.397a4.49 4.49 0 01-1.307 3.498 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75c-1.357 0-2.573-.6-3.397-1.549a4.49 4.49 0 01-3.498-1.307 4.491 4.491 0 01-1.307-3.497A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.498 4.49 4.49 0 013.497-1.307zm7.147 6.452a.75.75 0 00-1.06-1.06l-4.25 4.25-2.25-2.25a.75.75 0 00-1.06 1.06l2.78 2.78a.75.75 0 001.06 0l4.78-4.78z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </h1>
            <p className="text-ink-soft">@{profile.username}</p>
            <p className="mt-1 text-sm text-ink-soft">
              {formatCount(profile.followersCount)} followers · {formatCount(profile.postCount)} stories
            </p>
          </div>
        </div>
        {isSelf ? (
          <Link href="/settings">
            <span className="inline-block rounded-full border border-ink px-4 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-white">
              Edit profile
            </span>
          </Link>
        ) : (
          <FollowButton
            username={profile.username}
            initialFollowing={profile.isFollowing}
            initialCount={profile.followersCount}
          />
        )}
      </header>

      {profile.bio && <p className="mt-6 max-w-2xl text-ink">{profile.bio}</p>}

      <div className="mt-8">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-soft">
          {isSelf ? "Your stories" : "Published stories"}
        </h2>
        <PostList
          query={isSelf ? { author: profile.username, status: "all" } : { author: profile.username }}
          showStatus={isSelf}
          emptyMessage={isSelf ? "You haven't written anything yet." : "No published stories yet."}
        />
      </div>
    </div>
  );
}
