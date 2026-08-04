
import { getAllPublishedProducts } from '@/modules/products';
import ProductListInfinite from './ProductListInfinite';

export const metadata = {
  title: 'All Products | Smalloys',
  description: 'Browse our complete catalog of premium industrial materials, alloys, and composites.',
};

export default async function AllProductsPage() {
  let productsData = { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };
  try {
    // Fetch initial page with a limit of 12 for the grid
    productsData = await getAllPublishedProducts({ limit: 12 });
  } catch (error) {
    console.error('Database connection failed on Products page render:', error.message);
  }

  return (
    <div className="layout-main">
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
    </div>
  );
}
