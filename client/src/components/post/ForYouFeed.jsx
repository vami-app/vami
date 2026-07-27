"use client";

import { useEffect, useState } from "react";
import PostCard from "@/components/post/PostCard";

export default function ForYouFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [factors, setFactors] = useState(null);
  const [showDisclosure, setShowDisclosure] = useState(false);

  useEffect(() => {
    async function fetchRecommended() {
      try {
        setLoading(true);
        const res = await fetch("/api/posts/recommended");
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Failed to load recommendations");
        setPosts(json.data.posts);
        setFactors(json.data.factors);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRecommended();
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-ink-soft">Computing your personalized feed...</div>;
  }

  if (error) {
    return <div className="py-12 text-center text-red-600 font-medium">{error}</div>;
  }

  return (
    <div>
      {/* In-product disclosure affordance */}
      <div className="mb-6 flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-xs text-ink-soft">
        <span>Stories ranked based on your followed tags, author follows, recency, and engagement.</span>
        <button
          onClick={() => setShowDisclosure(!showDisclosure)}
          className="font-semibold text-accent hover:underline ml-2"
        >
          {showDisclosure ? "Hide details" : "Why these stories?"}
        </button>
      </div>

      {showDisclosure && (
        <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4 text-xs text-blue-900 space-y-2">
          <h4 className="font-bold text-sm">How recommendations work on Inkwell</h4>
          <p>
            Inkwell never uses opaque black-box algorithms. Posts in this feed are ranked using explicit, transparent factors:
          </p>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li><strong>Tag Overlap:</strong> Stories matching your followed tags ({factors?.followedTagsCount || 0} tags followed).</li>
            <li><strong>Author Follows:</strong> Stories published by writers you follow ({factors?.followedAuthorsCount || 0} authors followed).</li>
            <li><strong>Recency:</strong> Newer stories are prioritized over older ones using standard time decay.</li>
            <li><strong>Community Engagement:</strong> Total claps and views from the Inkwell community.</li>
          </ul>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="py-12 text-center text-ink-soft">
          No stories found for your current interests. Follow more tags or authors to personalize your feed!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} variant="grid" />
          ))}
        </div>

      )}
    </div>
  );
}
