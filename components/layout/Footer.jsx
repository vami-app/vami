import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer({ categories = [] }) {
  return (
    <footer className="pt-8 pb-[var(--gap)] w-full px-[var(--gap)] mt-8">
      <div className="max-w-[var(--max-width-layout)] mx-auto">
        <div className="w-full min-h-[400px] sm:min-h-[500px] rounded-[var(--outer-radius)] flex flex-col justify-between relative border border-black/5 bg-[#f9f9f9] p-6 sm:p-10 lg:p-16 overflow-hidden shadow-sm">
          
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 z-10 w-full">
            {/* Intro Text - Takes up ~40% width on Desktop */}
            <div className="lg:w-5/12 max-w-lg">
              <h3 className="font-headline text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 mb-4 sm:mb-6 tracking-tight">
                Premium quality,<br />uncompromising standards.
              </h3>
              <p className="text-gray-500 text-[var(--text-body)] leading-relaxed font-light">
                Providing the highest quality copper, bronze, and specialty sand castings for demanding manufacturing applications worldwide.
              </p>
            </div>
            
            {/* Quick Links - Takes up ~60% width on Desktop */}
            <div className="lg:w-7/12 grid grid-cols-2 gap-8 lg:justify-items-end lg:text-right">
              <div className="lg:text-left w-full max-w-[280px]">
                <h4 className="text-xs font-semibold text-gray-900 tracking-[0.2em] uppercase mb-4">Info</h4>
                <ul className="space-y-4">
                  <li>
                    <a href="mailto:sales@smalloys.com" className="flex items-center text-sm text-gray-500 hover:text-black font-light transition-colors">
                      <Mail className="flex-shrink-0 h-4 w-4 mr-3 text-gray-400" />
                      sales@smalloys.com
                    </a>
                  </li>
                  <li>
                    <a href="tel:+15551234567" className="flex items-center text-sm text-gray-500 hover:text-black font-light transition-colors">
                      <Phone className="flex-shrink-0 h-4 w-4 mr-3 text-gray-400" />
                      +1 (555) 123-4567
                    </a>
                  </li>
                  <li>
                    <div className="flex items-start text-sm text-gray-500 font-light">
                      <MapPin className="flex-shrink-0 h-4 w-4 mr-3 mt-0.5 text-gray-400" />
                      <span>123 Manufacturing Way, NY 10001</span>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="lg:text-left w-full max-w-[200px]">
                <h4 className="text-xs font-semibold text-gray-900 tracking-[0.2em] uppercase mb-4">Company</h4>
                <ul className="space-y-4">
                  <li><Link href="/products" className="text-sm text-gray-500 hover:text-black font-light transition-colors">Products</Link></li>
                  <li><Link href="/about" className="text-sm text-gray-500 hover:text-black font-light transition-colors">About</Link></li>
                  <li><Link href="/contact" className="text-sm text-gray-500 hover:text-black font-light transition-colors">Contact</Link></li>
                  <li><Link href="/certificates" className="text-sm text-gray-500 hover:text-black font-light transition-colors">Certificates</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col w-full gap-4 mt-16 sm:mt-auto z-10">
            <div 
              className="font-bold tracking-tighter text-gray-900"
              style={{ fontSize: 'clamp(3.5rem, 11vw, 10rem)', marginLeft: '-0.05em', lineHeight: '0.85' }}
            >
              Smalloys.
            </div>
            <div className="text-[10px] sm:text-xs text-gray-400 font-light text-left">
              &copy; {new Date().getFullYear()} Smalloys, Inc. All rights reserved.
            </div>
          </div>

          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gray-200/40 rounded-full blur-3xl pointer-events-none"></div>
        </div>
      </div>
    </footer>
  );
}
