"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import PostCard from "@/components/post/PostCard";
import { useAuth } from "@/context/AuthContext";

export default function SingleReadingListPage() {
  const { slug } = useParams();
  const searchParams = useSearchParams();
  const username = searchParams.get("username");
  const { user } = useAuth();

  const [listData, setListData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchList = async () => {
    try {
      setLoading(true);
      const queryUsername = username || (user ? user.username : "");
      const res = await fetch(`/api/lists/${queryUsername}/${slug}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load list");
      setListData(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchList();
  }, [slug, username, user]);

  const handleRemovePost = async (postId) => {
    if (!listData) return;
    try {
      const res = await fetch(`/api/lists/${listData.list.id}/posts/${postId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to remove post");
      fetchList();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-ink-soft">Loading reading list...</div>;
  }

  if (error || !listData) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl font-bold text-ink">List Not Found</h1>
        <p className="mt-2 text-ink-soft">{error || "This reading list does not exist or is private."}</p>
        <Link href="/lists" className="mt-4 inline-block text-accent hover:underline">
          Go to my reading lists
        </Link>
      </div>
    );
  }

  const { list, posts } = listData;
  const isOwner = user && String(user.username) === String(list.owner.username);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="border-b border-gray-200 pb-6 mb-8">
        <div className="flex items-center gap-2 text-xs text-ink-soft mb-2">
          <Link href={`/@${list.owner.username}`} className="hover:underline font-medium text-ink">
            {list.owner.name} (@{list.owner.username})
          </Link>
          <span>&bull;</span>
          <span className="capitalize font-semibold text-accent">{list.visibility} List</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-ink sm:text-4xl">{list.name}</h1>
        <p className="text-xs text-ink-soft mt-2">{posts.length} stories in this list</p>
      </div>

      <div className="py-4">
        {posts.length === 0 ? (
          <div className="py-12 text-center text-ink-soft">
            No stories in this reading list yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {posts.map((post, idx) => (
              <div key={post.id || idx} className="py-4">
                {post.isRemoved ? (
                  <div className="rounded-lg bg-gray-50 border border-dashed border-gray-200 p-4 text-xs text-ink-soft">
                    <p className="font-semibold text-gray-700">{post.title}</p>
                    <p className="mt-0.5">{post.subtitle}</p>
                  </div>
                ) : (
                  <div className="relative">
                    <PostCard post={post} />
                    {isOwner && (
                      <button
                        onClick={() => handleRemovePost(post.id)}
                        className="mt-2 text-xs text-rose-600 hover:underline"
                      >
                        Remove from list
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
