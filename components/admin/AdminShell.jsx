"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { adminConfig } from "@/config/admin";

const navigation = adminConfig.navigation;

// Sidebar nav links (desktop / tablet)
function SidebarNavLinks({ showLabel, pathname, allowedNavigation }) {
  const labeled = showLabel !== false;
  return (
    <nav
      className={
        labeled
          ? "flex-1 px-3 space-y-1 py-4"
          : "flex-1 flex flex-col items-center space-y-1 py-4 px-2"
      }
    >
      {allowedNavigation.map(({ name, href, icon: Icon }) => {
        const active = pathname === href;

        if (!labeled) {
          return (
            <Link
              key={name}
              href={href}
              title={name}
              className={[
                "flex items-center justify-center w-11 h-11 rounded-lg transition-all duration-300",
                active
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-text-muted hover:bg-surface-muted hover:text-text-primary hover:scale-110",
              ].join(" ")}
            >
              <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            </Link>
          );
        }

        return (
          <Link
            key={name}
            href={href}
            className={[
              "group flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300",
              active
                ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary hover:scale-[1.02]",
            ].join(" ")}
          >
            <Icon
              className={[
                "flex-shrink-0 h-5 w-5 transition-colors",
                active
                  ? "text-primary-foreground"
                  : "text-text-muted group-hover:text-text-primary",
              ].join(" ")}
              aria-hidden="true"
            />
            <span className="truncate">{name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarSignOut({ compact }) {
  return (
    <div
      className={
        compact
          ? "flex-shrink-0 border-t border-border-subtle py-3 flex justify-center"
          : "flex-shrink-0 border-t border-border-subtle p-3"
      }
    >
      <Link
        href="/admin/logout"
        title="Sign Out"
        className={
          compact
            ? "flex items-center justify-center w-11 h-11 rounded-lg text-text-muted hover:bg-red-50 hover:text-red-600 transition-all duration-300 hover:scale-110"
            : "group flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-text-muted hover:bg-red-50 hover:text-red-700 transition-all duration-300 hover:scale-[1.02]"
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 flex-shrink-0 transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
          />
        </svg>
        {!compact && <span>Sign Out</span>}
      </Link>
    </div>
  );
}

export default function AdminShell({ children, permissions = [] }) {
  const [tabletExpanded, setTabletExpanded] = useState(false);
  const pathname = usePathname();

  // If permissions prop is empty or not provided, fallback to all navigation items so nav is never blank
  const effectivePermissions =
    Array.isArray(permissions) && permissions.length > 0
      ? permissions
      : navigation.map((nav) => nav.permission);

  const allowedNavigation = navigation.filter((nav) =>
    effectivePermissions.includes(nav.permission),
  );

  /* ── Layout ──────────────────────────────────────────── */

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden">
      {/* ══════════════════════════════════════════════════
          DESKTOP SIDEBAR (>= lg)
          Fixed left, always visible, 288 px.
          ══════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 p-[var(--gap)]">
        <div className="flex flex-col flex-grow bg-surface/90 backdrop-blur-md border border-border-subtle rounded-[var(--outer-radius)] overflow-hidden shadow-sm">
          <div className="flex items-center flex-shrink-0 px-6 py-7 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <img src="/images/logo.png" alt="Radhey Metal Alloys" className="h-8 w-auto object-contain dark:invert" />
              <span className="text-text-muted font-medium text-xs tracking-widest uppercase mt-1">Admin</span>
            </div>
          </div>
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto hide-scrollbar">
              <SidebarNavLinks
                showLabel={true}
                pathname={pathname}
                allowedNavigation={allowedNavigation}
              />
            </div>
            <SidebarSignOut compact={false} />
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════
          TABLET SIDEBAR (md – lg)
          Collapsed icon rail (88 px) ↔ expanded (256 px).
          ══════════════════════════════════════════════════ */}
      <aside
        className={[
          "hidden md:flex lg:hidden flex-col fixed inset-y-0 left-0 z-30",
          "transition-all duration-300 ease-in-out p-[var(--gap)]",
          tabletExpanded ? "w-64" : "w-[88px]",
        ].join(" ")}
      >
        <div className="flex flex-col flex-grow bg-surface/90 backdrop-blur-md border border-border-subtle rounded-[var(--outer-radius)] overflow-hidden shadow-sm">
          <div
            className={[
              "flex items-center flex-shrink-0 border-b border-border-subtle py-6",
              tabletExpanded ? "px-5 justify-between" : "justify-center",
            ].join(" ")}
          >
            {tabletExpanded && (
              <div className="flex items-center gap-2">
                <img src="/images/logo.png" alt="Radhey" className="h-6 w-auto object-contain dark:invert" />
                <span className="text-text-muted font-medium text-[10px] tracking-widest uppercase mt-0.5">Admin</span>
              </div>
            )}
            <button
              onClick={() => setTabletExpanded((v) => !v)}
              className="flex items-center justify-center h-8 w-8 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors flex-shrink-0"
              aria-label={
                tabletExpanded ? "Collapse sidebar" : "Expand sidebar"
              }
            >
              {tabletExpanded ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto hide-scrollbar">
              <SidebarNavLinks
                showLabel={tabletExpanded}
                pathname={pathname}
                allowedNavigation={allowedNavigation}
              />
            </div>
            <SidebarSignOut compact={!tabletExpanded} />
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════
          MAIN CONTENT AREA
          ══════════════════════════════════════════════════ */}
      <div
        className={[
          "flex flex-col w-full overflow-hidden",
          // Mobile: full width, no left offset (bottom nav handles navigation)
          "pl-0",
          // Tablet: offset for icon rail or expanded sidebar
          tabletExpanded ? "md:pl-64" : "md:pl-[88px]",
          // Desktop: offset for full sidebar
          "lg:pl-72",
          // Height: full screen always (dvh for mobile)
          "h-[100dvh]",
        ].join(" ")}
      >
        {/*
          Mobile  (< md): no outer gap, no card — content fills wall-to-wall.
          Tablet+ (≥ md): outer gap re-appears, white card with border/shadow/radius.
        */}
        <main className="flex-1 w-full p-0 pb-20 md:p-[var(--gap)] overflow-hidden flex flex-col">
          <div className="w-full h-full overflow-y-auto hide-scrollbar md:bg-surface md:border md:border-border-subtle md:rounded-[var(--outer-radius)] md:shadow-sm flex flex-col">
            <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-8 py-5 md:py-8 w-full flex-1 flex flex-col min-h-0">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* ══════════════════════════════════════════════════
          MOBILE BOTTOM TAB BAR (< md)
          Fixed to bottom edge. 5 icons with labels below.
          Active item: black filled circle behind the icon.
          ══════════════════════════════════════════════════ */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-surface/90 backdrop-blur-md border-t border-border-subtle shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
        aria-label="Mobile navigation"
      >
        {/* Safe area spacer for phones with home indicator */}
        <div className="flex items-start justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {/* Navigation items */}
          {allowedNavigation.map(({ name, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={name}
                href={href}
                className="flex flex-col items-center gap-0.5 flex-1 py-1 transition-opacity active:opacity-70"
                aria-label={name}
              >
                <span
                  className={[
                    "flex items-center justify-center w-12 h-8 rounded-lg transition-all duration-200",
                    active ? "bg-primary" : "bg-transparent",
                  ].join(" ")}
                >
                  <Icon
                    className={[
                      "h-5 w-5 transition-colors duration-200",
                      active ? "text-primary-foreground" : "text-text-muted",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                </span>
                <span
                  className={[
                    "text-[10px] font-medium tracking-wide transition-colors duration-200 leading-tight",
                    active ? "text-text-primary" : "text-text-muted",
                  ].join(" ")}
                >
                  {name}
                </span>
              </Link>
            );
          })}

          {/* Logout tab */}
          <Link
            href="/admin/logout"
            className="flex flex-col items-center gap-0.5 flex-1 py-1 transition-opacity active:opacity-70"
            aria-label="Sign Out"
          >
            <span className="flex items-center justify-center w-12 h-8 rounded-lg bg-transparent hover:bg-red-50 transition-all duration-200">
              <LogOut
                className="h-5 w-5 text-text-muted hover:text-red-500 transition-colors duration-200"
                aria-hidden="true"
              />
            </span>
            <span className="text-[10px] font-medium tracking-wide text-text-muted leading-tight">
              Logout
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
