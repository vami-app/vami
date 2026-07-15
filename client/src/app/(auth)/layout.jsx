import Link from "next/link";
import Logo from "@/components/layout/Logo";

/**
 * @param {{ children: React.ReactNode }} props
 */
export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-center border-b border-gray-100 py-5">
        <Link href="/" aria-label="Inkwell home">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
