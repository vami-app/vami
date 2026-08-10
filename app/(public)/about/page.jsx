import Link from "next/link";
import {
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  Settings,
  Droplets,
} from "lucide-react";

export const metadata = {
  title: "About Us | Radhey Metal Alloys LLP",
  description:
    "Mastering the most demanding alloys. Radhey Metal Alloys LLP specializes in high-conductivity copper and complex marine bronze casting and CNC machining.",
};

export default function AboutPage() {
  return (
    <div className="layout-main">
      {/* 1. Premium Hero Section */}
      <section className="pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-28 lg:pb-32 w-full">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <div className="max-w-4xl">
            <span className="text-xs font-semibold text-text-muted tracking-[0.2em] uppercase">
              About Radhey Metal Alloys LLP
            </span>
            <h1 className="font-headline font-light text-text-primary mt-6 leading-tight text-5xl sm:text-6xl lg:text-7xl text-balance">
              Mastering the Most Demanding Alloys.
            </h1>
            <p className="mt-8 text-text-muted text-lg sm:text-xl font-light leading-relaxed max-w-2xl">
              Casting high-conductivity copper and complex marine bronzes
              requires uncompromising thermal control and metallurgical
              precision. At Radhey Metal Alloys LLP, we don&apos;t just pour metal; we engineer
              material integrity.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Our Legacy & Technical Competencies (Split Pane Layout) */}
      <section className="py-16 sm:py-24 w-full bg-surface border-y border-border-subtle">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Rich text */}
            <div>
              <h2 className="font-headline text-3xl sm:text-4xl text-text-primary font-light mb-6">
                Uncompromising Quality for Critical Applications.
              </h2>
              <div className="space-y-6 text-text-muted font-light leading-relaxed text-base sm:text-lg">
                <p>
                  Since our inception, Radhey Metal Alloys LLP has been dedicated to solving
                  the complex metallurgical challenges that generic foundries
                  avoid. Copper is notoriously difficult to cast—highly
                  susceptible to gas porosity and rapid oxidation at extreme
                  melting temperatures.
                </p>
                <p>
                  Our proprietary degassing processes and strict thermal
                  controls allow us to cast flawless{" "}
                  <strong className="text-text-primary font-medium">
                    High-Conductivity Electrolytic Tough Pitch Copper (C11000)
                  </strong>{" "}
                  components, essential for modern EV infrastructure and heavy
                  electrical switchgears where pure conductivity is paramount.
                </p>
                <p>
                  For the Marine and Defense sectors, our expertise in{" "}
                  <strong className="text-text-primary font-medium">
                    C95800 Nickel-Aluminum Bronze
                  </strong>{" "}
                  and{" "}
                  <strong className="text-text-primary font-medium">
                    Marine Grade CuNi 70/30
                  </strong>{" "}
                  ensures pump casings and high-pressure flanges that withstand
                  decades of highly corrosive saltwater environments.
                </p>
              </div>
            </div>
            {/* Right: High-quality image */}
            <div className="w-full aspect-[4/3] sm:aspect-video lg:aspect-square rounded-[var(--outer-radius)] overflow-hidden relative shadow-sm border border-border-subtle group bg-surface-muted">
              <img
                src="https://images.unsplash.com/photo-1581092335397-9583eb92d232?auto=format&fit=crop&w=1200&q=80"
                alt="Precision pouring of molten metal in advanced foundry"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface/95 via-surface/40 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 lg:bottom-10 lg:left-10 text-text-primary">
                <div className="text-sm font-semibold tracking-[0.1em] uppercase mb-2 opacity-90">
                  Precision Pouring
                </div>
                <div className="text-xl sm:text-2xl font-light">
                  Eliminating gas porosity through controlled environment
                  casting.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Foundry & Quality Assurance Grid */}
      <section className="py-20 sm:py-32 w-full">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-24">
            <h2 className="font-headline text-3xl sm:text-4xl text-text-primary font-light mb-6">
              Integrated Foundry Capabilities
            </h2>
            <p className="text-text-muted font-light text-lg">
              From raw ingot to finished tolerance, our end-to-end process
              guarantees total traceability and unyielding dimensional accuracy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Card 1 */}
            <div className="bg-surface rounded-[var(--outer-radius)] p-8 sm:p-10 border border-border-subtle shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-surface-muted rounded-lg group-hover:scale-150 transition-transform duration-700 ease-out z-0"></div>
              <div className="relative z-10">
                <div className="h-14 w-14 rounded-lg bg-primary text-primary-foreground flex items-center justify-center mb-8">
                  <Droplets className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-medium text-text-primary mb-4 tracking-tight">
                  Advanced Sand & Die Casting
                </h3>
                <p className="text-text-muted font-light leading-relaxed">
                  Specializing in precision sand casting for complex,
                  large-scale geometries (like industrial pump casings) and
                  high-volume die casting for tight-tolerance repetitive parts.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-surface rounded-[var(--outer-radius)] p-8 sm:p-10 border border-border-subtle shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-surface-muted rounded-lg group-hover:scale-150 transition-transform duration-700 ease-out z-0"></div>
              <div className="relative z-10">
                <div className="h-14 w-14 rounded-lg bg-primary text-primary-foreground flex items-center justify-center mb-8">
                  <ShieldCheck className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-medium text-text-primary mb-4 tracking-tight">
                  Spectrographic Analysis & NDT
                </h3>
                <p className="text-text-muted font-light leading-relaxed">
                  Copper alloys demand strict chemical verification. We perform
                  in-house spectrographic analysis and Non-Destructive Testing
                  (NDT) to guarantee zero porosity and structural perfection.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-surface rounded-[var(--outer-radius)] p-8 sm:p-10 border border-border-subtle shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-surface-muted rounded-lg group-hover:scale-150 transition-transform duration-700 ease-out z-0"></div>
              <div className="relative z-10">
                <div className="h-14 w-14 rounded-lg bg-primary text-primary-foreground flex items-center justify-center mb-8">
                  <Settings className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-medium text-text-primary mb-4 tracking-tight">
                  In-House CNC Machining
                </h3>
                <p className="text-text-muted font-light leading-relaxed">
                  Delivering turnkey solutions. Our state-of-the-art CNC milling
                  and turning centers take your components from near-net casting
                  shape to final precision tolerance under one roof.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Location & Map Embed */}
      <section className="pb-12 sm:pb-16 w-full">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <div className="flex flex-col lg:block relative w-full rounded-[var(--outer-radius)] overflow-hidden border border-border-subtle shadow-sm group bg-surface">
            {/* Google Map iframe */}
            <div className="w-full aspect-square sm:aspect-video lg:aspect-[21/9] relative">
              <iframe
                src="https://maps.google.com/maps?q=43,+Vardhmaan+Nagar,+Kalol,+Gandhinagar,+Gujarat,+India&t=&z=14&ie=UTF8&iwloc=B&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 grayscale contrast-125 opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000"
                title="Radhey Metal Alloys Headquarters Location"
              ></iframe>
            </div>

            {/* Overlay Contact Card */}
            <div className="bg-surface lg:bg-surface/95 lg:backdrop-blur-md p-6 sm:p-8 lg:absolute lg:bottom-12 lg:left-12 lg:rounded-[calc(var(--outer-radius)-8px)] lg:shadow-xl lg:border lg:border-border-subtle lg:max-w-sm z-10 lg:transform lg:transition-transform lg:duration-500 lg:hover:-translate-y-2">
              <h3 className="text-xl font-medium text-text-primary mb-6">
                Global Headquarters
              </h3>

              <ul className="space-y-4">
                <li>
                  <div className="flex items-start text-sm text-text-secondary font-light">
                    <MapPin
                      className="flex-shrink-0 h-5 w-5 mr-3 mt-0.5 text-text-primary"
                      aria-hidden="true"
                      strokeWidth={1.5}
                    />
                    <span>
                      43, Vardhmaan Nagar, Kalol
                      <br />
                      Gandhinagar, Gujarat
                      <br />
                      India - 382721
                    </span>
                  </div>
                </li>
                <li>
                  <a
                    href="mailto:radhemetalalloysllp@gmail.com"
                    className="flex items-center text-sm text-text-secondary hover:text-text-primary font-light transition-colors group/link"
                  >
                    <Mail
                      className="flex-shrink-0 h-5 w-5 mr-3 text-text-primary"
                      aria-hidden="true"
                      strokeWidth={1.5}
                    />
                    <span className="group-hover/link:underline">
                      radhemetalalloysllp@gmail.com
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+919081358107"
                    className="flex items-center text-sm text-text-secondary hover:text-text-primary font-light transition-colors group/link"
                  >
                    <Phone
                      className="flex-shrink-0 h-5 w-5 mr-3 text-text-primary"
                      aria-hidden="true"
                      strokeWidth={1.5}
                    />
                    <span className="group-hover/link:underline">
                      +91 9081358107
                    </span>
                  </a>
                </li>
              </ul>

              <div className="mt-8">
                <a
                  href="https://maps.google.com/?q=43,+Vardhmaan+Nagar,+Kalol,+Gandhinagar,+Gujarat,+India"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full bg-primary text-primary-foreground rounded-lg py-3 px-4 text-sm font-semibold uppercase tracking-wider hover:opacity-90 transition-colors"
                >
                  Get Directions
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
