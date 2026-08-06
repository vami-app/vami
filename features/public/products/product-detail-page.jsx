import Link from "next/link";
import { Check, Info } from "lucide-react";
import { PageShell } from "@/components/templates/page-shell";

export function ProductDetailPageFeature({ product, category, jsonLd }) {
  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="py-12 sm:py-20 lg:py-24 w-full">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-10 sm:mb-16 relative w-full">
            <ol
              role="list"
              className="flex items-center space-x-3 sm:space-x-4 overflow-x-auto whitespace-nowrap hide-scrollbar pb-2 w-full"
            >
              <li>
                <div className="flex items-center text-xs font-semibold tracking-[0.2em] uppercase">
                  <Link
                    href="/"
                    className="text-text-muted hover:text-text-primary transition-colors"
                  >
                    Home
                  </Link>
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                    className="ml-3 sm:ml-4 flex-shrink-0 h-4 w-4 text-text-muted"
                  >
                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                  </svg>
                </div>
              </li>
              <li>
                <div className="flex items-center text-xs font-semibold tracking-[0.2em] uppercase">
                  <Link
                    href={`/products/${category.slug}`}
                    className="text-text-muted hover:text-text-primary transition-colors"
                  >
                    {category.name}
                  </Link>
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                    className="ml-3 sm:ml-4 flex-shrink-0 h-4 w-4 text-text-muted"
                  >
                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                  </svg>
                </div>
              </li>
              <li className="text-xs font-semibold tracking-[0.2em] uppercase">
                <span className="text-text-primary" aria-current="page">
                  {product.name}
                </span>
              </li>
            </ol>
          </nav>

          <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 lg:items-start">
            {/* Image gallery */}
            <div className="flex flex-col-reverse relative group">
              {product.images && product.images.length > 0 ? (
                <div className="w-full aspect-square sm:aspect-[4/3] bg-surface-muted rounded-[var(--inner-radius)] border border-border-subtle shadow-sm overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-center object-cover"
                  />
                </div>
              ) : (
                <div className="w-full aspect-square sm:aspect-[4/3] bg-surface-muted rounded-[var(--inner-radius)] border border-border-subtle shadow-sm flex items-center justify-center">
                  <span className="text-text-muted font-light">
                    No image available
                  </span>
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="mt-10 px-4 sm:px-0 lg:mt-0">
              <h1 className="font-headline font-light text-text-primary tracking-tight text-4xl sm:text-5xl lg:text-6xl text-balance leading-tight">
                {product.name}
              </h1>

              <div className="mt-8 border-t-2 border-border-base pt-8">
                <div className="text-lg sm:text-xl text-text-muted font-light leading-relaxed">
                  <p>{product.shortDescription}</p>
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-center">
                  <Check
                    className="h-5 w-5 text-text-primary flex-shrink-0"
                    aria-hidden="true"
                  />
                  <p className="ml-3 text-sm font-medium text-text-primary tracking-wide">
                    In stock and ready to ship globally
                  </p>
                </div>
              </div>

              <div className="mt-12 flex">
                <Link
                  href="/contact"
                  className="w-full sm:w-auto inline-flex justify-center items-center px-10 py-5 bg-text-primary text-text-inverse rounded-full text-[var(--text-cta)] font-medium shadow-cta hover:opacity-90 transition-colors"
                >
                  Request a Quote
                </Link>
              </div>
            </div>
          </div>

          {/* Specs and Variants */}
          <div className="mt-16 lg:mt-24 pt-16 lg:pt-24 border-t border-border-base lg:grid lg:grid-cols-3 lg:gap-x-12">
            <div className="lg:col-span-2">
              {product.longDescription && (
                <div className="mb-16">
                  <h2 className="font-headline font-light text-3xl sm:text-4xl text-text-primary tracking-tight mb-8">
                    Detailed Overview
                  </h2>
                  <div
                    className="prose sm:prose-lg font-light leading-relaxed text-text-muted max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: product.longDescription,
                    }}
                  />
                </div>
              )}

              {product.variants && product.variants.length > 0 && (
                <div className="mb-16">
                  <h2 className="font-headline font-light text-3xl sm:text-4xl text-text-primary tracking-tight mb-8">
                    Available Options
                  </h2>
                  <div className="border-t-2 border-border-base">
                    <ul role="list" className="divide-y divide-border-subtle">
                      {product.variants.map((variant, idx) => (
                        <li
                          key={idx}
                          className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div>
                            <p className="text-lg font-medium text-text-primary">
                              {variant.name}
                            </p>
                            {variant.priceNote && (
                              <p className="mt-1 text-sm text-text-muted font-light">
                                {variant.priceNote}
                              </p>
                            )}
                          </div>
                          <div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest bg-surface-subtle text-text-primary">
                              Available
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar / Specs */}
            <div className="mt-12 lg:mt-0 lg:col-span-1">
              {product.specs && product.specs.length > 0 && (
                <div className="bg-surface rounded-[var(--inner-radius)] p-8 sm:p-10 border border-border-subtle shadow-sm sticky top-24">
                  <h3 className="text-xs font-semibold text-text-muted tracking-[0.2em] uppercase mb-6 flex items-center">
                    <Info className="h-4 w-4 text-text-muted mr-2" />
                    Specifications
                  </h3>
                  <dl className="divide-y divide-border-subtle">
                    {product.specs.map((spec, idx) => (
                      <div
                        key={idx}
                        className="py-4 flex flex-col sm:flex-row sm:justify-between gap-2"
                      >
                        <dt className="text-sm text-text-muted font-light">
                          {spec.key}
                        </dt>
                        <dd className="text-sm text-text-primary font-medium sm:text-right">
                          {spec.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
