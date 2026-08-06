import BlogListInfinite from './blog-list-infinite';
import { PageShell } from '@/components/templates/page-shell';

export function BlogPageFeature({ blogData }) {
  return (
    <PageShell>
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
    </PageShell>
  );
}
