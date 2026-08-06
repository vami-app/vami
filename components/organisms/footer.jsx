import { Mail, Phone, MapPin } from "lucide-react";
import { siteConfig } from "@/config/site";
import { FooterYear } from "@/components/organisms/footer-year";
import { CookieBanner } from "@/components/organisms/cookie-banner";
import { Link } from "@/components/atoms/link";
import { Icon } from "@/components/atoms/icon";
import { Text } from "@/components/atoms/text";

export function Footer({ categories = [] }) {
  return (
    <>
      <footer className="pt-8 pb-[var(--gap)] w-full px-[var(--gap)] mt-8">
        <div className="max-w-[var(--max-width-layout)] mx-auto">
          <div className="w-full min-h-[400px] sm:min-h-[500px] rounded-[var(--outer-radius)] flex flex-col justify-between gap-4 sm:gap-12 relative border border-border-subtle bg-background p-6 sm:p-10 lg:p-16 overflow-hidden shadow-sm">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 z-10 w-full">
              {/* Intro Text */}
              <div className="lg:w-5/12 max-w-lg">
                <Text as="h3" variant="headline" className="mb-4 sm:mb-6 tracking-tight">
                  Premium quality,
                  <br />
                  uncompromising standards.
                </Text>
                <Text variant="body">
                  Providing the highest quality copper, brass, bronze, and
                  specialty castings for demanding manufacturing applications
                  worldwide.
                </Text>
              </div>

              {/* Quick Links */}
              <div className="lg:w-7/12 grid grid-cols-1 sm:grid-cols-2 gap-8 lg:justify-items-end lg:text-right">
                <div className="lg:text-left w-full max-w-[280px]">
                  <Text variant="eyebrow" className="mb-4">
                    Info
                  </Text>
                  <ul className="space-y-4">
                    <li>
                      <Link
                        variant="muted"
                        href="mailto:radhemetalalloysllp@gmail.com"
                        className="flex items-center text-sm font-light hover:no-underline"
                      >
                        <Icon icon={Mail} size="sm" className="mr-3" />
                        radhemetalalloysllp@gmail.com
                      </Link>
                    </li>
                    <li>
                      <Link
                        variant="muted"
                        href="tel:+919081358107"
                        className="flex items-center text-sm font-light hover:no-underline"
                      >
                        <Icon icon={Phone} size="sm" className="mr-3" />
                        +91 9081358107
                      </Link>
                    </li>
                    <li>
                      <div className="flex items-start text-sm text-text-muted font-light">
                        <Icon icon={MapPin} size="sm" className="mr-3 mt-0.5" />
                        <span>
                          43, Vardhmaan Nagar, Kalol, Gandhinagar, Gujarat,
                          India - 382721
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="lg:text-left w-full max-w-[200px]">
                  <Text variant="eyebrow" className="mb-4">
                    Company
                  </Text>
                  <ul className="space-y-4">
                    {siteConfig.footerNav.map((link) => (
                      <li key={link.title}>
                        <Link
                          variant="muted"
                          href={link.href}
                          className="text-sm font-light hover:no-underline"
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
