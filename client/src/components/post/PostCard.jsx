import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import AiAuthorshipBadge from "@/components/post/AiAuthorshipBadge";
import { resolveMedia } from "@/lib/api";
import { formatDate, formatCount } from "@/lib/utils";

/**
 * @typedef {Object} PostCardData
 * @property {string} slug
 * @property {string} title
 * @property {string} subtitle
 * @property {string} coverImage
 * @property {string[]} tags
 * @property {{name:string, username:string, avatarUrl:string}} author
 * @property {number} totalClaps
 * @property {number} readTimeMinutes
 * @property {string} publishedAt
 * @property {string} createdAt
 * @property {string} status
 * @property {string} [aiAssisted]
 */

/**
 * Feed card for a single story.
 * @param {{ post: PostCardData, showStatus?: boolean }} props
 */
export default function PostCard({ post, showStatus = false }) {
  const author = post.author || {};
  const cover = resolveMedia(post.coverImage);
  const date = post.publishedAt || post.createdAt;

  return (
    <article className="border-b border-gray-100 py-8">
      <div className="mb-3 flex items-center gap-2 text-sm text-ink-soft">
        <Link href={`/@${author.username}`} className="flex items-center gap-2 hover:text-ink">
          <Avatar src={author.avatarUrl} name={author.name} size="xs" />
          <span className="font-medium text-ink">{author.name}</span>
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
            <h2 className="font-serif text-xl font-bold leading-snug text-ink group-hover:text-accent-700 sm:text-2xl">
              {post.title}
            </h2>
            {post.subtitle && (
              <p className="mt-1 line-clamp-2 text-[15px] text-ink-soft sm:text-base">
                {post.subtitle}
              </p>
            )}
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-soft">
            {post.tags && post.tags[0] && (
              <Link
                href={`/tag/${post.tags[0]}`}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs text-ink hover:bg-gray-200"
              >
                {post.tags[0]}
              </Link>
            )}
            <span>{post.readTimeMinutes} min read</span>
            <span className="inline-flex items-center gap-1">
              <ClapMini /> {formatCount(post.totalClaps)}
            </span>
          </div>
        </div>

        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            className="h-24 w-28 shrink-0 rounded object-cover sm:h-28 sm:w-40"
            loading="lazy"
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
