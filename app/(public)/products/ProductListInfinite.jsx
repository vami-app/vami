'use client';

import { useState } from 'react';
import Link from 'next/link';
import { loadMoreProducts } from '@/modules/products/product.actions';
import LoadMore from '@/components/ui/LoadMore';
import toast from 'react-hot-toast';

export default function ProductListInfinite({ initialEdges, initialPageInfo }) {
  const [edges, setEdges] = useState(initialEdges);
  const [pageInfo, setPageInfo] = useState(initialPageInfo);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadMore = async () => {
    if (!pageInfo.hasNextPage || !pageInfo.endCursor || isLoading) return;
    setIsLoading(true);

    try {
      const data = await loadMoreProducts(pageInfo.endCursor);
      setEdges((prev) => [...prev, ...data.edges]);
      setPageInfo(data.pageInfo);
    } catch (error) {
      toast.error('Failed to load more products.');
    } finally {
      setIsLoading(false);
    }
  };

  if (edges.length === 0) {
    return (
      <div className="text-center py-24 border border-dashed border-border-base rounded-[var(--outer-radius)] bg-surface">
        <h3 className="text-lg font-medium text-text-primary">No products found</h3>
        <p className="mt-2 text-text-muted font-light">Check back soon for new inventory.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {edges.map(({ node: product }) => (
          <Link key={product._id.toString()} href={`/products/${product.category?.slug || 'uncategorized'}/${product.slug}`} className="relative group block">
            <div className="w-full aspect-[5/4] sm:aspect-square rounded-[var(--inner-radius)] overflow-hidden bg-surface-muted border border-border-subtle relative shadow-sm">
              {product.images && product.images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.images[0]} alt={product.name} className="absolute inset-0 w-full h-full object-center object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-text-muted font-light">No image</span>
                </div>
              )}
              
              {/* Top Badge */}
              {product.category && (
                <div className="absolute top-3 left-3 max-w-[calc(100%-1.5rem)] truncate block bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-semibold text-text-primary uppercase tracking-wider shadow-sm border border-border-subtle z-10" title={product.category.name}>
                  {product.category.name}
                </div>
              )}

              {/* Gradient Overlay for Sub-card Contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-surface/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* Glassmorphism Sub-card */}
              <div className="absolute bottom-3 left-3 right-3 bg-surface/95 backdrop-blur-md border border-border-subtle p-4 rounded-[calc(var(--inner-radius)-8px)] shadow-lg transform transition-all duration-500 group-hover:-translate-y-1 z-10">
                <h3 className="text-sm sm:text-base font-medium text-text-primary tracking-tight line-clamp-1">{product.name}</h3>
                <p className="mt-1 text-xs text-text-muted font-light leading-relaxed line-clamp-1 sm:line-clamp-2">{product.shortDescription}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <LoadMore onLoadMore={handleLoadMore} hasNext={pageInfo.hasNextPage} isLoading={isLoading} />
    </>
  );
}
