import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { FooterYear } from './FooterYear';

export default function Footer({ categories = [] }) {
  return (
    <footer className="pt-8 pb-[var(--gap)] w-full px-[var(--gap)] mt-8">
      <div className="max-w-[var(--max-width-layout)] mx-auto">
        <div className="w-full min-h-[400px] sm:min-h-[500px] rounded-[var(--outer-radius)] flex flex-col justify-between relative border border-border-subtle bg-background p-6 sm:p-10 lg:p-16 overflow-hidden shadow-sm">
          
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 z-10 w-full">
            {/* Intro Text - Takes up ~40% width on Desktop */}
            <div className="lg:w-5/12 max-w-lg">
              <h3 className="font-headline text-2xl sm:text-3xl md:text-4xl font-light text-text-primary mb-4 sm:mb-6 tracking-tight">
                Premium quality,<br />uncompromising standards.
              </h3>
              <p className="text-text-muted text-[var(--text-body)] leading-relaxed font-light">
                Providing the highest quality copper, bronze, and specialty sand castings for demanding manufacturing applications worldwide.
              </p>
            </div>
            
            {/* Quick Links - Takes up ~60% width on Desktop */}
            <div className="lg:w-7/12 grid grid-cols-2 gap-8 lg:justify-items-end lg:text-right">
              <div className="lg:text-left w-full max-w-[280px]">
                <h4 className="text-xs font-semibold text-text-primary tracking-[0.2em] uppercase mb-4">Info</h4>
                <ul className="space-y-4">
                  <li>
                    <a href="mailto:sales@smalloys.com" className="flex items-center text-sm text-text-muted hover:text-text-primary font-light transition-colors">
                      <Mail className="flex-shrink-0 h-4 w-4 mr-3 text-text-muted" />
                      sales@smalloys.com
                    </a>
                  </li>
                  <li>
                    <a href="tel:+15551234567" className="flex items-center text-sm text-text-muted hover:text-text-primary font-light transition-colors">
                      <Phone className="flex-shrink-0 h-4 w-4 mr-3 text-text-muted" />
                      +1 (555) 123-4567
                    </a>
                  </li>
                  <li>
                    <div className="flex items-start text-sm text-text-muted font-light">
                      <MapPin className="flex-shrink-0 h-4 w-4 mr-3 mt-0.5 text-text-muted" />
                      <span>123 Manufacturing Way, NY 10001</span>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="lg:text-left w-full max-w-[200px]">
                <h4 className="text-xs font-semibold text-text-primary tracking-[0.2em] uppercase mb-4">Company</h4>
                <ul className="space-y-4">
                  {siteConfig.footerNav.map((link) => (
                    <li key={link.title}>
                      <Link href={link.href} className="text-sm text-text-muted hover:text-text-primary font-light transition-colors">
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col w-full gap-4 mt-16 sm:mt-auto z-10">
            <div 
              className="font-bold tracking-tighter text-text-primary"
              style={{ fontSize: 'clamp(3.5rem, 11vw, 10rem)', marginLeft: '-0.05em', lineHeight: '0.85' }}
            >
              Smalloys.
            </div>
            <div className="text-[10px] sm:text-xs text-text-muted font-light text-left">
              &copy; <FooterYear /> Smalloys, Inc. All rights reserved.
            </div>
          </div>

          <div className="absolute -top-40 -right-40 w-96 h-96 bg-surface-muted rounded-full blur-3xl pointer-events-none"></div>
        </div>
      </div>
    </footer>
  );
}
