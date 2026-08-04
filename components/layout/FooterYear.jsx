'use client';

/**
 * FooterYear — Tiny client component to display the current year.
 *
 * Required because `cacheComponents: true` (PPR) prohibits `new Date()` in
 * Server Components without a preceding data access. The year is inherently
 * runtime data — correct place is a Client Component.
 */
export function FooterYear() {
  return <>{new Date().getFullYear()}</>;
}
