import { Inter } from "next/font/google";
import { Suspense } from "react";

import "./globals.css";

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { PWAProvider } from "@/components/organisms/pwa/pwa-provider";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-family-sans",
});

// ── Viewport ─────────────────────────────────────────────────────────────────
// Exported separately per Next.js 16 convention (not inside metadata object).
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // required for notch / env(safe-area-inset-*) support
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f9f9" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  // userScalable and maximumScale intentionally omitted — disabling pinch-to-zoom
  // breaks accessibility and fails Lighthouse best-practices.
};

import { getBaseUrl } from "@/modules/pwa/pwa.config.js";

// ── Metadata ─────────────────────────────────────────────────────────────────
export const metadata = {
  metadataBase: new URL(getBaseUrl()),
  manifest: "/manifest.webmanifest",
  applicationName: "Radhey Metal Alloys LLP",
  title:
    "Radhey Metal Alloys LLP | Non-Ferrous Sheet, Plate & Casting Manufacturer",
  description:
    "Radhey Metal Alloys LLP manufactures NABL certified Copper, Brass & Phosphor Bronze sheets, plates, circles, ingots, and custom castings. Contact Kevin Shah, Arth Joshi, or Aditya Joshi at +91 9081358107 for custom technical quotes. Certified Company TC & Ultrasonic reports provided.",
  keywords:
    "Radhey Metal Alloys LLP, Copper sheets, ETP C11000, DHP C12200, Brass plates, Naval Brass C464, Free-cutting brass C360, Phosphor Bronze C52100, non-ferrous ingots, copper casting, metal manufacturer Gujarat",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Radhey Alloys",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {/*
            PWAProvider must be inside <Suspense> in Next.js 16 with cacheComponents: true.
            SerwistProvider uses useState() with a window-accessing initialiser,
            which Next.js 16 classifies as "uncached dynamic data". Any such access
            outside a Suspense boundary causes a prerender error on dynamic routes.

            PWA UI (InstallPrompt, UpdateAvailable, OfflineIndicator) are all
            'use client' and render nothing on the server, so the Suspense boundary
            has no visible effect — it just satisfies the cacheComponents constraint.
          */}
          <Suspense>
            <PWAProvider>
              {children}
            </PWAProvider>
          </Suspense>
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
