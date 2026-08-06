"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { adminConfig } from "@/config/admin";
import { DesktopSidebar, TabletSidebar } from "@/components/organisms/admin-sidebar";
import { AdminMobileNav } from "@/components/organisms/admin-mobile-nav";

const navigation = adminConfig.navigation;

export function AdminShellTemplate({ children, permissions = [] }) {
  const [tabletExpanded, setTabletExpanded] = useState(false);
  const pathname = usePathname();

  const effectivePermissions =
    Array.isArray(permissions) && permissions.length > 0
      ? permissions
      : navigation.map((nav) => nav.permission);

  const allowedNavigation = navigation.filter((nav) =>
    effectivePermissions.includes(nav.permission),
  );

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden">
      <DesktopSidebar pathname={pathname} allowedNavigation={allowedNavigation} />
      
      <TabletSidebar 
        pathname={pathname} 
        allowedNavigation={allowedNavigation} 
        tabletExpanded={tabletExpanded}
        setTabletExpanded={setTabletExpanded}
      />

      <div
        className={[
          "flex flex-col w-full overflow-hidden",
          "pl-0",
          tabletExpanded ? "md:pl-64" : "md:pl-[88px]",
          "lg:pl-72",
          "h-[100dvh]",
        ].join(" ")}
      >
        <main className="flex-1 w-full p-0 pb-20 md:p-[var(--gap)] overflow-hidden flex flex-col">
          <div className="w-full h-full overflow-y-auto hide-scrollbar md:bg-surface md:border md:border-border-subtle md:rounded-[var(--outer-radius)] md:shadow-sm flex flex-col">
            <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-8 py-5 md:py-8 w-full flex-1 flex flex-col min-h-0">
              {children}
            </div>
          </div>
        </main>
      </div>

      <AdminMobileNav pathname={pathname} allowedNavigation={allowedNavigation} />
    </div>
  );
}
