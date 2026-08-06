import ProductListInfinite from './product-list-infinite';
import { PageShell } from '@/components/templates/page-shell';

export function ProductsPageFeature({ productsData }) {
  return (
    <PageShell>
      <section className="py-12 sm:py-16 lg:py-24 w-full">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <div className="mb-12 sm:mb-20">
            <span className="text-xs font-semibold text-text-muted tracking-[0.2em] uppercase">Inventory</span>
            <h1 className="font-headline font-light text-text-primary mt-4 leading-tight text-4xl sm:text-5xl lg:text-6xl text-balance">
              All Products
            </h1>
            <p className="mt-6 text-text-muted text-base sm:text-lg font-light max-w-2xl leading-relaxed">
              Browse our complete selection of premium industrial materials, custom copper-base alloys, and precision sand castings.
            </p>
          </div>

          <ProductListInfinite initialEdges={productsData.edges} initialPageInfo={productsData.pageInfo} />
        </div>
      </section>
    </PageShell>
  );
}
