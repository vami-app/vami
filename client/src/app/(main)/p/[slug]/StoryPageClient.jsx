"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, ApiError, resolveMedia } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/ui/Avatar";
import ClapButton from "@/components/post/ClapButton";
import BookmarkButton from "@/components/post/BookmarkButton";
import CommentSection from "@/components/post/CommentSection";
import RelatedPosts from "@/components/post/RelatedPosts";
import AddToListModal from "@/components/post/AddToListModal";
import SubscribeModal from "@/components/membership/SubscribeModal";
import { formatDate, formatCount } from "@/lib/utils";

/**
 * Story page client interactivity wrapper.
 * Personalizes views, bookmarks, claps, and comments.
 * @param {{ initialPost: Object }} props
 */
export default function StoryPageClient({ initialPost }) {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [loadingPersonalized, setLoadingPersonalized] = useState(true);
  const [showListModal, setShowListModal] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  useEffect(() => {
    let active = true;
    // Fetch personalized data (like bookmark status, claps, entitlement)
    api
      .get(`/api/posts/${initialPost.slug}`)
      .then((d) => {
        if (active) {
          setPost(d.post);
          setLoadingPersonalized(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load personalized story state:", err);
        if (active) setLoadingPersonalized(false);
      });

    // Foreground active read time tracking telemetry
    let activeSeconds = 0;
    let isForeground = !document.hidden;

    const interval = setInterval(() => {
      if (isForeground) {
        activeSeconds += 1;
      }
    }, 1000);

    const handleVisibility = () => {
      isForeground = !document.hidden;
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);

      if (activeSeconds > 0 && initialPost.id) {
        try {
          const payload = JSON.stringify({ postId: initialPost.id, activeSeconds });
          if (navigator.sendBeacon) {
            navigator.sendBeacon("/api/telemetry/read-event", new Blob([payload], { type: "application/json" }));
          }
        } catch (e) {
          // ignore beacon errors on unmount
        }
      }
    };
  }, [initialPost.id, initialPost.slug]);

  const author = post.author || {};
  const cover = resolveMedia(post.coverImage);
  const isAuthor = user && author.username === user.username;

  return (
    <article className="py-8 sm:py-12">
      <div className="mx-auto max-w-reading px-4">
        {post.status === "draft" && (
          <p className="mb-4 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            Draft preview — only you can see this
          </p>
        )}

        <h1 className="font-serif text-3xl font-bold leading-tight text-ink sm:text-[42px] sm:leading-[1.15]">
          {post.title}
        </h1>
        {post.subtitle && (
          <p className="mt-3 text-xl text-ink-soft sm:text-2xl">{post.subtitle}</p>
        )}

        {/* Author + meta */}
        <div className="mt-6 flex items-center justify-between border-b border-gray-100 pb-6">
          <div className="flex items-center gap-3">
            <Link href={`/@${author.username}`}>
              <Avatar src={author.avatarUrl} name={author.name} size="lg" />
            </Link>
            <div>
              <Link href={`/@${author.username}`} className="font-medium text-ink hover:underline">
                {author.name}
              </Link>
              <p className="text-sm text-ink-soft">
                {post.readTimeMinutes} min read · {formatDate(post.publishedAt || post.createdAt)}
              </p>
            </div>
          </div>
          {isAuthor && (
            <Link href={`/edit/${post.slug}`} className="text-sm text-accent-600 hover:underline">
              Edit
            </Link>
          )}
        </div>
      </div>

      {cover && (
        <div className="mx-auto my-8 max-w-3xl px-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt="" className="w-full rounded-lg object-cover" />
        </div>
      )}

      {/* Article body */}
      <div
        className="prose-article mx-auto max-w-reading px-4"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />

      {/* Paywall CTA Card for Preview-only Readers */}
      {post.isLocked && post.previewOnly && (
        <div className="mx-auto mt-8 max-w-reading rounded-2xl border border-accent-200 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-white p-6 sm:p-8 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-100 text-accent-600 text-xl font-bold">
            🔒
          </div>
          <h3 className="font-serif text-2xl font-bold text-ink">Member-only story preview</h3>
          <p className="mt-2 text-sm text-ink-soft max-w-md mx-auto">
            The author has made the full text of this story available exclusively to Inkwell subscribers. Subscribe now to unlock full access.
          </p>
          <button
            onClick={() => setShowSubscribeModal(true)}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-accent-600 px-6 py-3 text-sm font-medium text-white shadow-md hover:bg-accent-700 transition"
          >
            Subscribe to Unlock Full Story (₹499/mo)
          </button>
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="mx-auto mt-10 flex max-w-reading flex-wrap gap-2 px-4">
          {post.tags.map((t) => (
            <Link
              key={t}
              href={`/tag/${t}`}
              className="rounded-full bg-gray-100 px-3.5 py-1.5 text-sm text-ink hover:bg-gray-200"
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="sticky bottom-0 z-30 mt-10 border-t border-gray-200 bg-white/95 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-reading items-center justify-between px-4">
          <ClapButton
            slug={post.slug}
            initialTotal={post.totalClaps}
            initialViewer={post.viewerClapCount}
          />
          <div className="flex items-center gap-1">
            <a href="#responses" className="flex h-11 items-center gap-1.5 px-3 text-ink-soft hover:text-ink">
              <CommentIcon />
              <span className="text-sm">Respond</span>
            </a>
            <BookmarkButton slug={post.slug} initial={post.viewerBookmarked} />
            {user && (
              <button
                onClick={() => setShowListModal(true)}
                className="flex h-11 items-center gap-1.5 px-3 text-ink-soft hover:text-ink text-sm font-medium"
                title="Save to reading list"
              >
                + List
              </button>
            )}
            <span className="ml-2 hidden text-sm text-ink-faint sm:inline">
              {formatCount(post.views)} views
            </span>
          </div>
        </div>
      </div>

      <RelatedPosts slug={post.slug} />

      <div className="mt-12">
        <CommentSection slug={post.slug} />
      </div>

      {showListModal && (
        <AddToListModal
          postId={post.id}
          postSlug={post.slug}
          onClose={() => setShowListModal(false)}
        />
      )}
      {showSubscribeModal && (
        <SubscribeModal
          onClose={() => setShowSubscribeModal(false)}
          onSuccess={() => {
            setShowSubscribeModal(false);
            api.get(`/api/posts/${initialPost.slug}`).then((d) => setPost(d.post));
          }}
        />
      )}
    </article>
  );
}

function CommentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M21 12a8 8 0 01-11.5 7.2L4 20l1-4.5A8 8 0 1121 12z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
