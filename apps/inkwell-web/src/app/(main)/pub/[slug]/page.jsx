"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PostCard from "@/components/post/PostCard";
import { useAuth } from "@/context/AuthContext";

export default function PublicationProfilePage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [pubData, setPubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPub() {
      try {
        setLoading(true);
        const res = await fetch(`/api/publications/${slug}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.message || "Failed to load publication");
        }
        setPubData(json.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchPub();
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-ink-soft">
        Loading publication...
      </div>
    );
  }

  if (error || !pubData) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl font-bold text-ink">Publication not found</h1>
        <p className="mt-2 text-ink-soft">{error || "This publication does not exist."}</p>
        <Link href="/" className="mt-6 inline-block text-accent hover:underline">
          Return to home
        </Link>
      </div>
    );
  }

  const { publication, members, posts, viewerRole } = pubData;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Cover Image if present */}
      {publication.coverImage && (
        <div className="mb-8 h-48 w-full overflow-hidden rounded-xl bg-gray-100 sm:h-64">
          <img
            src={publication.coverImage}
            alt={publication.name}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {publication.logoUrl ? (
            <img
              src={publication.logoUrl}
              alt={publication.name}
              className="h-16 w-16 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 font-serif text-2xl font-bold text-accent">
              {publication.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-serif text-3xl font-bold text-ink sm:text-4xl">
              {publication.name}
            </h1>
            {publication.description && (
              <p className="mt-1 max-w-2xl text-ink-soft">{publication.description}</p>
            )}
          </div>
        </div>

        {/* Dashboard link for members */}
        {viewerRole && (
          <Link
            href={`/pub/${publication.slug}/dashboard`}
            className="self-start rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent/90"
          >
            Manage Publication
          </Link>
        )}
      </div>

      {/* Team / Members (Public view - names only) */}
      <div className="py-6 border-b border-gray-100">
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-3">
          Editorial Team & Writers
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          {members.map((m) => (
            <Link
              key={m.id}
              href={`/@${m.user?.username}`}
              className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-ink hover:border-gray-300"
            >
              {m.user?.avatarUrl && (
                <img
                  src={m.user.avatarUrl}
                  alt={m.user.name}
                  className="h-4 w-4 rounded-full object-cover"
                />
              )}
              <span>{m.user?.name || "Member"}</span>
              <span className="text-ink-soft capitalize">({m.role})</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Approved Stories Feed */}
      <div className="py-8">
        <h2 className="font-serif text-2xl font-bold text-ink mb-6">Published Stories</h2>
        {posts.length === 0 ? (
          <div className="py-12 text-center text-ink-soft">
            No approved stories published under this publication yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
