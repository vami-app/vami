"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

/** Right-rail list of the most-used tags (published posts). */
export default function TrendingTags() {
  const [tags, setTags] = useState([]);

  useEffect(() => {
    api
      .get("/api/posts/tags/trending?limit=12")
      .then((d) => setTags(d.tags))
      .catch(() => setTags([]));
  }, []);

  if (tags.length === 0) return null;

  return (
    <div>
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink">
        Trending tags
      </h3>
      <div className="flex flex-wrap gap-2 lg:flex-col lg:space-y-2 lg:gap-0">
        {tags.map((t) => (
          <Link
            key={t.tag}
            href={`/tag/${t.tag}`}
            className="rounded-full bg-gray-100 px-3.5 py-2 text-sm text-ink hover:bg-gray-200 lg:w-fit"
          >
            {t.tag}
          </Link>
        ))}
      </div>
    </div>
  );

}
