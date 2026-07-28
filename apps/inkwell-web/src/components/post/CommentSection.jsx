"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

/**
 * Flat comment items to tree structure builder.
 */
const buildCommentTree = (flatComments) => {
  const map = {};
  const roots = [];

  flatComments.forEach((c) => {
    map[c.id] = { ...c, replies: [] };
  });

  flatComments.forEach((c) => {
    const mapped = map[c.id];
    if (c.parentComment && map[c.parentComment]) {
      map[c.parentComment].replies.push(mapped);
    } else {
      roots.push(mapped);
    }
  });

  return roots;
};

/**
 * Threaded, nested response section for a story.
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
      setComments((prev) => [...prev, data.comment]);
      setContent("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not post response.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentId, text) => {
    const data = await api.post(`/api/posts/${slug}/comments`, {
      content: text,
      parentComment: parentId,
    });
    setComments((prev) => [...prev, data.comment]);
  };

  const remove = async (id) => {
    try {
      const res = await api.del(`/api/comments/${id}`);
      if (res.comment) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  content: res.comment.content,
                  deletedButHasReplies: res.comment.deletedButHasReplies,
                }
              : c
          )
        );
      } else {
        setComments((prev) => prev.filter((x) => x.id !== id));
      }
    } catch (err) {
      setError("Could not delete response.");
    }
  };

  const commentTree = buildCommentTree(comments);
  const totalComments = comments.length;

  return (
    <section id="responses" className="mx-auto max-w-reading px-4">
      <h2 className="mb-6 text-lg font-bold text-ink">
        Responses {totalComments > 0 && <span className="text-ink-faint">({totalComments})</span>}
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
      ) : commentTree.length === 0 ? (
        <p className="text-sm text-ink-soft">No responses yet. Start the conversation.</p>
      ) : (
        <ul className="space-y-6">
          {commentTree.map((c) => (
            <CommentNode
              key={c.id}
              comment={c}
              onReplySubmit={handleReplySubmit}
              onDelete={remove}
              user={user}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Recursive Comment Render Component
 */
function CommentNode({ comment, onReplySubmit, onDelete, user, depth = 0 }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submitReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await onReplySubmit(comment.id, replyContent.trim());
      setReplyContent("");
      setShowReplyForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to post reply.");
    } finally {
      setSubmitting(false);
    }
  };

  const isSoftDeleted = comment.deletedButHasReplies;

  return (
    <li className="space-y-4">
      <div className="flex flex-col gap-2 rounded-lg bg-white border border-gray-100 p-4 shadow-sm">
        {/* Author header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isSoftDeleted && comment.author?.username ? (
              <Link href={`/@${comment.author.username}`} className="flex items-center gap-2">
                <Avatar src={comment.author.avatarUrl} name={comment.author.name} size="sm" />
                <div className="leading-tight">
                  <p className="text-sm font-medium text-ink">{comment.author.name}</p>
                  <p className="text-xs text-ink-faint">{formatDate(comment.createdAt)}</p>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-gray-200" />
                <div className="leading-tight">
                  <p className="text-sm font-medium text-ink-soft italic">Deleted User</p>
                  <p className="text-xs text-ink-faint">{formatDate(comment.createdAt)}</p>
                </div>
              </div>
            )}
          </div>
          {user && !isSoftDeleted && comment.author?.username === user.username && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-xs text-ink-faint hover:text-red-600"
            >
              Delete
            </button>
          )}
        </div>

        {/* Content body */}
        <p className={`whitespace-pre-wrap text-[15px] ${isSoftDeleted ? "text-ink-soft italic" : "text-ink"}`}>
          {comment.content}
        </p>

        {/* Reply CTA */}
        {user && !isSoftDeleted && comment.depth < 5 && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs font-medium text-accent-600 hover:underline"
            >
              {showReplyForm ? "Cancel" : "Reply"}
            </button>
          </div>
        )}
      </div>

      {/* Reply Submission Form */}
      {showReplyForm && (
        <form onSubmit={submitReply} className="ml-4 border-l-2 border-accent-100 pl-4 py-2 space-y-2">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            maxLength={2000}
            placeholder="Write a reply..."
            className="min-h-[70px] w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-ink-faint">{replyContent.length}/2000</span>
            <Button type="submit" size="xs" disabled={submitting || !replyContent.trim()}>
              {submitting ? "Replying…" : "Reply"}
            </Button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>
      )}

      {/* Recursive Replies List */}
      {comment.replies && comment.replies.length > 0 && (
        <ul className="ml-4 border-l border-gray-100 pl-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              onReplySubmit={onReplySubmit}
              onDelete={onDelete}
              user={user}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
