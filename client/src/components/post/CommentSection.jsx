"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

/**
 * Flat, one-level responses list for a story.
 * @param {{ slug: string }} props
 */
export default function CommentSection({ slug }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/api/posts/${slug}/comments`)
      .then((d) => setComments(d.comments))
      .catch(() => setError("Could not load responses."))
      .finally(() => setLoading(false));
  }, [slug]);

  /** @param {React.FormEvent} e */
  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const data = await api.post(`/api/posts/${slug}/comments`, { content: content.trim() });
      setComments((prev) => [data.comment, ...prev]);
      setContent("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not post response.");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    const prev = comments;
    setComments((c) => c.filter((x) => x.id !== id));
    try {
      await api.del(`/api/comments/${id}`);
    } catch (err) {
      setComments(prev); // rollback
    }
  };

  return (
    <section id="responses" className="mx-auto max-w-reading px-4">
      <h2 className="mb-6 text-lg font-bold text-ink">
        Responses {comments.length > 0 && <span className="text-ink-faint">({comments.length})</span>}
      </h2>

      {user ? (
        <form onSubmit={submit} className="mb-8">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={2000}
            placeholder="What are your thoughts?"
            className="min-h-[90px] w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-[15px] focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-ink-faint">{content.length}/2000</span>
            <Button type="submit" size="sm" disabled={submitting || !content.trim()}>
              {submitting ? "Posting…" : "Respond"}
            </Button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </form>
      ) : (
        <p className="mb-8 rounded-lg bg-gray-50 px-4 py-3 text-sm text-ink-soft">
          <Link href={`/login?next=/p/${slug}`} className="font-medium text-accent-600 hover:underline">
            Sign in
          </Link>{" "}
          to leave a response.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ink-faint">Loading responses…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-ink-soft">No responses yet. Start the conversation.</p>
      ) : (
        <ul className="space-y-6">
          {comments.map((c) => (
            <li key={c.id} className="border-b border-gray-100 pb-6">
              <div className="mb-2 flex items-center justify-between">
                <Link href={`/@${c.author?.username}`} className="flex items-center gap-2">
                  <Avatar src={c.author?.avatarUrl} name={c.author?.name} size="sm" />
                  <div className="leading-tight">
                    <p className="text-sm font-medium text-ink">{c.author?.name}</p>
                    <p className="text-xs text-ink-faint">{formatDate(c.createdAt)}</p>
                  </div>
                </Link>
                {user && c.author && user.username === c.author.username && (
                  <button
                    onClick={() => remove(c.id)}
                    className="text-xs text-ink-faint hover:text-red-600"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="whitespace-pre-wrap text-[15px] text-ink">{c.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
