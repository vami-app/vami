import { Inter } from "next/font/google";
import { Suspense } from "react";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Smalloys - Premium Product Catalog",
  description: "Browse our premium selection of materials and products.",
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

