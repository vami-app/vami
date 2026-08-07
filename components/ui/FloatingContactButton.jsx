"use client";

import { useState } from "react";
import { Contact, X, Mail } from "lucide-react";

// Real WhatsApp brand SVG
const WhatsAppIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

export default function FloatingContactButton() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className="fixed bottom-4 sm:bottom-6 z-50 w-full pointer-events-none flex justify-center">
      <div className="w-full max-w-[var(--max-width-layout)] relative pointer-events-none">
        {/* We place it absolutely to the right side of the max-width container, matching navbar alignment */}
        <div className="absolute right-[var(--gap)] bottom-0 flex flex-col items-center gap-4 pointer-events-auto">
          {/* Menu Items - Open upwards */}
          <div
            className={`flex flex-col gap-3 transition-all duration-300 origin-bottom ${
              isOpen
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-90 translate-y-10 pointer-events-none"
            }`}
          >
            <a
              href="mailto:radhemetalalloysllp@gmail.com"
              className="group flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-surface border border-border-subtle shadow-lg hover:bg-surface-muted transition-colors relative"
              aria-label="Send Email"
              title="Send Email"
            >
              <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-text-primary" />
              <span className="absolute right-14 sm:right-16 px-3 py-1.5 bg-surface border border-border-subtle rounded-lg text-xs sm:text-sm font-medium text-text-primary shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Email Us
              </span>
            </a>

            <a
              href="https://wa.me/919081358107"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-surface border border-border-subtle shadow-lg hover:bg-surface-muted transition-colors relative"
              aria-label="WhatsApp"
              title="WhatsApp"
            >
              <WhatsAppIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              <span className="absolute right-14 sm:right-16 px-3 py-1.5 bg-surface border border-border-subtle rounded-lg text-xs sm:text-sm font-medium text-text-primary shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                WhatsApp
              </span>
            </a>
          </div>

          {/* Main FAB Toggle */}
          <button
            onClick={toggleOpen}
            className="flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-lg bg-primary text-primary-foreground shadow-xl hover:scale-105 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            aria-label="Contact options"
          >
            {isOpen ? (
              <X className="h-6 w-6 sm:h-7 sm:w-7" />
            ) : (
              <Contact className="h-6 w-6 sm:h-7 sm:w-7" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
