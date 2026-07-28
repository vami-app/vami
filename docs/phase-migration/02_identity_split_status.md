# Vami — Migration Implementation Plan 02 (Identity Split) Status

> Status: STEP 1 & STEP 2 PASSED, AUDITED & COMMITTED

## Step Results & Evidence

### Pre-Step Fix — Workspace Test Config Isolation & Nx projectTypes
- **Root Vitest Config**: Created `vitest.config.js` at root so any package under `libs/*` or `services/*` runs tests independently without borrowing `inkwell-api` config.
- **Nx `projectType`**: Added `project.json` to `apps/inkwell-api`, `apps/inkwell-web`, `libs/shared/registry`, and `services/identity-service`.
- **Commit**: `c534cf0` (`chore(test): add root vitest.config.js and registry project.json for independent test runs`)

---

### Step 1 — Registry Primitives
- **Implementation**: Created `libs/shared/registry/service-registry.js`, `libs/shared/registry/module-registry.js`, and `libs/shared/registry/test/registry.test.js`.
- **Test Evidence**:
  - `npx vitest run libs/shared/registry`: **8 passed (8)** (5 `ServiceRegistry` tests + 3 `ModuleRegistry` tests).
- **Commit**: `812996e` (`feat(registry): Step 1 add ServiceRegistry and ModuleRegistry primitives`)
  - `git diff --stat HEAD~1` touched **only** 3 files under `libs/shared/registry/` (0 changes in `apps/`).

---

### Step 2 — Wrap-Not-Move Skeleton (`services/identity-service`)
- **Implementation**:
  - Created `services/identity-service/` (`index.js`, `package.json` `@vami/identity-service`, `project.json`).
  - Mounted `/api/auth` (with `authLimiter` restored) and `/api/users` in `apps/inkwell-api/src/app.js` using `ModuleRegistry` instance.
- **Audit Fix**:
  - Restored `authLimiter` middleware in `services/identity-service/index.js` (`app.use('/api/auth', authLimiter, authRoutes)`).
  - Cleaned up orphaned `authLimiter` import in `apps/inkwell-api/src/app.js`.
- **Test Evidence**:
  - **Vitest (`inkwell-api`)**: **28 passed / 28 passed** (13 test files passed — exact baseline match).
  - **Playwright (`inkwell-web`)**: **9 passed / 9 passed** (9 e2e specs passed — exact baseline match).
  - **Registry Unit Tests**: **8 passed / 8 passed** via root Vitest runner.
  - **Router Stack Audit**: Inspected Express router stack to verify Layer 9 (`authLimiter`) and Layer 10 (`authRoutes`) are correctly mounted in order.
- **Commits**:
  - `bc16f3e` (`feat(identity): Step 2 wrap-not-move identity service mounted via ModuleRegistry in inkwell-api`)
  - `5bdad68` (`fix(identity): restore authLimiter rate limiter middleware on /api/auth route mount`)
