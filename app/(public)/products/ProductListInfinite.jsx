'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {edges.map(({ node: product }) => (
          <Link key={product._id.toString()} href={`/products/${product.category?.slug || 'uncategorized'}/${product.slug}`} className="relative group block h-full">
            <div className="w-full h-full bg-surface border border-border-subtle rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-row gap-4 sm:gap-6 items-center">
              
              {/* Left Side: Content */}
              <div className="flex-1 w-full flex flex-col justify-center text-left">
                {/* Pill Badge */}
                {product.category && (
                  <div className="mb-2 sm:mb-3">
                    <span className="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg border border-primary text-[9px] sm:text-[10px] font-semibold text-primary uppercase tracking-widest bg-transparent">
                      {product.category.name}
                    </span>
                  </div>
                )}
                
                {/* Product Name */}
                <h3 className="text-base sm:text-xl font-medium text-text-primary mb-1 sm:mb-2 line-clamp-2 tracking-tight group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                
                {/* Product Excerpt (Visible on all screens) */}
                <p className="block text-xs sm:text-sm text-text-muted font-light line-clamp-2 leading-relaxed">
                  {product.shortDescription || product.description || "Contact us for detailed specifications and sizing options."}
                </p>
              </div>

              {/* Right Side: Image */}
              {showImages && product.images && product.images[0] && (
                <div className="w-24 sm:w-32 md:w-40 aspect-square relative rounded-md overflow-hidden bg-surface-subtle flex-shrink-0">
                  <Image 
                    src={product.images[0]} 
                    alt={product.name} 
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, 160px"
                  />
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
