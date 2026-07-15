import PostList from "@/components/post/PostList";
import TrendingTags from "@/components/post/TrendingTags";

export const metadata = {
  title: "Inkwell — Read and write stories",
};

export default function HomePage() {
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

      <div className="flex gap-10 py-4">
        <div className="min-w-0 flex-1">
          <PostList emptyMessage="No published stories yet. Be the first to write one!" />
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
