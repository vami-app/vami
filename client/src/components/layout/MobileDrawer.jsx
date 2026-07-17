"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/ui/Avatar";
import Logo from "./Logo";

/**
 * Slide-in mobile navigation drawer.
 * @param {{ open: boolean, onClose: () => void, onLogout: () => void }} props
 */
export default function MobileDrawer({ open, onClose, onLogout }) {
  const { user } = useAuth();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[80%] transform bg-white shadow-xl transition-transform md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
          <Logo />
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-md text-ink"
            aria-label="Close menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {user && (
          <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-4">
            <Avatar src={user.avatarUrl} name={user.name} size="lg" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{user.name}</p>
              <p className="truncate text-sm text-ink-soft">@{user.username}</p>
            </div>
          </div>
        )}

        <nav className="flex flex-col py-2">
          <DrawerLink href="/" onClick={onClose}>Home</DrawerLink>
          {user ? (
            <>
              <DrawerLink href="/new-story" onClick={onClose}>Write a story</DrawerLink>
              {user.role === "admin" && (
                <DrawerLink href="/admin" onClick={onClose}>Admin Dashboard</DrawerLink>
              )}
              <DrawerLink href={`/@${user.username}`} onClick={onClose}>Profile</DrawerLink>
              <DrawerLink href="/bookmarks" onClick={onClose}>Bookmarks</DrawerLink>
              <DrawerLink href="/settings" onClick={onClose}>Settings</DrawerLink>
              <button
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="px-5 py-3 text-left text-[15px] text-red-600 hover:bg-gray-50"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <DrawerLink href="/login" onClick={onClose}>Sign in</DrawerLink>
              <DrawerLink href="/register" onClick={onClose}>Get started</DrawerLink>
            </>
          )}
        </nav>
      </aside>
    </>
  );
}

/** @param {{ href: string, onClick: () => void, children: React.ReactNode }} props */
function DrawerLink({ href, onClick, children }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="px-5 py-3 text-[15px] text-ink hover:bg-gray-50"
    >
      {children}
    </Link>
  );
}
