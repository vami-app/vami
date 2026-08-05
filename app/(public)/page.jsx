/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Box, FileText, CheckCircle, ShieldCheck } from "lucide-react";
import { getFeaturedProducts } from "@/modules/products";
import { getAllCategories } from "@/modules/categories";

export default async function HomePage() {
  let featuredProducts = [];
  let categories = [];

  try {
    const featuredDocs = await getFeaturedProducts(4);
    featuredProducts = featuredDocs.map((p) => ({
      ...p,
      _id: p._id.toString(),
      category: p.category
        ? { ...p.category, _id: p.category._id.toString() }
        : null,
    }));

    const categoryDocs = await getAllCategories(6);
    categories = categoryDocs.map((c) => ({
      ...c,
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
        <div className="relative w-full min-h-[85dvh] lg:min-h-[92dvh] rounded-[var(--outer-radius)] overflow-hidden shadow-2xl flex flex-col justify-center border border-border-subtle bg-black">
          <div className="absolute inset-0 z-0">
            <img
              className="absolute inset-0 w-full h-full object-cover object-center saturate-150 contrast-110 brightness-110"
              src="/images/copper_sheets_1785916944432.png"
              alt="High-quality non-ferrous metallurgy"
            />
          </div>
          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-tr from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-black/90 via-transparent to-black/30" />

          <div className="relative z-20 flex flex-col items-center text-center p-[var(--space-6)] pt-28 lg:pt-[var(--space-6)] transform transition-transform duration-700 translate-y-0 opacity-100 mt-20">
            <h1 className="font-headline font-light text-white leading-[1.1] tracking-tight max-w-4xl text-4xl sm:text-5xl md:text-6xl drop-shadow-2xl">
              Engineering Excellence in Non-Ferrous Metallurgy & Casting
            </h1>
            <p
              className="text-gray-200 max-w-3xl font-light leading-relaxed mt-6 mb-8 text-lg md:text-xl"
            >
              Radhey Metal Alloys LLP manufactures high-purity Copper, Brass, and Phosphor Bronze Sheets, Plates, Circles, Ingots, and Custom Castings—supplied with complete Company Test Certificates and NABL laboratory reports.
            </p>
            <div className="flex flex-col sm:flex-row gap-0 sm:gap-4 w-full sm:w-auto mt-4">
              <div className="transition-all duration-500 ease-in-out overflow-hidden flex justify-center lg:opacity-100 lg:max-w-xl lg:max-h-24 max-w-0 max-h-0 opacity-0">
                <Link
                  href="/contact"
                  className="inline-flex justify-center items-center px-8 py-4 bg-white text-black rounded-full text-[var(--text-cta)] font-medium shadow-2xl hover:bg-gray-100 hover:scale-105 transition-all duration-300 whitespace-nowrap"
                >
                  Request a Technical Quote <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
              <Link
                href="/products"
                className="inline-flex justify-center items-center px-8 py-4 rounded-full text-[var(--text-cta)] font-medium transition-all duration-500 bg-white text-black shadow-2xl hover:bg-gray-100 hover:scale-105 lg:bg-black/40 lg:text-white lg:border lg:border-white/30 lg:shadow-none lg:hover:scale-100 lg:hover:bg-black/60 lg:hover:border-white/50 lg:backdrop-blur-md whitespace-nowrap"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 sm:py-20 lg:py-28 w-full bg-surface border-b border-border-subtle">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            <div>
              <span className="text-xs font-semibold text-text-muted tracking-[0.2em] uppercase">
                About Us
              </span>
              <h2 className="font-headline font-light text-text-primary mt-4 leading-tight text-3xl sm:text-4xl lg:text-5xl">
                Radhey Metal Alloys LLP
              </h2>
              <p className="mt-8 text-text-muted text-[var(--text-body)] leading-relaxed font-light">
                Radhey Metal Alloys LLP is an advanced manufacturer of high-performance non-ferrous metal products and precision castings based in Gujarat, India. We supply precision-engineered sheets, plates, circles, foundry-ready ingots, and industrial castings to critical engineering sectors globally.
              </p>
              <p className="mt-6 text-text-muted text-[var(--text-body)] leading-relaxed font-light">
                By combining exact chemical composition control with strict dimensional tolerances, we ensure your projects meet the toughest metallurgical standards.
              </p>
            </div>
            <div className="relative rounded-[var(--inner-radius)] overflow-hidden shadow-2xl aspect-video lg:aspect-square">
               <img
                src="/images/brass_plates_1785916962925.png"
                alt="Brass Plates"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quality Assurance Section */}
      <section className="py-16 sm:py-20 lg:py-28 w-full bg-background">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <div className="text-center max-w-3xl mx-auto mb-16">
             <span className="text-xs font-semibold text-text-muted tracking-[0.2em] uppercase">
                Certification
              </span>
              <h2 className="font-headline font-light text-text-primary mt-4 leading-tight text-3xl sm:text-4xl lg:text-5xl">
                Uncompromising Quality Assurance & Certification
              </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface p-8 rounded-[var(--inner-radius)] border border-border-base shadow-sm hover:shadow-md transition-shadow">
              <FileText className="w-10 h-10 text-text-primary mb-6" />
              <h3 className="text-xl font-medium text-text-primary mb-4">Company Test Certificate (TC)</h3>
              <p className="text-text-muted font-light leading-relaxed">
                Every single shipment includes our official manufacturer test certificate detailing chemical composition, dimensions, and production batch verification.
              </p>
            </div>
            <div className="bg-surface p-8 rounded-[var(--inner-radius)] border border-border-base shadow-sm hover:shadow-md transition-shadow">
              <ShieldCheck className="w-10 h-10 text-text-primary mb-6" />
              <h3 className="text-xl font-medium text-text-primary mb-4">NABL Certified Testing</h3>
              <p className="text-text-muted font-light leading-relaxed">
                All materials are thoroughly tested mechanically and chemically via NABL-accredited laboratories to ensure 100% grade compliance.
              </p>
            </div>
            <div className="bg-surface p-8 rounded-[var(--inner-radius)] border border-border-base shadow-sm hover:shadow-md transition-shadow">
              <CheckCircle className="w-10 h-10 text-text-primary mb-6" />
              <h3 className="text-xl font-medium text-text-primary mb-4">Ultrasonic Inspection</h3>
              <p className="text-text-muted font-light leading-relaxed">
                For critical high-stress engineering applications, we provide comprehensive Ultrasonic Test (UT) reports upon request to guarantee zero internal flaws or porosity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 sm:py-20 lg:py-28 w-full bg-surface border-t border-border-subtle">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <div className="mb-12 sm:mb-16">
            <span className="text-xs font-semibold text-text-muted tracking-[0.2em] uppercase">
              Products
            </span>
            <h2 className="font-headline font-light text-text-primary mt-4 leading-tight text-3xl sm:text-4xl lg:text-5xl text-balance">
              Our Products, Grades & Castings
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-8 gap-y-12 lg:gap-y-16">
            {categories.map((category) => (
              <div
                key={category._id}
                className="flex flex-col relative group"
              >
                <div className="w-full aspect-[4/3] rounded-[var(--inner-radius)] overflow-hidden mb-6">
                  <img src={category.image} alt={category.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <h3
                  className="text-lg sm:text-xl font-medium text-text-primary mb-3 tracking-tight line-clamp-2"
                >
                  <Link
                    href={`/products/${category.slug}`}
                    className="hover:underline"
                  >
                    {category.name}
                  </Link>
                </h3>
                <p
                  className="text-sm sm:text-base text-text-muted font-light leading-relaxed mb-4"
                >
                  {category.description}
                </p>
                <Link
                  href={`/products/${category.slug}`}
                  className="text-sm font-medium text-text-primary mt-auto inline-flex items-center hover:opacity-70 transition-opacity"
                >
                  Explore Grades <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
