import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { siteConfig } from "@/config/site";
import { FooterYear } from "./FooterYear";
import CookieBanner from "./CookieBanner";

export default function Footer({ categories = [], settings = {} }) {
  const phone = settings.contactPhone || settings.contactPhones?.[0] || '+91 - 9081358107';
  const email = settings.contactEmail || 'radhemetalalloysllp@gmail.com';
  const linkedIn = settings.linkedIn || '';
  const productLinks = [
    ...(siteConfig.footerNav.products || []),
    ...categories.slice(0, 4).map((c) => ({ title: c.name, href: `/products/${c.slug}` })),
  ];

  return (
    <>
      <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)] pb-[var(--gap)] mt-16">
        <footer className="w-full bg-[#3b0404] text-black dark:text-white border border-border-subtle dark:border-red-900/30 rounded-[var(--outer-radius)] shadow-lg pt-12 pb-8 relative overflow-hidden bg-dotted-pattern">
          <div className="px-6 lg:px-12 relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-12 lg:gap-16 mb-16">
              <div className="flex flex-col items-center lg:items-start">
                <Link href="/">
                  <img
                    src="/images/logo.png"
                    alt="Radhey Metal Alloys LLP"
                    className="h-20 sm:h-24 w-auto object-contain"
                  />
                </Link>
              </div>

              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8">
                <FooterCol title="Company" links={siteConfig.footerNav.company} />
                <FooterCol title="Products" links={productLinks} />
                <FooterCol title="Resources" links={siteConfig.footerNav.resources} />
                <FooterCol title="Legal" links={siteConfig.footerNav.legal} />
              </div>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
              <div className="flex flex-col items-center lg:items-start gap-3">
                <a
                  href={`tel:${String(phone).replace(/\s/g, '')}`}
                  className="flex items-center text-sm text-black/80 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors font-light"
                >
                  <Phone className="h-4 w-4 mr-3" />
                  {phone}
                </a>
                <a
                  href={`mailto:${email}`}
                  className="flex items-center text-sm text-black/80 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors font-light"
                >
                  <Mail className="h-4 w-4 mr-3" />
                  {email}
                </a>
              </div>

              <div className="text-xs text-black/60 dark:text-gray-400 font-light flex flex-col lg:flex-row items-center gap-4 text-center lg:text-right">
                <span>
                  &copy; <FooterYear /> Radhey Metal Alloys LLP. All Rights Reserved.
                </span>
                {linkedIn ? (
                  <a
                    href={linkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black/60 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                    aria-label="LinkedIn"
                  >
                    LinkedIn
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </footer>
      </div>
      <CookieBanner />
    </>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-gray-400 mb-4">
        {title}
      </p>
      <ul className="space-y-2">
        {(links || []).map((link) => (
          <li key={`${title}-${link.href}-${link.title}`}>
            <Link
              href={link.href}
              className="text-sm font-semibold uppercase tracking-wider text-black/80 dark:text-gray-200 hover:text-black dark:hover:text-white transition-colors"
            >
              {link.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
