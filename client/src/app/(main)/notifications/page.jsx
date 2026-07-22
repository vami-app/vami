"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { apiFetch } from "@/lib/api";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";

export default function NotificationsPage() {
  const { user } = useAuth();
  const { markAsRead, markAllAsRead, refreshNotifications } = useSocket();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/notifications?limit=50");
      if (res.data) {
        setList(res.data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const handleMarkAll = async () => {
    await markAllAsRead();
    setList((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkOne = async (id) => {
    await markAsRead(id);
    setList((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-ink-soft">Please sign in to view your notifications.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink-heading">Notifications</h1>
          <p className="mt-1 text-sm text-ink-soft">Activity on your stories, comments, and profile.</p>
        </div>
        {list.some((n) => !n.read) && (
          <Button variant="ghost" size="sm" onClick={handleMarkAll}>
            Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-base text-ink-soft">You don't have any notifications yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          {list.map((n) => {
            const actor = n.actor || {};
            let text = "interacted with you";
            if (n.type === "clap") text = "clapped for your story";
            if (n.type === "comment") text = "left a response on your story";
            if (n.type === "reply") text = "replied to your comment";
            if (n.type === "follow") text = "started following you";

            return (
              <div
                key={n._id}
                onClick={() => !n.read && handleMarkOne(n._id)}
                className={`flex items-center justify-between gap-4 p-4 text-sm transition-colors ${
                  !n.read ? "bg-accent-50/20" : "hover:bg-gray-50/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar src={actor.avatarUrl} name={actor.name || "User"} size="md" />
                  <div>
                    <p className="text-ink">
                      <Link
                        href={`/@${actor.username || ""}`}
                        className="font-semibold text-ink-heading hover:underline"
                      >
                        {actor.name || actor.username || "Someone"}
                      </Link>{" "}
                      {text}
                    </p>
                    <span className="text-xs text-ink-faint">
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }) : ""}
                    </span>
                  </div>
                </div>

                {!n.read && (
                  <span className="h-2.5 w-2.5 rounded-full bg-accent-600 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
