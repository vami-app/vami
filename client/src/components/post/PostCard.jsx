"use client";

import { useState } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import AiAuthorshipBadge from "@/components/post/AiAuthorshipBadge";
import { resolveMedia } from "@/lib/api";
import { formatDate, formatCount } from "@/lib/utils";

/**
 * @typedef {Object} PostCardData
 * @property {string} [id]
 * @property {string} slug
 * @property {string} title
 * @property {string} [subtitle]
 * @property {string} [coverImage]
 * @property {string[]} [tags]
 * @property {{name?:string, username?:string, avatarUrl?:string}} [author]
 * @property {number} [totalClaps]
 * @property {number} [readTimeMinutes]
 * @property {string} [publishedAt]
 * @property {string} [createdAt]
 * @property {string} [status]
 * @property {string} [aiAssisted]
 * @property {boolean} [isLocked]
 */

/**
 * FAANG-grade feed card for a single story with 8-edge-case resilience.
 * @param {{ post: PostCardData, showStatus?: boolean, variant?: "grid" | "list" }} props
 */
export default function PostCard({ post = {}, showStatus = false, variant = "grid" }) {
  const [imgError, setImgError] = useState(false);

  const author = post.author || {};
  const authorName = author.name || author.username || "Anonymous";
  const authorHref = author.username ? `/@${author.username}` : "#";
  const cover = resolveMedia(post.coverImage);
  const date = post.publishedAt || post.createdAt;
  const readTime = post.readTimeMinutes ?? 1;
  const claps = post.totalClaps ?? 0;
  const tag = post.tags && post.tags[0] ? post.tags[0] : null;
  const hasCover = Boolean(cover && !imgError);

  if (variant === "grid") {
    return (
      <article className={`group flex h-full flex-col justify-between overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-md ${!hasCover ? "bg-gradient-to-b from-gray-50/50 via-white to-white" : ""}`}>
        <div className="flex flex-1 flex-col">
          {/* Top cover image (conditional) */}
          {hasCover ? (
            <Link href={`/p/${post.slug}`} className="mb-3.5 block overflow-hidden rounded-lg">
              <div className="relative aspect-[16/9] w-full bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cover}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={() => setImgError(true)}
                />
              </div>
            </Link>
          ) : (
            /* Accent top line indicator when cover image is absent or broken */
            <div className="-mx-4 -mt-4 mb-3.5 h-1.5 bg-gradient-to-r from-accent-500 via-indigo-500 to-purple-500" />
          )}

          {/* Author header row */}
          <div className="mb-2.5 flex items-center gap-2 text-xs text-ink-soft">
            <Link href={authorHref} className="flex items-center gap-1.5 hover:text-ink min-w-0">
              <Avatar src={author.avatarUrl} name={authorName} size="xs" />
              {/* Edge Case 4: Long author name truncation */}
              <span className="truncate font-medium text-ink max-w-[120px]">{authorName}</span>
            </Link>
            <span aria-hidden="true" className="shrink-0">·</span>
            <span className="shrink-0">{formatDate(date)}</span>
            <AiAuthorshipBadge aiAssisted={post.aiAssisted} size="sm" />
            {showStatus && post.status === "draft" && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 shrink-0">
                Draft
              </span>
            )}
            {post.isLocked && (
              <span className="text-xs shrink-0" title="Member-only story">🔒</span>
            )}
          </div>

          {/* Title & Subtitle */}
          <Link href={`/p/${post.slug}`} className="block flex-1">
            <h2 className={`font-serif font-bold leading-snug text-ink transition-colors group-hover:text-accent-700 break-words ${hasCover ? "text-base sm:text-lg line-clamp-2" : "text-lg sm:text-xl line-clamp-3"}`}>
              {post.title}
            </h2>
            {post.subtitle && (
              <p className={`mt-2 text-xs leading-relaxed text-ink-soft break-words ${hasCover ? "line-clamp-2" : "line-clamp-6"}`}>
                {post.subtitle}
              </p>
            )}
          </Link>
        </div>

        {/* Footer meta row */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-ink-soft">
          {tag ? (
            <Link
              href={`/tag/${tag}`}
              className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-ink transition-colors hover:bg-gray-200 truncate max-w-[110px]"
            >
              {tag}
            </Link>
          ) : <span />}
          <div className="flex items-center gap-3 shrink-0">
            <span>{readTime} min read</span>
            <span className="inline-flex items-center gap-1 font-medium text-ink">
              <ClapMini /> {formatCount(claps)}
            </span>
          </div>
        </div>
      </article>
    );
  }


  // Standard horizontal list variant
  return (
    <article className="border-b border-gray-100 py-6">
      <div className="mb-3 flex items-center gap-2 text-sm text-ink-soft">
        <Link href={authorHref} className="flex items-center gap-2 hover:text-ink">
          <Avatar src={author.avatarUrl} name={authorName} size="xs" />
          <span className="font-medium text-ink">{authorName}</span>
        </Link>
        <span aria-hidden="true">·</span>
        <span>{formatDate(date)}</span>
        <AiAuthorshipBadge aiAssisted={post.aiAssisted} size="sm" />
        {showStatus && post.status === "draft" && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            Draft
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Link href={`/p/${post.slug}`} className="group block">
            <h2 className="font-serif text-xl font-bold leading-snug text-ink group-hover:text-accent-700 sm:text-2xl break-words">
              {post.title}
            </h2>
            {post.subtitle && (
              <p className="mt-1 line-clamp-2 text-sm text-ink-soft sm:text-base break-words">
                {post.subtitle}
              </p>
            )}
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-soft">
            {tag && (
              <Link
                href={`/tag/${tag}`}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs text-ink hover:bg-gray-200"
              >
                {tag}
              </Link>
            )}
            <span>{readTime} min read</span>
            <span className="inline-flex items-center gap-1">
              <ClapMini /> {formatCount(claps)}
            </span>
          </div>
        </div>

        {hasCover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            className="h-24 w-28 shrink-0 rounded object-cover sm:h-28 sm:w-40"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}
      </div>
    </article>
  );
}

function ClapMini() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M11 11l-1.5-3a1.3 1.3 0 012.3-1.1L14 11" />
      <path d="M7 13v-1a1.3 1.3 0 012.6 0M9.6 12V9.5a1.3 1.3 0 012.6 0V12M12.2 11.5a1.3 1.3 0 012.6 0V13c0 3-1.8 5.5-5 5.5S7 16.5 7 14v-1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

