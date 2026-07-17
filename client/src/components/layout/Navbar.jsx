"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Logo from "./Logo";
import MobileDrawer from "./MobileDrawer";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";

/** Sticky top navigation. Collapses to a hamburger drawer below md. */
export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menus on route change
  useEffect(() => {
    setDrawerOpen(false);
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  /** @param {React.FormEvent} e */
  const onSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <button
              className="flex h-11 w-11 items-center justify-center rounded-md text-ink md:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <MenuIcon />
            </button>
            <Link href="/" aria-label="Inkwell home">
              <Logo />
            </Link>
          </div>

          {/* Desktop search */}
          <form
            onSubmit={onSearch}
            className="hidden flex-1 max-w-sm items-center rounded-full bg-gray-100 px-4 py-2 md:flex"
          >
            <SearchIcon className="h-4 w-4 text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stories and tags"
              className="ml-2 w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
            />
          </form>

          <div className="flex items-center gap-2">
            {/* Mobile search toggle */}
            <button
              className="flex h-11 w-11 items-center justify-center rounded-md text-ink md:hidden"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search"
            >
              <SearchIcon className="h-5 w-5" />
            </button>

            {user ? (
              <>
                <Link href="/new-story" className="hidden sm:block">
                  <Button variant="ghost" size="sm">
                    <PencilIcon /> Write
                  </Button>
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex h-11 w-11 items-center justify-center rounded-full"
                    aria-label="Account menu"
                  >
                    <Avatar src={user.avatarUrl} name={user.name} size="md" />
                  </button>
                  {menuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                      onMouseLeave={() => setMenuOpen(false)}
                    >
                      <MenuLink href={`/@${user.username}`}>Profile</MenuLink>
                      <MenuLink href="/new-story">Write a story</MenuLink>
                      {user.role === "admin" && (
                        <MenuLink href="/admin">Admin Dashboard</MenuLink>
                      )}
                      <MenuLink href="/bookmarks">Bookmarks</MenuLink>
                      <MenuLink href="/settings">Settings</MenuLink>
                      <button
                        onClick={handleLogout}
                        className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-gray-50"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile search bar */}
        {searchOpen && (
          <form onSubmit={onSearch} className="border-t border-gray-100 px-4 py-2 md:hidden">
            <div className="flex items-center rounded-full bg-gray-100 px-4 py-2.5">
              <SearchIcon className="h-4 w-4 text-ink-faint" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search stories and tags"
                className="ml-2 w-full bg-transparent text-sm outline-none"
              />
            </div>
          </form>
        )}
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onLogout={handleLogout} />
    </>
  );
}

/** @param {{ href: string, children: React.ReactNode }} props */
function MenuLink({ href, children }) {
  return (
    <Link href={href} className="block px-4 py-2.5 text-sm text-ink hover:bg-gray-50">
      {children}
    </Link>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}
/** @param {{ className?: string }} props */
function SearchIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}
function PencilIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
