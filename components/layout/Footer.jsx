import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { siteConfig } from "@/config/site";
import { FooterYear } from "./FooterYear";
import CookieBanner from "./CookieBanner";

export default function Footer({ categories = [] }) {
  return (
    <>
      <footer className="w-full bg-surface-muted border-t-4 border-primary mt-16 pt-16 pb-8 px-6 sm:px-12 lg:px-24">
        <div className="max-w-[var(--max-width-layout)] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
            
            {/* Branding Column */}
            <div className="lg:col-span-2 max-w-md">
              <h2 className="text-3xl font-bold tracking-tighter text-text-primary mb-6">
                RADHEY METAL ALLOYS.
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-8">
                Providing the highest quality copper, brass, bronze, and specialty castings for demanding manufacturing applications worldwide.
              </p>
              <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-semibold text-sm tracking-widest uppercase hover:bg-primary/90 transition-colors">
                Get In Touch
              </Link>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-bold text-text-primary uppercase tracking-widest mb-6">
                Company
              </h4>
              <ul className="space-y-3">
                {siteConfig.footerNav.map((link) => (
                  <li key={link.title}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-secondary hover:text-primary transition-colors flex items-center group"
                    >
                      <span className="w-0 h-[1px] bg-primary mr-0 group-hover:w-3 group-hover:mr-2 transition-all duration-300"></span>
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-sm font-bold text-text-primary uppercase tracking-widest mb-6">
                Contact Us
              </h4>
              <ul className="space-y-4">
                <li>
                  <a href="mailto:radhemetalalloysllp@gmail.com" className="flex items-start text-sm text-text-secondary hover:text-primary transition-colors">
                    <Mail className="h-5 w-5 mr-3 mt-0.5 text-primary" />
                    <span>radhemetalalloysllp@gmail.com</span>
                  </a>
                </li>
                <li>
                  <a href="tel:+919081358107" className="flex items-start text-sm text-text-secondary hover:text-primary transition-colors">
                    <Phone className="h-5 w-5 mr-3 mt-0.5 text-primary" />
                    <span>+91 9081358107</span>
                  </a>
                </li>
                <li>
                  <div className="flex items-start text-sm text-text-secondary">
                    <MapPin className="h-5 w-5 mr-3 mt-0.5 text-primary shrink-0" />
                    <span>43, Vardhmaan Nagar, Kalol, Gandhinagar, Gujarat, India - 382721</span>
                  </div>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border-base flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs text-text-muted">
              &copy; <FooterYear /> Radhey Metal Alloys LLP. All rights reserved.
            </div>
            <div className="flex space-x-4">
              <Link href="/privacy" className="text-xs text-text-muted hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-xs text-text-muted hover:text-primary transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
      <CookieBanner />
    </>
  );
}
