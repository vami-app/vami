import Link from "next/link";

/** Minimal site footer. */
export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-sm text-ink-soft sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} Inkwell. A place to read and write.</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link href="/" className="hover:text-ink">Home</Link>
          <Link href="/search" className="hover:text-ink">Explore</Link>
          <a href="https://tiptap.dev" target="_blank" rel="noopener noreferrer" className="hover:text-ink">Built with Tiptap</a>
        </nav>
      </div>
    </footer>
  );
}
