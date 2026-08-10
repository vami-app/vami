import { getPublishedBlogPosts } from '@/modules/blog';
import BlogListInfinite from './BlogListInfinite';

export const metadata = {
  title: 'Journal & Technical Insights',
  description: 'Deep dives into metallurgy, copper casting, and CNC machining from Radhey Metal Alloys LLP.',
};

export default async function BlogListingPage() {
  let blogData = { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };
  try {
    // Fetch initial page with limit of 12 for grid
    const result = await getPublishedBlogPosts({ limit: 12 });
    // Stringify ObjectIds for Client Components
    blogData = JSON.parse(JSON.stringify(result));
  } catch (error) {
    console.error('Database connection failed on Blog page render:', error.message);
  }

  return (
    <div className="layout-main">
      {/* Hero Section */}
      <section className="pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-28 lg:pb-20 w-full bg-surface border-b border-border-subtle">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <div className="max-w-3xl">
            <span className="text-xs font-semibold text-text-muted tracking-[0.2em] uppercase">Industry Insights</span>
            <h1 className="font-headline font-light text-text-primary mt-6 leading-tight text-5xl sm:text-6xl lg:text-7xl text-balance">
              The Metallurgy Journal.
            </h1>
            <p className="mt-6 text-text-muted text-lg sm:text-xl font-light leading-relaxed max-w-2xl">
              Deep technical explorations into the science of high-conductivity copper, marine grade bronze, and precision CNC machining.
            </p>
          </div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="py-16 sm:py-24 w-full">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <BlogListInfinite initialEdges={blogData.edges} initialPageInfo={blogData.pageInfo} />
        </div>
      </section>
    </div>
  );
}
