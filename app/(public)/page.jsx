/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Box } from "lucide-react";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";

export default async function HomePage() {
  let featuredProducts = [];
  let categories = [];

  try {
    await dbConnect();
    const featuredDocs = await Product.find({
      status: "published",
      featured: true,
    })
      .populate("category")
      .limit(4)
      .lean();
    featuredProducts = featuredDocs.map((p) => ({
      ...p,
      _id: p._id.toString(),
      category: p.category
        ? { ...p.category, _id: p.category._id.toString() }
        : null,
    }));

    const categoryDocs = await Category.find().limit(6).lean();
    categories = categoryDocs.map((c) => ({
      _id: c._id.toString(),
      name: c.name,
      slug: c.slug,
      description: c.description,
    }));
  } catch (error) {
    console.error(
      "Database connection failed on HomePage render:",
      error.message,
    );
  }

  return (
    <div className="layout-main">
      {/* Hero Showcase Section */}
      <section className="hero-section" aria-label="Hero showcase">
        <div className="relative w-full min-h-[85dvh] lg:min-h-[92dvh] rounded-[var(--outer-radius)] overflow-hidden shadow-card flex flex-col justify-center border border-border-subtle bg-gray-900">
          <div className="absolute inset-0 z-0 bg-gray-600">
            <img
              className="absolute inset-0 w-full h-full object-cover object-center mix-blend-overlay"
              src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?ixlib=rb-4.0.3&auto=format&fit=crop&w=2400&q=80"
              alt="Molten metal pouring in a high-temperature foundry"
            />
          </div>
          <div className="absolute inset-0 z-10 pointer-events-none bg-black/40" />
          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

          <div className="relative z-20 flex flex-col items-center text-center p-[var(--space-6)] pt-28 lg:pt-[var(--space-6)] transform transition-transform duration-700 translate-y-0 opacity-100 mt-20">
            <span className="text-xs font-bold text-white/80 tracking-[0.25em] uppercase px-4 py-1.5 border border-white/20 rounded-full backdrop-blur-md bg-white/5 mb-6">
              ISO 9001:2015 Certified
            </span>
            <h1 className="font-headline font-light text-text-inverse leading-[1.1] tracking-tight max-w-4xl text-4xl sm:text-5xl md:text-6xl">
              Precision Copper & Bronze Casting for the Modern Era.
            </h1>
            <p
              className="text-gray-200 max-w-2xl font-light leading-relaxed mt-6 mb-8"
              style={{ fontSize: "var(--text-body)" }}
            >
              Your comprehensive foundry for custom copper-base alloys.
              Delivering high-pressure sand casting and precision machining for
              marine and industrial OEM applications.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
              <Link
                href="/products"
                className="inline-flex justify-center items-center px-8 py-4 bg-surface text-text-primary rounded-full text-[var(--text-cta)] font-medium shadow-cta hover:bg-surface-subtle transition-colors"
              >
                Browse Catalog <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex justify-center items-center px-8 py-4 bg-black/40 text-text-inverse border border-white/20 rounded-full text-[var(--text-cta)] font-medium hover:bg-black/60 transition-colors"
              >
                Request Quote
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Marquee Logo Roll */}
      <section className="w-full overflow-hidden py-12 sm:py-16 lg:py-20 bg-surface border-y border-border-subtle">
        <div className="flex w-max animate-scroll opacity-60 hover:opacity-100 transition-opacity duration-500">
          <div className="flex items-center gap-16 sm:gap-24 md:gap-32 pr-16 sm:pr-24 md:pr-32 text-lg sm:text-xl text-text-primary">
            <div className="font-bold tracking-tight">COPPER-NICKEL</div>
            <div className="tracking-widest font-light">ALUMINUM BRONZE</div>
            <div className="italic font-medium">Silicon Brass</div>
            <div className="uppercase font-semibold">
              PUMP & VALVE COMPONENTS
            </div>
            <div className="tracking-wide">PRECISION MACHINING</div>
          </div>
          <div
            className="flex items-center gap-16 sm:gap-24 md:gap-32 pr-16 sm:pr-24 md:pr-32 text-lg sm:text-xl text-text-primary"
            aria-hidden="true"
          >
            <div className="font-bold tracking-tight">COPPER-NICKEL</div>
            <div className="tracking-widest font-light">ALUMINUM BRONZE</div>
            <div className="italic font-medium">Silicon Brass</div>
            <div className="uppercase font-semibold">
              PUMP & VALVE COMPONENTS
            </div>
            <div className="tracking-wide">PRECISION MACHINING</div>
          </div>
        </div>
      </section>

      {/* Featured Products as Smart Insights Split-Pane */}
      {featuredProducts.length > 0 && (
        <>
          <section className="pt-20 sm:pt-24 lg:pt-32 pb-8 sm:pb-12 w-full">
            <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
              <div className="max-w-3xl">
                <span className="text-xs font-semibold text-text-muted tracking-[0.2em] uppercase">
                  Featured Showcase
                </span>
                <h2 className="font-headline font-light text-text-primary mt-4 leading-tight text-3xl sm:text-4xl lg:text-5xl text-balance">
                  Precision cast,
                  <br className="hidden sm:block" /> ready for assembly
                </h2>
              </div>
            </div>
          </section>

          <section className="pb-16 lg:pb-24 w-full">
            <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
              <div className="border border-border-base rounded-[var(--outer-radius)] overflow-hidden flex flex-col lg:flex-row w-full bg-surface shadow-sm">
                <div className="w-full lg:w-5/12 flex flex-col p-6 sm:p-8 lg:p-12 justify-between">
                  <div className="w-full">
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                      <Box
                        className="text-text-primary h-8 w-8"
                        strokeWidth={1.5}
                      />
                      <h2
                        className="font-headline font-light text-text-primary tracking-tight text-2xl sm:text-3xl lg:text-4xl line-clamp-2"
                        title={featuredProducts[0]?.name || "Premium Alloy"}
                      >
                        {featuredProducts[0]?.name || "Premium Alloy"}
                      </h2>
                    </div>
                    <p
                      className="text-text-muted text-sm sm:text-base mb-8 lg:mb-12 leading-relaxed font-light line-clamp-4"
                      title={featuredProducts[0]?.description}
                    >
                      {featuredProducts[0]?.description ||
                        "Our high-pressure copper die casting components are built for exceptional thermal conductivity and unmatched marine corrosion resistance."}
                    </p>
                  </div>

                  <div className="space-y-4 mt-auto">
                    <div className="group cursor-pointer">
                      <div className="border-t border-border-base pt-4 sm:pt-6 pb-2 sm:pb-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-[2px] bg-text-primary w-1/3 transition-all duration-500 group-hover:w-full"></div>
                        <h3 className="text-base sm:text-lg font-medium text-text-primary mb-2 transition-colors">
                          Technical Specifications
                        </h3>
                        <p className="text-sm text-text-muted leading-relaxed pr-4 font-light">
                          Superior thermal conductivity, exceptional marine
                          corrosion resistance, and optimized for
                          high-temperature OEM pump applications.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link
                        href={
                          featuredProducts[0]?.category
                            ? `/products/${featuredProducts[0].category.slug}/${featuredProducts[0].slug}`
                            : "#"
                        }
                        className="inline-flex items-center text-sm font-medium text-text-primary hover:text-gray-600 transition-colors"
                      >
                        View Product Details{" "}
                        <ArrowRight className="ml-1 w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-7/12 relative flex items-center justify-center overflow-hidden group p-4 sm:p-6 lg:p-8 min-h-[400px] lg:min-h-[auto] border-t lg:border-t-0 lg:border-l border-border-base bg-surface-muted">
                  <img
                    alt={featuredProducts[0]?.name || "Featured Product"}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 lg:group-hover:scale-105"
                    src={
                      featuredProducts[0]?.images?.[0] ||
                      "https://images.unsplash.com/photo-1581092335397-9583eb92d232?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                    }
                  />
                  <div className="relative z-10 w-full max-w-sm rounded-[var(--inner-radius)] p-6 sm:p-8 shadow-xl bg-surface space-y-4 sm:space-y-6 transform transition-transform duration-500 hover:-translate-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider text-text-muted font-semibold">
                        Quality Metric
                      </span>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 sm:space-y-2">
                        <div className="text-[10px] sm:text-xs text-text-muted uppercase tracking-wider font-semibold">
                          Purity
                        </div>
                        <div className="text-base sm:text-xl font-light text-text-primary">
                          99.9%
                        </div>
                        <div className="h-1 sm:h-1.5 w-full bg-surface-subtle rounded-full overflow-hidden">
                          <div className="h-full bg-gray-900 w-[99%]" />
                        </div>
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <div className="text-[10px] sm:text-xs text-text-muted uppercase tracking-wider font-semibold">
                          Tolerance
                        </div>
                        <div className="text-base sm:text-xl font-light text-text-primary">
                          ±0.002&quot;
                        </div>
                        <div className="h-1 sm:h-1.5 w-full bg-surface-subtle rounded-full overflow-hidden">
                          <div className="h-full bg-gray-900 w-[95%]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Categories Grid - Core Tools structure */}
      <section className="py-16 sm:py-20 lg:py-28 w-full bg-background">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <div className="mb-12 sm:mb-16">
            <span className="text-xs font-semibold text-text-muted tracking-[0.2em] uppercase">
              Inventory
            </span>
            <h2 className="font-headline font-light text-text-primary mt-4 leading-tight text-3xl sm:text-4xl lg:text-5xl text-balance">
              Categorized for your
              <br className="hidden sm:block" /> operational needs
            </h2>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-border-base rounded-[var(--outer-radius)] bg-surface mt-8">
              <h3 className="text-lg font-medium text-text-primary">
                No categories found
              </h3>
              <p className="mt-2 text-text-muted font-light">
                Inventory categories are currently being updated.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 lg:gap-y-16">
              {categories.map((category) => (
                <div
                  key={category._id}
                  className="flex flex-col relative group"
                >
                  <div className="w-full border-t-2 border-border-base group-hover:border-black transition-colors duration-300"></div>
                  <h3
                    className="text-lg sm:text-xl font-medium text-text-primary mb-3 mt-8 sm:mt-10 tracking-tight line-clamp-2"
                    title={category.name}
                  >
                    <Link
                      href={`/products/${category.slug}`}
                      className="hover:underline"
                    >
                      {category.name}
                    </Link>
                  </h3>
                  <p
                    className="text-sm sm:text-base text-text-muted font-light leading-relaxed mb-4 line-clamp-3"
                    title={category.description}
                  >
                    {category.description ||
                      `Browse our selection of premium ${category.name.toLowerCase()} for industrial applications.`}
                  </p>
                  <Link
                    href={`/products/${category.slug}`}
                    className="text-sm font-medium text-text-primary mt-auto inline-flex items-center hover:opacity-70 transition-opacity"
                  >
                    Explore <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              ))}
            </div>
          )}

          <div className="mt-16 pt-8 border-t border-border-subtle text-center">
            <Link
              href="/products"
              className="inline-flex justify-center items-center px-8 py-4 bg-surface border border-border-base text-text-primary rounded-full text-[var(--text-cta)] font-medium shadow-sm hover:bg-surface-muted transition-colors"
            >
              View All Categories
            </Link>
          </div>
        </div>
      </section>

      {/* Interstitial Section */}
      <section className="py-12 sm:py-16 w-full">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <div className="relative w-full aspect-square sm:aspect-video md:min-h-[500px] rounded-[var(--outer-radius)] overflow-hidden flex items-center justify-center shadow-sm bg-gray-900">
            <img
              alt="Bright sparks from precision metal machining and casting."
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
              src="https://images.unsplash.com/photo-1580983546522-383792cb0023?ixlib=rb-4.0.3&auto=format&fit=crop&w=2400&q=80"
            />
            <div className="relative z-10 w-full px-6 sm:px-8 text-center flex flex-col items-center justify-center h-full max-w-4xl mx-auto">
              <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-text-inverse leading-tight tracking-tight text-balance shadow-black/20 drop-shadow-md">
                Over 200 distinct copper alloys poured on-site daily.
              </h2>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
