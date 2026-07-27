"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function PublicationDashboardPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Invite member state
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteRole, setInviteRole] = useState("writer");
  const [inviteMsg, setInviteMsg] = useState("");
  const [inviteErr, setInviteErr] = useState("");

  // Review note modal/state
  const [reviewingPostId, setReviewingPostId] = useState(null);
  const [reviewAction, setReviewAction] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewErr, setReviewErr] = useState("");

  // Member drawer state for mobile viewports
  const [showMemberDrawer, setShowMemberDrawer] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/publications/${slug}/dashboard`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load dashboard");
      setDashboardData(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchDashboard();
  }, [slug]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteMsg("");
    setInviteErr("");
    try {
      const res = await fetch(`/api/publications/${slug}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: inviteUsername, role: inviteRole }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to invite member");
      setInviteMsg(`Successfully added @${inviteUsername} as ${inviteRole}.`);
      setInviteUsername("");
      fetchDashboard();
    } catch (err) {
      setInviteErr(err.message);
    }
  };

  const handleRoleChange = async (memberUserId, newRole) => {
    try {
      const res = await fetch(`/api/publications/${slug}/members/${memberUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update role");
      fetchDashboard();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      const res = await fetch(`/api/publications/${slug}/members/${memberUserId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to remove member");
      fetchDashboard();
    } catch (err) {
      alert(err.message);
    }
  };

  const submitReview = async (postId, action) => {
    if (["reject", "request_changes"].includes(action) && !reviewNote.trim()) {
      setReviewErr("A review note is required when rejecting or requesting changes.");
      return;
    }
    setReviewErr("");
    try {
      const res = await fetch(`/api/publications/${slug}/submissions/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reviewNote }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Review action failed");
      setReviewingPostId(null);
      setReviewNote("");
      fetchDashboard();
    } catch (err) {
      setReviewErr(err.message);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-ink-soft">Loading dashboard...</div>;
  }

  if (error || !dashboardData) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl font-bold text-ink">Dashboard Error</h1>
        <p className="mt-2 text-ink-soft">{error}</p>
        <Link href={`/pub/${slug}`} className="mt-4 inline-block text-accent hover:underline">
          Return to publication page
        </Link>
      </div>
    );
  }

  const { publication, members, submissions, myRole } = dashboardData;
  const isOwner = myRole === "owner";
  const canReview = ["owner", "editor"].includes(myRole);

  const MemberSectionContent = () => (
    <div>
      <h2 className="font-serif text-xl font-bold text-ink mb-4">Team & Members ({members.length})</h2>

      {/* Invite Form (Owners and Editors) */}
      {canReview && (
        <form onSubmit={handleInvite} className="mb-6 flex flex-col gap-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="text-xs font-semibold text-ink-soft uppercase tracking-wider">Invite Member</label>
          <input
            type="text"
            placeholder="Username to invite"
            value={inviteUsername}
            onChange={(e) => setInviteUsername(e.target.value)}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            required
          />
          {isOwner && (
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="writer">Writer</option>
              <option value="editor">Editor</option>
            </select>
          )}
          <button
            type="submit"
            className="rounded bg-accent px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent/90 transition min-h-[44px]"
          >
            Invite Member
          </button>
          {inviteMsg && <p className="text-xs text-emerald-600 font-medium mt-1">{inviteMsg}</p>}
          {inviteErr && <p className="text-xs text-red-600 font-medium mt-1">{inviteErr}</p>}
        </form>
      )}

      {/* Members List */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-ink-soft">
            <tr>
              <th className="px-3 py-2">Member</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="px-3 py-2.5 font-medium text-ink flex items-center gap-2">
                  {m.user?.avatarUrl && (
                    <img src={m.user.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                  )}
                  <span className="truncate max-w-[110px]">@{m.user?.username}</span>
                </td>
                <td className="px-3 py-2.5 capitalize text-ink-soft text-xs">
                  {isOwner && m.role !== "owner" ? (
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.userId, e.target.value)}
                      className="rounded border border-gray-300 px-1 py-1 text-xs bg-white"
                    >
                      <option value="writer">Writer</option>
                      <option value="editor">Editor</option>
                      <option value="owner">Owner</option>
                    </select>
                  ) : (
                    <span>{m.role}</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right">
                  {(isOwner || String(user?.id) === String(m.userId)) && (
                    <button
                      onClick={() => handleRemoveMember(m.userId)}
                      className="text-xs text-rose-600 hover:underline min-h-[44px] min-w-[44px] inline-flex items-center justify-end"
                    >
                      {String(user?.id) === String(m.userId) ? "Leave" : "Remove"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between border-b border-gray-200 pb-6 mb-8">
        <div>
          <Link href={`/pub/${publication.slug}`} className="text-xs font-semibold text-accent hover:underline uppercase tracking-wider">
            &larr; Back to publication
          </Link>
          <h1 className="mt-1 font-serif text-3xl font-bold text-ink">
            {publication.name} Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Mobile concealed drawer toggle button */}
          <button
            onClick={() => setShowMemberDrawer(true)}
            className="lg:hidden rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-gray-50 flex items-center gap-1.5 min-h-[44px]"
          >
            Team ({members.length})
          </button>
          <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-ink-soft uppercase tracking-wider">
            Role: {myRole}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
        {/* Main Content: Submissions Review Queue (col-span-2) */}
        <div className="lg:col-span-2">
          {canReview && (
            <div className="mb-12">
              <h2 className="font-serif text-2xl font-bold text-ink mb-4">Pending Submissions Queue</h2>
              {submissions.length === 0 ? (
                <p className="text-sm text-ink-soft">No pending submissions awaiting review.</p>
              ) : (
                <div className="space-y-4">
                  {submissions.map((post) => (
                    <div key={post.id} className="rounded-lg border border-gray-200 p-4 shadow-sm bg-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link href={`/p/${post.slug}`} target="_blank" className="font-semibold text-lg text-ink hover:underline">
                            {post.title}
                          </Link>
                          <p className="text-xs text-ink-soft mt-1">
                            Submitted by <span className="font-medium text-ink">@{post.author?.username}</span> &bull; Status: <span className="capitalize font-medium">{post.submissionStatus}</span>
                          </p>
                          {post.reviewNote && (
                            <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded mt-2">
                              <strong>Note:</strong> {post.reviewNote}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => submitReview(post.id, "approve")}
                            className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition min-h-[44px]"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setReviewingPostId(post.id);
                              setReviewAction("request_changes");
                            }}
                            className="rounded bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition min-h-[44px]"
                          >
                            Changes
                          </button>
                          <button
                            onClick={() => {
                              setReviewingPostId(post.id);
                              setReviewAction("reject");
                            }}
                            className="rounded bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition min-h-[44px]"
                          >
                            Reject
                          </button>
                        </div>
                      </div>

                      {/* Note input popup when rejecting or requesting changes */}
                      {reviewingPostId === post.id && (
                        <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50 p-3 rounded">
                          <p className="text-xs font-semibold text-ink mb-1">
                            Reason / Note for {reviewAction === "reject" ? "Rejection" : "Changes Requested"} (Required):
                          </p>
                          <textarea
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            className="w-full text-xs p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-accent"
                            rows={2}
                            placeholder="Provide feedback for the author..."
                          />
                          {reviewErr && <p className="text-xs text-red-600 mt-1">{reviewErr}</p>}
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              onClick={() => { setReviewingPostId(null); setReviewNote(""); }}
                              className="px-3 py-1 text-xs text-ink-soft hover:underline min-h-[44px]"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => submitReview(post.id, reviewAction)}
                              className="px-3 py-1 bg-accent text-white text-xs rounded font-semibold min-h-[44px]"
                            >
                              Submit Review Note
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop Side Rail: Reveal member management (lg:col-span-1 hidden lg:block) */}
        <div className="hidden lg:block lg:col-span-1 border-l border-gray-200 pl-6">
          <MemberSectionContent />
        </div>
      </div>

      {/* Mobile Concealed Drawer (xs/sm/md viewports) */}
      {showMemberDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 lg:hidden">
          <div className="w-full max-w-sm bg-white p-6 h-full overflow-y-auto shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
                <h3 className="font-serif text-lg font-bold text-ink">Publication Team</h3>
                <button
                  onClick={() => setShowMemberDrawer(false)}
                  className="text-xs text-ink-soft hover:text-ink min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                >
                  &times; Close
                </button>
              </div>
              <MemberSectionContent />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

}
