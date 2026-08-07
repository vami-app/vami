'use client';

import { useState } from 'react';
import Link from 'next/link';
import { loadMoreProducts } from '@/modules/products/product.actions';
import LoadMore from '@/components/ui/LoadMore';
import toast from 'react-hot-toast';

export default function ProductListInfinite({ initialEdges, initialPageInfo, showImages = true }) {
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {edges.map(({ node: product }) => (
          <Link key={product._id.toString()} href={`/products/${product.category?.slug || 'uncategorized'}/${product.slug}`} className="relative group block h-full">
            <div className="w-full h-full bg-surface border border-border-subtle rounded-lg p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-6 items-center">
              
              {/* Left Side: Content */}
              <div className="flex-1 w-full flex flex-col justify-center text-left order-2 sm:order-1">
                {/* Pill Badge */}
                {product.category && (
                  <div className="mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-lg border border-primary text-[10px] font-semibold text-primary uppercase tracking-widest bg-transparent">
                      {product.category.name}
                    </span>
                  </div>
                )}
                
                {/* Product Name */}
                <h3 className="text-lg sm:text-xl font-medium text-text-primary mb-2 line-clamp-2 tracking-tight group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                
                {/* Product Description */}
                <p className="text-sm text-text-muted font-light leading-relaxed line-clamp-3">
                  {product.shortDescription || "Contact us for detailed specifications and sizing options."}
                </p>
              </div>

              {/* Right Side: Image with margin/padding wrapper effect */}
              {showImages && product.images && product.images.length > 0 && (
                <div className="w-full sm:w-1/3 xl:w-2/5 aspect-video sm:aspect-square md:aspect-[4/3] rounded-lg overflow-hidden relative order-1 sm:order-2 shrink-0 border border-border-subtle">
                  <img src={product.images[0]} alt={product.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
              )}

            </div>
          </Link>
        ))}
      </div>
      <LoadMore onLoadMore={handleLoadMore} hasNext={pageInfo.hasNextPage} isLoading={isLoading} />
    </>
  );
}
