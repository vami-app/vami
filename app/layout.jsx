import { Inter } from "next/font/google";
import { Suspense } from "react";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Radhey Metal Alloys LLP | Non-Ferrous Sheet, Plate & Casting Manufacturer",
  description: "Radhey Metal Alloys LLP manufactures NABL certified Copper, Brass & Phosphor Bronze sheets, plates, circles, ingots, and custom castings. Contact Kevin Shah, Arth Joshi, or Aditya Joshi at +91 9081358107 for custom technical quotes. Certified Company TC & Ultrasonic reports provided.",
  keywords: "Radhey Metal Alloys LLP, Copper sheets, ETP C11000, DHP C12200, Brass plates, Naval Brass C464, Free-cutting brass C360, Phosphor Bronze C52100, non-ferrous ingots, copper casting, metal manufacturer Gujarat",
};

import { ThemeProvider } from "@/components/providers/ThemeProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Suspense>
            {children}
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}

