"use client";

import { Link } from "@/components/atoms/link";
import { Icon } from "@/components/atoms/icon";
import { Text } from "@/components/atoms/text";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { Button } from "@/components/atoms/button";

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
      {allowedNavigation.map(({ name, href, icon: IconComp }) => {
        const active = pathname === href;

        if (!labeled) {
          return (
            <Link
              key={name}
              href={href}
              title={name}
              className={[
                "flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300",
                active
                  ? "bg-text-primary text-text-inverse shadow-md"
                  : "text-text-muted hover:bg-surface-muted hover:text-text-primary hover:scale-110",
              ].join(" ")}
            >
              <Icon icon={IconComp} size="md" className="flex-shrink-0" aria-hidden="true" />
            </Link>
          );
        }

        return (
          <Link
            key={name}
            href={href}
            className={[
              "group flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 hover:no-underline",
              active
                ? "bg-text-primary text-text-inverse shadow-md scale-[1.02]"
                : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary hover:scale-[1.02]",
            ].join(" ")}
          >
            <Icon
              icon={IconComp}
              size="md"
              className={[
                "flex-shrink-0 transition-colors",
                active
                  ? "text-text-inverse"
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
            ? "flex items-center justify-center w-11 h-11 rounded-full text-text-muted hover:bg-red-50 hover:text-red-600 transition-all duration-300 hover:scale-110"
            : "group flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-text-muted hover:bg-red-50 hover:text-red-700 transition-all duration-300 hover:scale-[1.02] hover:no-underline"
        }
      >
        <Icon icon={LogOut} size="md" className="flex-shrink-0 transition-colors" />
        {!compact && <span>Sign Out</span>}
      </Link>
    </div>
  );
}

export function DesktopSidebar({ pathname, allowedNavigation }) {
  return (
    <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 p-[var(--gap)]">
      <div className="flex flex-col flex-grow bg-surface/90 backdrop-blur-md border border-border-subtle rounded-[var(--outer-radius)] overflow-hidden shadow-sm">
        <div className="flex items-center flex-shrink-0 px-6 py-7 border-b border-border-subtle">
          <Text variant="headline" className="text-xl font-light tracking-tight">
            Smalloys
            <span className="text-text-muted font-light ml-2">Admin</span>
          </Text>
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
  );
}

export function TabletSidebar({ pathname, allowedNavigation, tabletExpanded, setTabletExpanded }) {
  return (
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
            <Text variant="headline" className="text-sm font-light tracking-tight whitespace-nowrap">
              Smalloys
              <span className="text-text-muted font-light ml-1">Admin</span>
            </Text>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTabletExpanded((v) => !v)}
            className="flex items-center justify-center h-8 w-8 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors flex-shrink-0"
            aria-label={tabletExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {tabletExpanded ? (
              <Icon icon={ChevronLeft} size="sm" />
            ) : (
              <Icon icon={ChevronRight} size="sm" />
            )}
          </Button>
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
  );
}
