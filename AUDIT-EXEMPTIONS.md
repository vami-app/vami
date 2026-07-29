# pnpm audit exemptions — documented false positives
# Each exemption must include the CVE, reason, and reviewer.
#
# Format: https://pnpm.io/package_json#pnpmauditconfig
# Used by: pnpm audit --audit-level=high
#
# ─────────────────────────────────────────────────────────────────
# GHSA-qwww-vcr4-c8h2: React Router RSC Mode CSRF Bypass
#   Package: react-router >=7.12.0 <8.3.0
#   Patched: >=8.3.0 (framework/RSC mode only)
#   Status:  NOT APPLICABLE
#   Reason:  This vulnerability affects React Server Components (RSC) mode,
#            which requires React Router framework/server mode with a full RSC
#            runtime (Remix v3 / React Router v8+).
#            apps/product-a-web is a pure client-side SPA using Vite.
#            No RSC runtime, no framework mode, no server actions.
#            The vulnerable code path (RSC action handler) is never executed.
#   Reviewed: 2026-07-29
# ─────────────────────────────────────────────────────────────────
