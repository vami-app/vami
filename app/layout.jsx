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
        {/*
          ThemeProvider uses useState/useEffect (client-side state) from next-themes.
          With cacheComponents: true (PPR), client-side dynamic state must be wrapped
          in Suspense so the static shell can be emitted immediately.
        */}
        <Suspense>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  );
}

