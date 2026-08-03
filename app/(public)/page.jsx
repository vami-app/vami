import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Cog,
} from "lucide-react";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";

export default async function HomePage() {
  let featuredProducts = [];
  let categories = [];

  try {
    await dbConnect();

    // Fetch Featured Products
    const featuredDocs = await Product.find({
      status: "published",
      featured: true,
    })
      .populate("category")
      .limit(4)
      .lean();

    // Format for client
    featuredProducts = featuredDocs.map((p) => ({
      ...p,
      _id: p._id.toString(),
      category: p.category
        ? { ...p.category, _id: p.category._id.toString() }
        : null,
    }));

    // Fetch Categories for Grid
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
    <div className="bg-[#f9f9f9] text-gray-900 font-sans overflow-x-hidden w-full selection:bg-gray-900 selection:text-white pb-24">
      {/* 
        Optical Refraction Filter Bank 
        Provides the chromatic aberration and volumetric distortion for the glass panels[cite: 1]
      */}
      <svg
        width="0"
        height="0"
        className="absolute overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <defs>
          <filter
            id="glass-distortion"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.007 0.010"
              numOctaves="2"
              seed="11"
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation="2.5" result="softNoise" />

            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="red"
            />
            <feDisplacementMap
              in="red"
              in2="softNoise"
              scale="24"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displacedRed"
            />

            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="green"
            />
            <feDisplacementMap
              in="green"
              in2="softNoise"
              scale="20"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displacedGreen"
            />

            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="blue"
            />
            <feDisplacementMap
              in="blue"
              in2="softNoise"
              scale="16"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displacedBlue"
            />

            <feBlend
              in="displacedRed"
              in2="displacedGreen"
              mode="screen"
              result="rg"
            />
            <feBlend in="rg" in2="displacedBlue" mode="screen" />
          </filter>
        </defs>
      </svg>

      {/* Hero Showcase Section[cite: 1] */}
      <section className="w-full max-w-[80rem] mx-auto px-4 sm:px-6 pb-6 pt-8">
        <div className="relative w-full min-h-[70vh] rounded-[36px] overflow-hidden shadow-2xl flex flex-col justify-end border border-white/20">
          <div className="absolute inset-0 z-0 bg-[#1a1c1c]">
            <img
              className="absolute inset-0 w-full h-full object-cover object-center"
              src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=2400&q=80"
              alt="Industrial manufacturing materials"
            />
          </div>
          {/* Hero Scrim[cite: 1] */}
          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="relative z-20 flex flex-col items-center text-center p-8 sm:p-12 gap-8 transform transition-transform duration-700 translate-y-0 opacity-100">
            <h1 className="font-serif font-light text-white text-4xl sm:text-5xl md:text-7xl leading-tight tracking-tight max-w-4xl text-balance">
              Premium Industrial Materials for the Modern Era.
            </h1>
            <p className="text-gray-300 max-w-2xl text-lg font-light">
              Providing the highest quality alloys, composites, and specialized
              materials for demanding manufacturing applications worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
              <Link
                href="/products"
                className="inline-flex justify-center items-center px-8 py-4 bg-white text-gray-900 rounded-full font-medium shadow-xl hover:bg-gray-100 transition-transform active:scale-95"
              >
                Browse Catalog <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex justify-center items-center px-8 py-4 bg-black/40 text-white border border-white/30 rounded-full font-medium backdrop-blur-md hover:bg-black/60 transition-transform active:scale-95"
              >
                Request Quote
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Marquee Logo Roll[cite: 1] */}
      <section className="w-full overflow-hidden py-12 bg-white/50 border-y border-gray-200/60 mb-24">
        {/* Custom CSS animation required in globals.css for 'scroll' keyframes[cite: 2] */}
        <div className="flex w-max animate-[scroll_30s_linear_infinite] opacity-60 hover:opacity-100 transition-opacity duration-500">
          <div className="flex items-center gap-16 sm:gap-32 pr-16 sm:pr-32 text-xl text-gray-900">
            <div className="font-bold tracking-tight">AEROSPACE</div>
            <div className="tracking-widest font-light">AUTOMOTIVE</div>
            <div className="italic font-medium">Heavy Industry</div>
            <div className="uppercase font-semibold">ISO 9001</div>
            <div className="tracking-wide">GLOBAL SHIPPING</div>
          </div>
          <div
            className="flex items-center gap-16 sm:gap-32 pr-16 sm:pr-32 text-xl text-gray-900"
            aria-hidden="true"
          >
            <div className="font-bold tracking-tight">AEROSPACE</div>
            <div className="tracking-widest font-light">AUTOMOTIVE</div>
            <div className="italic font-medium">Heavy Industry</div>
            <div className="uppercase font-semibold">ISO 9001</div>
            <div className="tracking-wide">GLOBAL SHIPPING</div>
          </div>
        </div>
      </section>

      {/* Smart Insights / Bento Box Features[cite: 1] */}
      <section className="px-4 sm:px-6 lg:px-8 w-full max-w-[80rem] mx-auto mb-24">
        <div className="mb-12">
          <span className="text-xs font-semibold text-gray-500 tracking-[0.2em] uppercase">
            Why Choose Us
          </span>
          <h2 className="font-serif font-light text-gray-900 mt-4 leading-tight text-3xl sm:text-4xl lg:text-5xl text-balance">
            Industry leading quality,
            <br className="hidden sm:block" /> uncompromising standards.
          </h2>
        </div>

        <div className="border border-gray-200/60 rounded-[24px] overflow-hidden flex flex-col lg:flex-row w-full bg-white/50 shadow-sm">
          <div className="w-full lg:w-5/12 flex flex-col p-8 lg:p-12 justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck
                  className="text-gray-900 h-8 w-8"
                  strokeWidth={1.5}
                />
                <h3 className="font-serif font-light text-gray-900 tracking-tight text-3xl">
                  ISO 9001 Certified
                </h3>
              </div>
              <p className="text-gray-500 leading-relaxed font-light mb-12">
                Every alloy and composite we distribute meets rigorous
                international quality standards, ensuring your manufacturing
                line operates flawlessly without material failures.
              </p>
            </div>

            <div className="space-y-4">
              <div className="border-t border-gray-200/60 pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Traceable Origins
                </h4>
                <p className="text-sm text-gray-500 font-light">
                  Full metallurgical reports and certification provided with
                  every single shipment.
                </p>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-7/12 relative flex items-center justify-center overflow-hidden group p-6 min-h-[400px] border-t lg:border-t-0 lg:border-l border-gray-200/60">
            <img
              alt="Quality assurance testing"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              src="https://images.unsplash.com/photo-1580983554181-43577d6112ff?auto=format&fit=crop&w=1200&q=80"
            />

            {/* Glass Panel overlay */}
            <div
              className="relative z-10 w-full max-w-sm rounded-[24px] p-8 shadow-2xl space-y-6 border border-white/30 bg-white/10"
              style={{
                backdropFilter:
                  "blur(24px) saturate(1.6) url(#glass-distortion)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-white font-semibold">
                  Stress Testing
                </span>
                <div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">
                    Tensile Strength
                  </div>
                  <div className="text-xl font-light text-white">99.8%</div>
                  <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-[99%]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">
                    Purity
                  </div>
                  <div className="text-xl font-light text-white">Grade A</div>
                  <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-green-400 w-[100%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Minimalist Grid[cite: 1] */}
      <section className="px-4 sm:px-6 lg:px-8 w-full max-w-[80rem] mx-auto mb-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs font-semibold text-gray-500 tracking-[0.2em] uppercase">
              Inventory
            </span>
            <h2 className="font-serif font-light text-gray-900 mt-4 leading-tight text-3xl sm:text-4xl text-balance">
              Shop by Category
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden sm:block text-sm font-medium text-gray-900 hover:opacity-60 transition-opacity"
          >
            Browse all &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category._id}
              href={`/products/${category.slug}`}
              className="group relative flex flex-col h-64 rounded-[20px] p-6 border border-gray-200/60 bg-white hover:border-gray-900 transition-colors duration-300"
            >
              <div className="w-full border-t-2 border-gray-100 group-hover:border-gray-900 transition-colors duration-300 absolute top-0 left-0 rounded-t-[20px]" />
              <div className="mt-auto">
                <h3 className="text-2xl font-medium text-gray-900 tracking-tight">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2 font-light">
                    {category.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
        <Link
          href="/products"
          className="block sm:hidden text-sm font-medium text-gray-900 mt-6 hover:opacity-60 transition-opacity"
        >
          Browse all categories &rarr;
        </Link>
      </section>

      {/* Featured Products - Glass Tier Cards */}
      {featuredProducts.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 w-full max-w-[80rem] mx-auto">
          <div className="mb-12">
            <span className="text-xs font-semibold text-gray-500 tracking-[0.2em] uppercase">
              Showcase
            </span>
            <h2 className="font-serif font-light text-gray-900 mt-4 leading-tight text-3xl sm:text-4xl text-balance">
              Featured Materials
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div
                key={product._id}
                className="relative group rounded-[22px] min-h-[380px] flex flex-col overflow-hidden border border-gray-200/60 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2"
              >
                {/* Background Image */}
                <div className="absolute inset-0 z-0 bg-gray-100">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-light">
                      No image
                    </div>
                  )}
                </div>

                {/* Glass Optic Layer[cite: 2] */}
                <div
                  className="absolute inset-0 z-10 bg-white/10 border border-white/20"
                  style={{ backdropFilter: "blur(12px) saturate(1.4)" }}
                />

                {/* Specular Highlight Overlay[cite: 2] */}
                <div className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/40 to-transparent mix-blend-overlay" />

                {/* Content */}
                <div className="relative z-30 flex flex-col h-full p-6 justify-end">
                  <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 rounded-full px-3 py-1 text-[10px] font-bold tracking-widest uppercase text-gray-900 mb-auto w-fit backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-900" />
                    {product.category?.name || "Material"}
                  </div>

                  <div className="mt-6 bg-white/60 backdrop-blur-md p-4 rounded-xl border border-white/40">
                    <h3 className="font-serif text-xl font-medium text-gray-900 mb-1 leading-tight">
                      <Link
                        href={
                          product.category
                            ? `/products/${product.category.slug}/${product.slug}`
                            : "#"
                        }
                      >
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 z-40"
                        />
                        {product.name}
                      </Link>
                    </h3>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        View Spec
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-900" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
