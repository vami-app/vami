import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { siteConfig } from "@/config/site";
import { FooterYear } from "./FooterYear";
import CookieBanner from "./CookieBanner";

export default function Footer({ categories = [] }) {
  return (
    <>
      <footer className="pt-8 pb-[var(--gap)] w-full px-[var(--gap)] mt-8">
        <div className="max-w-[var(--max-width-layout)] mx-auto">
          <div className="w-full min-h-[400px] sm:min-h-[500px] rounded-[var(--outer-radius)] flex flex-col justify-between gap-4 sm:gap-12 relative border border-border-subtle bg-background p-6 sm:p-10 lg:p-16 overflow-hidden shadow-sm">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 z-10 w-full">
              {/* Intro Text */}
              <div className="lg:w-5/12 max-w-lg">
                <h3 className="font-headline text-2xl sm:text-3xl md:text-4xl font-light text-text-primary mb-4 sm:mb-6 tracking-tight">
                  Premium quality,
                  <br />
                  uncompromising standards.
                </h3>
                <p className="text-text-muted text-[var(--text-body)] leading-relaxed font-light">
                  Providing the highest quality copper, brass, bronze, and
                  specialty castings for demanding manufacturing applications
                  worldwide.
                </p>
              </div>

              {/* Quick Links */}
              <div className="lg:w-7/12 grid grid-cols-1 sm:grid-cols-2 gap-8 lg:justify-items-end lg:text-right">
                <div className="lg:text-left w-full max-w-[280px]">
                  <h4 className="text-xs font-semibold text-text-primary tracking-[0.2em] uppercase mb-4">
                    Info
                  </h4>
                  <ul className="space-y-4">
                    <li>
                      <a
                        href="mailto:radhemetalalloysllp@gmail.com"
                        className="flex items-center text-sm text-text-muted hover:text-text-primary font-light transition-colors"
                      >
                        <Mail className="flex-shrink-0 h-4 w-4 mr-3 text-text-muted" />
                        radhemetalalloysllp@gmail.com
                      </a>
                    </li>
                    <li>
                      <a
                        href="tel:+919081358107"
                        className="flex items-center text-sm text-text-muted hover:text-text-primary font-light transition-colors"
                      >
                        <Phone className="flex-shrink-0 h-4 w-4 mr-3 text-text-muted" />
                        +91 9081358107
                      </a>
                    </li>
                    <li>
                      <div className="flex items-start text-sm text-text-muted font-light">
                        <MapPin className="flex-shrink-0 h-4 w-4 mr-3 mt-0.5 text-text-muted" />
                        <span>
                          43, Vardhmaan Nagar, Kalol, Gandhinagar, Gujarat,
                          India - 382721
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="lg:text-left w-full max-w-[200px]">
                  <h4 className="text-xs font-semibold text-text-primary tracking-[0.2em] uppercase mb-4">
                    Company
                  </h4>
                  <ul className="space-y-4">
                    {siteConfig.footerNav.map((link) => (
                      <li key={link.title}>
                        <Link
                          href={link.href}
                          className="text-sm text-text-muted hover:text-text-primary font-light transition-colors"
                        >
                          {link.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-col w-full gap-4 mt-auto z-10">
              <div
                className="font-bold tracking-tighter text-text-primary whitespace-nowrap overflow-hidden"
                style={{
                  fontSize: "clamp(1.5rem, 6vw, 6rem)",
                  marginLeft: "-0.05em",
                  lineHeight: "0.85",
                }}
              >
                RADHEY METAL ALLOYS.
              </div>
              <div className="text-[10px] sm:text-xs text-text-muted font-light text-left">
                &copy; <FooterYear /> Radhey Metal Alloys LLP. All rights
                reserved.
              </div>
            </div>

            <div className="absolute -top-40 -right-40 w-96 h-96 bg-surface-muted rounded-full blur-3xl pointer-events-none"></div>
          </div>
        </div>
      </footer>
      <CookieBanner />
    </>
  );
}
