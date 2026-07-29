# ADR 0002: Enterprise Environment & Secrets Management Architecture

- **Status:** Accepted
- **Decided By:** Vami Platform Engineering Team
- **Date:** 2026-07-29

---

## Context & Problem Statement

As our JavaScript monorepo expands to host multiple products (`apps/product-a-api`, `apps/product-a-web`, `apps/product-b-api`, `apps/product-b-web`) and modular domain services (`services/identity-service`, `services/notification-service`, `services/media-service`), managing environment variables and secrets across different environments (`local`, `development`, `staging`, `production`) presents several operational risks:

1. **Secret Leakage**: Accidental exposure of production credentials in source control or across products.
2. **Cache Poisoning**: Monorepo task runners (Nx/Turborepo) using cached development build artifacts in production builds due to missing environment hash keys.
3. **Synchronization Drift**: Discrepancies between local developer `.env` files, staging environments, and production clusters.
4. **Tight Library Coupling**: Shared libraries (`libs/shared/*`) reaching into `process.env` directly, violating modular isolation and unit testability.

---

## Decision Drivers

- **FAANG Alignment**: Adopt environment management patterns used at scale by Google, Meta, Uber, Netflix, and Shopify.
- **Fail-Fast Safety**: Prevent applications from booting in an incomplete or misconfigured environment state.
- **Zero Production `.env` Files**: Rely on workload identity / secrets managers for staging and production deployments.
- **Developer Experience (DX)**: Maintain seamless local development with zero paid dependencies via Docker Compose and `.env.development` templates.

---

## Decided Architecture: The 7 Golden Pillars

### 1. Root vs. Product Isolation Scope
- Root `.env` handles local Docker Compose container infrastructure (`POSTGRES_USER`, `REDIS_PASSWORD`, `MINIO_ROOT_USER`). It **never** contains product-level business secrets.
- Each product application and domain service maintains its own scoped `.env` definitions (`.env.example`, `.env.development`).
- Shared libraries (`libs/shared/*`) **never** access `process.env` directly. All configurations are passed in explicitly from application entrypoints.

### 2. Standard Precedence Hierarchy
Environment resolution order (highest priority overrides lowest):
1. Process Runtime / Cloud Provider / CI Secrets (`process.env`)
2. `apps/<product>/.env.<mode>.local` (Gitignored local overrides)
3. `apps/<product>/.env.<mode>` (Committed environment defaults)
4. `apps/<product>/.env.local` (Gitignored local mode overrides)
5. `apps/<product>/.env` (Committed product schema & fallbacks)
6. Root `.env` (Infra orchestration only)

### 3. Fail-Fast Boot Validation Contract (`@vami/util`)
- Line 1 of application entrypoints (`server.js` / `main.js`) imports `validateEnv()` from `@vami/util`.
- `validateEnv()` evaluates required keys, types (`string`, `number`, `boolean`, `url`), default fallbacks, and custom validators.
- If validation fails, the process immediately prints a structured, readable error and exits (`process.exit(1)`).

### 4. Nx Build Cache Hashing (`nx.json`)
- `nx.json` explicitly defines `sharedGlobals` with environment variable inputs (`NODE_ENV`, `VITE_API_BASE_URL`, `VITE_IDENTITY_URL`).
- Any change in environment variables automatically invalidates Nx task computation caches, guaranteeing target build correctness.

### 5. Production Secrets Management Lifecycle
- Local: `.env.example` committed; `.env.local` gitignored.
- Staging / Production: **Zero `.env` files deployed**. Secrets injected dynamically at container start via Secrets Manager (Doppler, Infisical, AWS Secrets Manager, GCP Secret Manager, or HashiCorp Vault).

### 6. Frontend Security Boundary
- Frontend apps (`apps/product-*-web`) expose ONLY variables explicitly prefixed with `VITE_`. Database credentials and private API keys MUST NOT carry client prefixes.

### 7. Multi-Product Generator Standard
- Scaffolded products automatically include `.env.example`, `.env.development`, and line-1 `src/config/env.js` gatekeepers.

---

## Consequences & Verification

- **Positive Impact**: Eliminates secret leaks, prevents invalid cached builds in production, enforces strict boot validation, and enables seamless multi-product scaling.
- **Verification**: Verified via Vitest unit tests in `@vami/util`, line-1 validation checks in `apps/product-a-api` and `services/identity-service`, and `nx run-many -t test,typecheck,lint`.
