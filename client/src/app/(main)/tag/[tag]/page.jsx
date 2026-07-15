import PostList from "@/components/post/PostList";

/**
 * @param {{ params: Promise<{ tag: string }> }} props
 */
export default async function TagPage({ params }) {
  const { tag: raw } = await params;
  const tag = decodeURIComponent(raw).toLowerCase();

  return (
    <div className="mx-auto max-w-feed px-4 py-8">
      <p className="text-sm text-ink-soft">Stories tagged</p>
      <h1 className="mb-6 font-serif text-3xl font-bold capitalize">{tag}</h1>
      <PostList
        query={{ tag }}
        emptyMessage={`No stories tagged “${tag}” yet.`}
      />
    </div>
  );
}
