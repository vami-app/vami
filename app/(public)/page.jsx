/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, FileText, CheckCircle, ShieldCheck, Zap, Anchor, Car, Wrench } from "lucide-react";
import { getFeaturedProducts } from "@/modules/products";
import { getAllCategories } from "@/modules/categories";
import { WHY_RMA_SECTIONS, HOME_GALLERY_ITEMS } from "@/config/marketing-content";

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
        <div className="relative w-full min-h-[85dvh] lg:min-h-[92dvh] rounded-[var(--outer-radius)] overflow-hidden flex flex-col justify-center border border-border-subtle bg-surface">
          <div 
            className="absolute inset-0 z-0"
            dangerouslySetInnerHTML={{
              __html: `
                <video
                  class="absolute inset-0 w-full h-full object-cover object-center saturate-150 contrast-110 opacity-90"
                  autoplay
                  muted
                  loop
                  playsinline
                  preload="auto"
                >
                  <source src="/videos/7341421-uhd_3840_2160_30fps.mp4" type="video/mp4" />
                </video>
              `
            }}
          />
          <div className="absolute inset-0 z-10 pointer-events-none bg-black/40" />
          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-[#1b0a0a]/90 via-[#1b0a0a]/40 to-transparent" />

          <div className="relative z-20 flex flex-col items-center text-center p-[var(--space-6)] pt-28 lg:pt-[var(--space-6)] transform transition-transform duration-700 translate-y-0 opacity-100 mt-20">
            <h1 className="font-headline font-light text-white leading-[1.1] tracking-tight max-w-4xl text-4xl sm:text-5xl md:text-6xl drop-shadow-md">
              Precision Non-Ferrous Metal Products &amp; Custom Castings
            </h1>
            <p className="text-gray-200 max-w-3xl font-light leading-relaxed mt-4 text-base md:text-lg drop-shadow tracking-wide">
              Copper • Brass • Phosphor Bronze • Custom Alloys
            </p>
            <p
              className="text-gray-200 max-w-3xl font-light leading-relaxed mt-6 mb-8 text-lg md:text-xl drop-shadow"
            >
              Manufacturer and supplier of precision-engineered sheets, plates, circles, ingots and custom castings for demanding industrial applications — with Company Test Certificates and laboratory reports as required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4 justify-center">
              <Link
                href="/products"
                className="inline-flex justify-center items-center px-8 py-4 bg-primary text-primary-foreground rounded-lg text-sm font-semibold uppercase tracking-wider shadow-lg hover:bg-primary/90 transition-all duration-300 whitespace-nowrap"
              >
                View Products
              </Link>
              <Link
                href="/contact"
                className="inline-flex justify-center items-center px-8 py-4 rounded-lg text-sm font-semibold uppercase tracking-wider transition-all duration-300 bg-surface/90 text-text-primary shadow-lg border border-border-base hover:bg-surface whitespace-nowrap"
              >
                Request a Quote <ArrowRight className="ml-2 h-5 w-5" />
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
            <div className="relative rounded-[var(--inner-radius)] overflow-hidden border border-border-subtle aspect-video lg:aspect-square">
               <img
                src="/images/brass_plates_1785916962925.png"
                alt="Brass Plates"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why RMA */}
      <section className="py-16 sm:py-20 lg:py-28 w-full bg-background border-t border-border-subtle">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <div className="max-w-3xl mb-12 sm:mb-16">
            <span className="text-xs font-semibold text-text-muted tracking-[0.2em] uppercase">
              Why RMA
            </span>
            <h2 className="font-headline font-light text-text-primary mt-4 leading-tight text-3xl sm:text-4xl lg:text-5xl">
              Built for industrial buyers who need proof, not promises.
            </h2>
            <p className="mt-6 text-lg text-text-muted font-light">
              Claims we stand behind for chemistry, dimensions, documentation and delivery.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {WHY_RMA_SECTIONS.map((item) => (
              <div
                key={item.title}
                className="border border-border-subtle rounded-[var(--inner-radius)] bg-surface p-8"
              >
                <h3 className="text-xl font-medium text-text-primary">{item.title}</h3>
                <p className="mt-3 text-text-muted font-light leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
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
              <h3 className="text-xl font-medium text-text-primary mb-4">NABL Laboratory Reports</h3>
              <p className="text-text-muted font-light leading-relaxed">
                Where required, materials can be supported with third-party laboratory reports. We distinguish laboratory reports from laboratory accreditation — only verified claims are published.
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

      {/* Industries Section */}
      <section id="industries" className="py-16 sm:py-20 lg:py-28 w-full bg-surface border-t border-border-subtle">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <div className="mb-12 sm:mb-16">
            <span className="text-xs font-semibold text-text-muted tracking-[0.2em] uppercase">
              Sectors
            </span>
            <h2 className="font-headline font-light text-text-primary mt-4 leading-tight text-3xl sm:text-4xl lg:text-5xl text-balance">
              Industries We Serve
            </h2>
            <p className="mt-6 text-lg text-text-muted max-w-2xl font-light">
              Providing high-performance non-ferrous solutions tailored to the strict engineering demands of specialized sectors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Electrical */}
            <div className="bg-background rounded-[var(--inner-radius)] border border-border-base p-8 sm:p-10 shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
              <div className="bg-surface-muted p-4 rounded-lg mb-6 text-primary">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-medium text-text-primary mb-4">Electrical & Power Distribution</h3>
              <p className="text-text-muted font-light leading-relaxed mb-6">
                Supplying high-conductivity ETP copper tailored for electrical applications.
              </p>
              <ul className="list-disc list-inside text-text-secondary font-light space-y-2 mt-auto">
                <li>Busbars & Switchgears</li>
                <li>Transformers</li>
                <li>Copper Castings & Control Panels</li>
              </ul>
            </div>

            {/* Marine */}
            <div className="bg-background rounded-[var(--inner-radius)] border border-border-base p-8 sm:p-10 shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
              <div className="bg-surface-muted p-4 rounded-lg mb-6 text-primary">
                <Anchor className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-medium text-text-primary mb-4">Marine & Defense</h3>
              <p className="text-text-muted font-light leading-relaxed mb-6">
                Engineered for extreme saltwater resistance and high mechanical stress.
              </p>
              <ul className="list-disc list-inside text-text-secondary font-light space-y-2 mt-auto">
                <li>Naval Brass (C464)</li>
                <li>Phosphor Bronze alloys</li>
                <li>Saltwater-resistant components</li>
              </ul>
            </div>

            {/* Automotive */}
            <div className="bg-background rounded-[var(--inner-radius)] border border-border-base p-8 sm:p-10 shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
              <div className="bg-surface-muted p-4 rounded-lg mb-6 text-primary">
                <Car className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-medium text-text-primary mb-4">Automotive & Radiators</h3>
              <p className="text-text-muted font-light leading-relaxed mb-6">
                Precision metals designed for vehicular engineering and heat exchange.
              </p>
              <ul className="list-disc list-inside text-text-secondary font-light space-y-2 mt-auto">
                <li>Deep-drawn Cartridge Brass (C260)</li>
                <li>Custom aluminium castings</li>
                <li>Heat Exchanger components</li>
              </ul>
            </div>

            {/* Foundries */}
            <div className="bg-background rounded-[var(--inner-radius)] border border-border-base p-8 sm:p-10 shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
              <div className="bg-surface-muted p-4 rounded-lg mb-6 text-primary">
                <Wrench className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-medium text-text-primary mb-4">Foundries & Precision Machining</h3>
              <p className="text-text-muted font-light leading-relaxed mb-6">
                Supplying the base raw materials for heavy engineering workshops.
              </p>
              <ul className="list-disc list-inside text-text-secondary font-light space-y-2 mt-auto">
                <li>Virgin-quality ingots</li>
                <li>Casting blanks</li>
                <li>Free-cutting C360 stocks</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Featured products */}
      {featuredProducts.length > 0 ? (
        <section className="py-16 sm:py-20 w-full bg-surface border-t border-border-subtle">
          <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
            <span className="text-xs font-semibold text-text-muted tracking-[0.2em] uppercase">
              Featured
            </span>
            <h2 className="font-headline font-light text-text-primary mt-4 leading-tight text-3xl sm:text-4xl">
              Featured Products
            </h2>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((p) => (
                <Link
                  key={p._id}
                  href={p.category?.slug ? `/products/${p.category.slug}/${p.slug}` : '/products'}
                  className="border border-border-subtle rounded-[var(--inner-radius)] p-5 hover:shadow-md transition-shadow bg-background"
                >
                  <h3 className="text-lg font-medium text-text-primary">{p.name}</h3>
                  <p className="mt-2 text-sm text-text-muted font-light line-clamp-3">
                    {p.shortDescription}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Factory / product gallery */}
      <section className="py-16 sm:py-20 w-full bg-surface border-t border-border-subtle">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <span className="text-xs font-semibold text-text-muted tracking-[0.2em] uppercase">
            Gallery
          </span>
          <h2 className="font-headline font-light text-text-primary mt-4 leading-tight text-3xl sm:text-4xl">
            Products &amp; Materials
          </h2>
          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {HOME_GALLERY_ITEMS.map((item) => (
              <div
                key={item.title}
                className="relative aspect-square rounded-[var(--inner-radius)] overflow-hidden border border-border-subtle"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-sm font-medium text-white">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities teaser + Custom casting CTA + RFQ strip */}
      <section className="py-16 sm:py-20 w-full bg-background border-t border-border-subtle">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)] grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="border border-border-subtle rounded-[var(--inner-radius)] p-8 sm:p-10 bg-surface">
            <h2 className="font-headline text-3xl text-text-primary font-light">Manufacturing Capabilities</h2>
            <p className="mt-4 text-text-muted font-light leading-relaxed">
              Explore our process from melting and alloying through inspection and dispatch.
            </p>
            <Link href="/capabilities" className="inline-flex mt-6 text-sm font-semibold uppercase tracking-wider text-text-primary hover:underline">
              View capabilities <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="border border-border-subtle rounded-[var(--inner-radius)] p-8 sm:p-10 bg-surface">
            <h2 className="font-headline text-3xl text-text-primary font-light">Custom Castings</h2>
            <p className="mt-4 text-text-muted font-light leading-relaxed">
              Have a custom casting or component requirement? Upload your drawing or specification on our quote form.
            </p>
            <Link href="/contact?product=Custom%20Castings" className="inline-flex mt-6 text-sm font-semibold uppercase tracking-wider text-text-primary hover:underline">
              Upload drawing / RFQ <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 w-full bg-surface border-t border-border-subtle">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)] text-center">
          <h2 className="font-headline text-3xl sm:text-4xl text-text-primary font-light">
            Request a Quote
          </h2>
          <p className="mt-4 text-text-muted font-light max-w-2xl mx-auto">
            Get a quote in about 60 seconds — one form for products, grades, and custom castings.
          </p>
          <Link
            href="/contact"
            className="inline-flex mt-8 px-8 py-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold uppercase tracking-wider hover:opacity-90"
          >
            Go to RFQ form <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 sm:py-20 lg:py-28 w-full bg-background border-t border-border-subtle">
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
