"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Client-side guard for pages that require authentication. Redirects to
 * /login?next=... while the session is missing.
 * @param {{ children: React.ReactNode }} props
 */
export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, pathname, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-ink-soft">
        Loading…
      </div>
    );
  }
  return children;
}
