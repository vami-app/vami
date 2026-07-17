import Link from "next/link";
import Logo from "@/components/layout/Logo";
import Footer from "@/components/layout/Footer";

export default function LegalLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/" aria-label="Inkwell home" className="flex items-center">
            <Logo />
          </Link>
          <Link href="/" className="text-sm font-medium text-indigo-600 hover:underline">
            Back to home
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-12">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
