import Link from "next/link";
import Image from "next/image";
import { Mail, Phone } from "lucide-react";
import { siteConfig } from "@/config/site";
import { FooterYear } from "./FooterYear";
import CookieBanner from "./CookieBanner";

export default function Footer({ categories = [] }) {
  // Combine all unique links for a richer footer similar to Laxcon
  const allLinks = [...siteConfig.mainNav, ...siteConfig.footerNav].filter(
    (v, i, a) => a.findIndex((t) => t.title === v.title) === i,
  );

  return (
    <>
      <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)] pb-[var(--gap)] mt-16">
        <footer className="w-full bg-[#3b0404] text-black dark:text-white border border-border-subtle dark:border-red-900/30 rounded-[var(--outer-radius)] shadow-lg pt-12 pb-8 relative overflow-hidden bg-dotted-pattern">
          <div className="px-6 lg:px-12 relative z-10">
            {/* Top Section: Logo & Links */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-12 lg:gap-24 mb-16 lg:mb-24">
              {/* Logo area */}
              <div className="flex flex-col items-center lg:items-start w-full lg:w-auto">
                <Link href="/">
                  <Image
                    src="/images/logo.png"
                    alt="Radhey Metal Alloys LLP"
                    width={200}
                    height={80}
                    className="h-20 sm:h-24 w-auto object-contain"
                    style={{ width: 'auto' }}
                  />
                </Link>
              </div>

              {/* Links area - Flex wrap for all screens */}
              <div className="flex-1 w-full">
                {/* Desktop Grid View */}
                <div className="hidden lg:grid grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-8">
                  {allLinks.map((link) => (
                    <Link
                      key={link.title}
                      href={link.href}
                      className="text-sm font-semibold uppercase tracking-wider text-black/80 dark:text-gray-200 hover:text-black dark:hover:text-white transition-colors"
                    >
                      {link.title}
                    </Link>
                  ))}
                </div>

                {/* Mobile/Tablet Wrap View with Pipe separators */}
                <div className="lg:hidden flex flex-wrap justify-center items-center gap-y-4 gap-x-2 text-center">
                  {allLinks.map((link, index) => (
                    <div key={link.title} className="flex items-center">
                      <Link
                        href={link.href}
                        className="text-xs font-semibold uppercase tracking-widest text-black/80 dark:text-gray-200 hover:text-black dark:hover:text-white transition-colors"
                      >
                        {link.title}
                      </Link>
                      {index < allLinks.length - 1 && (
                        <span className="mx-2 text-black/40 dark:text-gray-600">|</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Section: Contact & Copyright */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
              {/* Contact Info */}
              <div className="flex flex-col items-center lg:items-start gap-3">
                <a
                  href="tel:+919081358107"
                  className="flex items-center text-sm text-black/80 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors font-light"
                >
                  <Phone className="h-4 w-4 mr-3" />
                  +91 - 9081358107
                </a>
                <a
                  href="mailto:radhemetalalloysllp@gmail.com"
                  className="flex items-center text-sm text-black/80 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors font-light"
                >
                  <Mail className="h-4 w-4 mr-3" />
                  radhemetalalloysllp@gmail.com
                </a>
              </div>

              {/* Copyright */}
              <div className="text-xs text-black/60 dark:text-gray-400 font-light flex flex-col lg:flex-row items-center gap-4 text-center lg:text-right">
                <span>
                  &copy; <FooterYear /> Radhey Metal Alloys LLP. All Rights
                  Reserved.
                </span>
                {/* Social icons */}
                <div className="flex gap-4 items-center">
                  <a
                    href="#"
                    className="text-black/60 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                    aria-label="LinkedIn"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="text-black/60 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                    aria-label="Twitter"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="text-black/60 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                    aria-label="Facebook"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
      <CookieBanner />
    </>
  );
}
