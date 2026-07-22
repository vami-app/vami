"use client";

import { useState } from "react";
import PostList from "@/components/post/PostList";
import ForYouFeed from "@/components/post/ForYouFeed";
import TrendingTags from "@/components/post/TrendingTags";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("latest");

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero band */}
      <section className="border-b border-gray-200 py-12 sm:py-16">
        <h1 className="font-serif text-4xl font-bold leading-tight text-ink sm:text-5xl">
          Stay curious.
        </h1>
        <p className="mt-3 max-w-xl text-lg text-ink-soft">
          Discover thoughtful stories, ideas, and voices — and share your own.
        </p>
      </section>

      {/* Navigation Feed Tabs */}
      <div className="flex border-b border-gray-200 mt-6">
        <button
          onClick={() => setActiveTab("latest")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition ${
            activeTab === "latest"
              ? "border-ink text-ink"
              : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          Latest
        </button>

        {user && (
          <button
            onClick={() => setActiveTab("for-you")}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === "for-you"
                ? "border-ink text-ink"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            For You
          </button>
        )}
      </div>

      <div className="flex gap-10 py-6">
        <div className="min-w-0 flex-1">
          {activeTab === "latest" ? (
            <PostList emptyMessage="No published stories yet. Be the first to write one!" />
          ) : (
            <ForYouFeed />
          )}
        </div>
        <aside className="hidden w-72 shrink-0 border-l border-gray-100 pl-8 pt-8 lg:block">
          <div className="sticky top-24">
            <TrendingTags />
          </div>
        </aside>
      </div>
    </div>
  );
}
