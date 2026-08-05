import { Zap, Anchor, Car, Wrench } from "lucide-react";

export const metadata = {
  title: "Industries We Serve | Radhey Metal Alloys LLP",
  description: "Radhey Metal Alloys LLP supplies precision non-ferrous metals to the Electrical, Marine, Automotive, and Foundry industries.",
};

export default function IndustriesPage() {
  return (
    <div className="pt-24 pb-16 bg-surface min-h-screen">
      <div className="max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
        <div className="mb-16">
          <span className="text-xs font-semibold text-text-muted tracking-[0.2em] uppercase">
            Sectors
          </span>
          <h1 className="font-headline font-light text-text-primary mt-4 leading-tight text-4xl sm:text-5xl lg:text-6xl text-balance">
            Industries We Serve
          </h1>
          <p className="mt-6 text-lg text-text-muted max-w-2xl font-light">
            Providing high-performance non-ferrous solutions tailored to the strict engineering demands of specialized sectors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Electrical */}
          <div className="bg-background rounded-[var(--inner-radius)] border border-border-base p-8 sm:p-10 shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
            <div className="bg-surface-muted p-4 rounded-full mb-6 text-text-primary">
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
            <div className="bg-surface-muted p-4 rounded-full mb-6 text-text-primary">
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
            <div className="bg-surface-muted p-4 rounded-full mb-6 text-text-primary">
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
            <div className="bg-surface-muted p-4 rounded-full mb-6 text-text-primary">
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
    </div>
  );
}
