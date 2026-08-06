"use client";

import { Link } from "@/components/atoms/link";
import { Icon } from "@/components/atoms/icon";
import { LogOut } from "lucide-react";

export function AdminMobileNav({ pathname, allowedNavigation }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-surface/90 backdrop-blur-md border-t border-border-subtle shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
      aria-label="Mobile navigation"
    >
      <div className="flex items-start justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {/* Navigation items */}
        {allowedNavigation.map(({ name, href, icon: IconComp }) => {
          const active = pathname === href;
          return (
            <Link
              key={name}
              href={href}
              className="flex flex-col items-center gap-0.5 flex-1 py-1 transition-opacity active:opacity-70 hover:no-underline"
              aria-label={name}
            >
              <span
                className={[
                  "flex items-center justify-center w-12 h-8 rounded-full transition-all duration-200",
                  active ? "bg-text-primary" : "bg-transparent",
                ].join(" ")}
              >
                <Icon
                  icon={IconComp}
                  size="md"
                  className={[
                    "transition-colors duration-200",
                    active ? "text-text-inverse" : "text-text-muted",
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
          className="flex flex-col items-center gap-0.5 flex-1 py-1 transition-opacity active:opacity-70 hover:no-underline"
          aria-label="Sign Out"
        >
          <span className="flex items-center justify-center w-12 h-8 rounded-full bg-transparent hover:bg-red-50 transition-all duration-200">
            <Icon
              icon={LogOut}
              size="md"
              className="text-text-muted hover:text-red-500 transition-colors duration-200"
              aria-hidden="true"
            />
          </span>
          <span className="text-[10px] font-medium tracking-wide text-text-muted leading-tight">
            Logout
          </span>
        </Link>
      </div>
    </nav>
  );
}
