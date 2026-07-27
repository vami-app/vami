"use client";

import { useEffect, useState } from "react";
import PostCard from "@/components/post/PostCard";

export default function RelatedPosts({ slug }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRelated() {
      try {
        setLoading(true);
        const res = await fetch(`/api/posts/${slug}/related`);
        const json = await res.json();
        if (res.ok && json.data) {
          setPosts(json.data.posts);
        }
      } catch (err) {
        console.error("Failed to fetch related posts:", err);
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchRelated();
  }, [slug]);

  if (loading || posts.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-reading px-4 pt-12 border-t border-gray-100 mt-12">
      <h2 className="font-serif text-2xl font-bold text-ink mb-6">Related Stories</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );

}
