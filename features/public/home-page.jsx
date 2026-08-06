import Link from "next/link";
import { ArrowRight, FileText, CheckCircle, ShieldCheck, Zap, Anchor, Car, Wrench } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Text } from "@/components/atoms/text";
import { Icon } from "@/components/atoms/icon";
import { PageShell } from "@/components/templates/page-shell";
import { HeroShell } from "@/components/templates/hero-shell";

export function HomePageFeature({ featuredProducts, categories }) {
  return (
    <PageShell>
      <HeroShell aria-label="Hero showcase">
        <div className="relative w-full min-h-[85dvh] lg:min-h-[92dvh] rounded-[var(--outer-radius)] overflow-hidden flex flex-col justify-center border border-border-subtle bg-surface">
          <div className="absolute inset-0 z-0">
            <img
              className="absolute inset-0 w-full h-full object-cover object-center saturate-150 contrast-110 opacity-90"
              src="/images/copper_sheets_1785916944432.png"
              alt="High-quality non-ferrous metallurgy"
            />
          </div>
          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-tr from-surface/80 via-surface/40 to-transparent" />
          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-surface/70 via-transparent to-transparent" />

          <div className="relative z-20 flex flex-col items-center text-center p-[var(--space-6)] pt-28 lg:pt-[var(--space-6)] transform transition-transform duration-700 translate-y-0 opacity-100 mt-20">
            <Text as="h1" variant="headline" className="leading-[1.1] max-w-4xl text-4xl sm:text-5xl md:text-6xl drop-shadow-sm font-light">
              Engineering Excellence in Non-Ferrous Metallurgy & Casting
            </Text>
            <Text
              variant="body"
              className="text-text-secondary max-w-3xl font-light leading-relaxed mt-6 mb-8 text-lg md:text-xl"
            >
              Radhey Metal Alloys LLP manufactures high-purity Copper, Brass, and Phosphor Bronze Sheets, Plates, Circles, Ingots, and Custom Castings—supplied with complete Company Test Certificates and NABL laboratory reports.
            </Text>
            <div className="flex flex-col sm:flex-row gap-0 sm:gap-4 w-full sm:w-auto mt-4">
              <div className="transition-all duration-500 ease-in-out overflow-hidden flex justify-center lg:opacity-100 lg:max-w-xl lg:max-h-24 max-w-0 max-h-0 opacity-0">
                <Button asChild size="lg" className="rounded-full shadow-xl hover:scale-105 transition-all duration-300">
                  <Link href="/contact" className="hover:no-underline">
                    Request a Technical Quote <Icon icon={ArrowRight} size="sm" className="ml-2" />
                  </Link>
                </Button>
              </div>
              <Button asChild variant="outline" size="lg" className="rounded-full shadow-xl hover:scale-105 lg:bg-surface/40 lg:shadow-none lg:hover:scale-100 lg:hover:bg-surface/60 lg:backdrop-blur-md transition-all duration-500 border-border-base mt-4 sm:mt-0">
                <Link href="/products" className="hover:no-underline">
                  Browse Products
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </HeroShell>

      <section className="py-16 sm:py-20 lg:py-28 w-full bg-surface border-b border-border-subtle">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            <div>
              <Text variant="eyebrow">
                About Us
              </Text>
              <Text as="h2" variant="headline" className="mt-4 leading-tight text-3xl sm:text-4xl lg:text-5xl font-light">
                Radhey Metal Alloys LLP
              </Text>
              <Text variant="body" className="mt-8 leading-relaxed font-light text-[var(--text-body)]">
                Radhey Metal Alloys LLP is an advanced manufacturer of high-performance non-ferrous metal products and precision castings based in Gujarat, India. We supply precision-engineered sheets, plates, circles, foundry-ready ingots, and industrial castings to critical engineering sectors globally.
              </Text>
              <Text variant="body" className="mt-6 leading-relaxed font-light text-[var(--text-body)]">
                By combining exact chemical composition control with strict dimensional tolerances, we ensure your projects meet the toughest metallurgical standards.
              </Text>
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

      <section className="py-16 sm:py-20 lg:py-28 w-full bg-background">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <div className="text-center max-w-3xl mx-auto mb-16">
             <Text variant="eyebrow">
                Certification
              </Text>
              <Text as="h2" variant="headline" className="mt-4 leading-tight text-3xl sm:text-4xl lg:text-5xl font-light">
                Uncompromising Quality Assurance & Certification
              </Text>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface p-8 rounded-[var(--inner-radius)] border border-border-base shadow-sm hover:shadow-md transition-shadow">
              <Icon icon={FileText} size="lg" className="mb-6 text-text-primary h-10 w-10" />
              <Text as="h3" variant="cta" className="text-xl mb-4 font-medium">Company Test Certificate (TC)</Text>
              <Text variant="caption" className="font-light leading-relaxed">
                Every single shipment includes our official manufacturer test certificate detailing chemical composition, dimensions, and production batch verification.
              </Text>
            </div>
            <div className="bg-surface p-8 rounded-[var(--inner-radius)] border border-border-base shadow-sm hover:shadow-md transition-shadow">
              <Icon icon={ShieldCheck} size="lg" className="mb-6 text-text-primary h-10 w-10" />
              <Text as="h3" variant="cta" className="text-xl mb-4 font-medium">NABL Certified Testing</Text>
              <Text variant="caption" className="font-light leading-relaxed">
                All materials are thoroughly tested mechanically and chemically via NABL-accredited laboratories to ensure 100% grade compliance.
              </Text>
            </div>
            <div className="bg-surface p-8 rounded-[var(--inner-radius)] border border-border-base shadow-sm hover:shadow-md transition-shadow">
              <Icon icon={CheckCircle} size="lg" className="mb-6 text-text-primary h-10 w-10" />
              <Text as="h3" variant="cta" className="text-xl mb-4 font-medium">Ultrasonic Inspection</Text>
              <Text variant="caption" className="font-light leading-relaxed">
                For critical high-stress engineering applications, we provide comprehensive Ultrasonic Test (UT) reports upon request to guarantee zero internal flaws or porosity.
              </Text>
            </div>
          </div>
        </div>
      </section>

      <section id="industries" className="py-16 sm:py-20 lg:py-28 w-full bg-surface border-t border-border-subtle">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <div className="mb-12 sm:mb-16">
            <Text variant="eyebrow">
              Sectors
            </Text>
            <Text as="h2" variant="headline" className="mt-4 leading-tight text-3xl sm:text-4xl lg:text-5xl text-balance font-light">
              Industries We Serve
            </Text>
            <Text variant="body" className="mt-6 text-lg max-w-2xl font-light">
              Providing high-performance non-ferrous solutions tailored to the strict engineering demands of specialized sectors.
            </Text>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Industry Cards */}
            <div className="bg-background rounded-[var(--inner-radius)] border border-border-base p-8 sm:p-10 shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
              <div className="bg-surface-muted p-4 rounded-full mb-6 text-text-primary">
                <Icon icon={Zap} size="lg" className="h-8 w-8" />
              </div>
              <Text as="h3" variant="cta" className="text-2xl mb-4 font-medium">Electrical & Power Distribution</Text>
              <Text variant="caption" className="font-light leading-relaxed mb-6">
                Supplying high-conductivity ETP copper tailored for electrical applications.
              </Text>
              <ul className="list-disc list-inside text-text-secondary font-light space-y-2 mt-auto text-sm">
                <li>Busbars & Switchgears</li>
                <li>Transformers</li>
                <li>Copper Castings & Control Panels</li>
              </ul>
            </div>
            <div className="bg-background rounded-[var(--inner-radius)] border border-border-base p-8 sm:p-10 shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
              <div className="bg-surface-muted p-4 rounded-full mb-6 text-text-primary">
                <Icon icon={Anchor} size="lg" className="h-8 w-8" />
              </div>
              <Text as="h3" variant="cta" className="text-2xl mb-4 font-medium">Marine & Defense</Text>
              <Text variant="caption" className="font-light leading-relaxed mb-6">
                Engineered for extreme saltwater resistance and high mechanical stress.
              </Text>
              <ul className="list-disc list-inside text-text-secondary font-light space-y-2 mt-auto text-sm">
                <li>Naval Brass (C464)</li>
                <li>Phosphor Bronze alloys</li>
                <li>Saltwater-resistant components</li>
              </ul>
            </div>
            <div className="bg-background rounded-[var(--inner-radius)] border border-border-base p-8 sm:p-10 shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
              <div className="bg-surface-muted p-4 rounded-full mb-6 text-text-primary">
                <Icon icon={Car} size="lg" className="h-8 w-8" />
              </div>
              <Text as="h3" variant="cta" className="text-2xl mb-4 font-medium">Automotive & Radiators</Text>
              <Text variant="caption" className="font-light leading-relaxed mb-6">
                Precision metals designed for vehicular engineering and heat exchange.
              </Text>
              <ul className="list-disc list-inside text-text-secondary font-light space-y-2 mt-auto text-sm">
                <li>Deep-drawn Cartridge Brass (C260)</li>
                <li>Custom aluminium castings</li>
                <li>Heat Exchanger components</li>
              </ul>
            </div>
            <div className="bg-background rounded-[var(--inner-radius)] border border-border-base p-8 sm:p-10 shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
              <div className="bg-surface-muted p-4 rounded-full mb-6 text-text-primary">
                <Icon icon={Wrench} size="lg" className="h-8 w-8" />
              </div>
              <Text as="h3" variant="cta" className="text-2xl mb-4 font-medium">Foundries & Precision Machining</Text>
              <Text variant="caption" className="font-light leading-relaxed mb-6">
                Supplying the base raw materials for heavy engineering workshops.
              </Text>
              <ul className="list-disc list-inside text-text-secondary font-light space-y-2 mt-auto text-sm">
                <li>Virgin-quality ingots</li>
                <li>Casting blanks</li>
                <li>Free-cutting C360 stocks</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-28 w-full bg-background border-t border-border-subtle">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <div className="mb-12 sm:mb-16">
            <Text variant="eyebrow">
              Products
            </Text>
            <Text as="h2" variant="headline" className="mt-4 leading-tight text-3xl sm:text-4xl lg:text-5xl text-balance font-light">
              Our Products, Grades & Castings
            </Text>
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
                <Text
                  as="h3"
                  variant="cta"
                  className="text-lg sm:text-xl mb-3 tracking-tight line-clamp-2 font-medium"
                >
                  <Link
                    href={`/products/${category.slug}`}
                    className="hover:underline text-text-primary"
                  >
                    {category.name}
                  </Link>
                </Text>
                <Text
                  variant="body"
                  className="text-sm sm:text-base font-light leading-relaxed mb-4"
                >
                  {category.description}
                </Text>
                <Link
                  href={`/products/${category.slug}`}
                  className="text-sm font-medium text-text-primary mt-auto inline-flex items-center hover:opacity-70 transition-opacity hover:no-underline"
                >
                  Explore Grades <Icon icon={ArrowRight} size="sm" className="ml-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
