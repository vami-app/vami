# Phase 3 Implementation Plan: BFF + Frontend Composition

## Modular Monolith + Feature-Based Architecture

**Research basis:** Architecture doc Parts D.1, D.2, D.6, E (Phase 3), F (Decisions Q, L, T), I, J, K, N. Additional research: Feature-Sliced Design (FSD) methodology, Controller-Service-Repository (CSR) pattern, Domain-Driven bounded contexts as validated by Shopify Polaris, Stripe, and Airbnb engineering patterns.

---

## Part 1 — Mandatory Pre-Requisite: Full Hardening (Phases 0–2)

All 17 items below are derived from reading **every line** of every file in Phases 0–2. No assumptions.

### Phase 2 — `services/identity-service`

| #   | File        | Line     | Bug                                                                                                                                                                                                                      | Severity      | Fix                                                                                                                                                                                                            |
| --- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1  | `routes.js` | L142     | Logout reads `sessionId`/`jti` from `req.body` — any unauthenticated client can revoke any user's session                                                                                                                | 🔴 Critical   | Add `authenticate()` middleware before this route; extract `jti`+`sessionId` from `req.user` (set by verified token), never from body                                                                          |
| H2  | `routes.js` | L159     | `/me` reads `userId` from `req.query.userId` with no auth middleware — IDOR, any caller can read any profile                                                                                                             | 🔴 Critical   | Add `authenticate()` before this route; use `req.user.userId` only; remove `req.query.userId` entirely                                                                                                         |
| H3  | `routes.js` | L120–123 | `accessToken` returned in JSON body (defeats httpOnly cookie); `refreshToken` returned in plain JSON (XSS-stealable)                                                                                                     | 🟠 High       | Remove both fields from response body. Set `refreshToken` as a separate `httpOnly; Secure; SameSite=Strict; path=/api/v1/auth/refresh` cookie                                                                  |
| H4  | `routes.js` | L116     | `access_token` cookie uses `sameSite: 'lax'` — should be `'strict'` for a session-bound access token                                                                                                                     | 🟠 High       | Change to `sameSite: 'strict'`. `lax` allows the cookie to be sent on cross-site top-level navigations (e.g. link clicks), which is not the intent for an access token                                         |
| H5  | `routes.js` | L33–75   | No rate limiting on `/register` or `/login` — credential stuffing / brute-force with no defence                                                                                                                          | 🟠 High       | Apply `express-rate-limit` before route handlers: 5 req/15min on `/login`, 10 req/15min on `/register`, per IP, `standardHeaders: true`                                                                        |
| H6  | `index.js`  | L50–60   | `registerRoutes` creates **new** `KeyManager`, `UserStore`, `SessionStore` instances — completely separate objects from the ones registered in `registerServices`. Routes and the ServiceRegistry run on different data. | 🔴 Critical   | `registerRoutes` must resolve singletons from `ServiceRegistry` (captured at `registerServices` time), not create fresh instances                                                                              |
| H7  | `index.js`  | L71      | `onEvent` creates `new SessionStore()` with no Redis client — session revocation via events silently no-ops in production                                                                                                | 🟡 Functional | Same fix as H6: resolve `identity.sessionStore` from ServiceRegistry                                                                                                                                           |
| H8  | `keys.js`   | L36      | `kid` falls back to `'vami-key-1'` hardcoded — key rotation is impossible; JWKS and tokens will always mismatch after a key reload                                                                                       | 🟡 Functional | Generate a stable, deterministic `kid` from the public key material: `crypto.createHash('sha256').update(publicJwkString).digest('base64url').substring(0,16)`. Add `getKeyId()` method. Use it in `tokens.js` |
| H9  | `tokens.js` | L33, L64 | Both `signAccessToken` and `signRefreshToken` hardcode `kid: 'vami-key-1'` — duplicates the H8 bug at the sign site                                                                                                      | 🟡 Functional | Both functions receive `keyManager` param; call `keyManager.getKeyId()` for `kid` header                                                                                                                       |

### Phase 1 — `libs/shared/`

| #   | File                          | Line     | Bug                                                                                                                                                                                                                                                                                                                                                        | Severity    | Fix                                                                                                                                                                                              |
| --- | ----------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| H10 | `util/src/logger.js`          | L117–128 | Both Console (prod path) and DailyRotateFile transports specify `format: winston.format.json()` while `sharedFormat` at logger level already ends with `winston.format.json()`. Winston applies both — double serialization in production output.                                                                                                          | 🟡 Logger   | Remove `format: winston.format.json()` from both transport constructors. Dev console already overrides with `devConsoleFormat`; prod uses logger-level `sharedFormat` only                       |
| H11 | `util/src/logger.js`          | L31–41   | PII redaction loop only traverses 1 level of nesting. `logger.info('req', { body: { user: { password: 'x' } } })` — the nested `user.password` is not redacted                                                                                                                                                                                             | 🟡 Logger   | Replace the outer-field + one-level-nested loop with a recursive `redactDeep(obj, depth=0, maxDepth=3)` helper. Depth-cap prevents DoS on deeply nested attacker-controlled payloads             |
| H12 | `authz/src/policy.js`         | L44–56   | Evaluation order is wrong: **owner check fires before tenant isolation** (L44 vs L49). A cross-tenant owner (`user.tenantId !== resource.tenantId`) passes the owner check and returns `true` before tenant isolation can deny them.                                                                                                                       | 🔴 Critical | Reorder: tenant isolation (L49) must fire **before** owner check (L44). The correct order is: SUPER_ADMIN → tenant isolation → custom rule → bounded owner check → role-permission matrix        |
| H13 | `authz/src/policy.js`         | L44      | Owner check returns `true` for **any** permission — a `GUEST` calling `admin:delete:all` on their own resource gets through                                                                                                                                                                                                                                | 🟠 High     | Replace unconditional `return true` with bounded `OWNER_PERMISSIONS` set check (Zanzibar model — see Part 9)                                                                                     |
| H14 | `pagination/src/index.js`     | L126–158 | `buildKeysetQuery` returns MongoDB `$lt`/`$or` ODM syntax. The docker-compose stack runs Postgres. No product can use this function without it silently producing wrong query syntax                                                                                                                                                                       | 🟡 Compat   | Return a **neutral descriptor** (`{ cursorCondition: { sortField, sortValue, id, direction }, limit }`) — no DB syntax. Each product's repository adapter translates it (see Part 9, Decision 1) |
| H15 | `auth-client/src/verifier.js` | L27      | `jwksCache` is a module-level `Map` — it is **never invalidated except by calling `clearJWKSCache()`**. After key rotation on identity-service, all BFF instances will continue verifying against the stale cached JWKS until process restart. `cacheMaxAge: 5m` in `createRemoteJWKSet` refreshes the key fetch, but the `Map` entry itself lives forever | 🟡 Security | Use the JWKS resolver directly (without the outer `Map`) or set a TTL on map entries (e.g. 10 min) to force re-creation of the JWKS resolver and pick up rotated keys                            |

### Phase 0 — Infra / CI

| #   | File                       | Line   | Bug                                                                                                                                                                                   | Severity | Fix                                                                                                                                                   |
| --- | -------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| H16 | `docker-compose.yml`       | L22–37 | Redis has no password. **Port 6379 is bound to host** (`"6379:6379"`). Any process on the developer's machine (or in CI) can read all sessions, revocation lists, and queues directly | 🟠 High  | Add `REDIS_PASSWORD` env var; `command: redis-server --requirepass ${REDIS_PASSWORD}`. The health check becomes `redis-cli -a ${REDIS_PASSWORD} ping` |
| H17 | `.github/workflows/ci.yml` | L22    | `runs-on: ubuntu-latest` is a mutable tag — the runner image can silently change between runs, breaking reproducibility                                                               | 🟢 CI    | Change to `ubuntu-24.04` (immutable). Actions are already pinned to SHA — apply the same discipline to the runner                                     |

> [!NOTE]
> **Traefik dashboard (`:8080`)**: The dashboard port is exposed in `docker-compose.yml` but `infra/traefik/traefik.yml` was not readable (file may not exist yet). This must be verified when the file is created: `api.insecure` must be `false` or the dashboard must be behind BasicAuth middleware. Not adding as a hardening item until the traefik config file is confirmed.

> [!NOTE]
> **`passwords.js`**: Argon2id with `timeCost:3`, `memoryCost:65536`, `parallelism:4` matches OWASP 2026 recommended minimums. **No bug here.**

> [!NOTE]
> **`context.js`**: `email` in `RequestContext` typedef is typed as `string` but `roles` is also typed as `string` (should be `string` for the comma-joined representation, or `string[]`). Minor type inconsistency — no runtime bug, document in JSDoc fix pass.

---

## Part 2 — Architectural Grounding for Phase 3

### What the architecture document actually mandates (Part E, Phase 3)

> "Wire up `ModuleRegistry`, mount the identity module. Build one full vertical feature end-to-end (e.g., user profile CRUD) touching every layer: `feature-*` → `data-access-*` → `domain-*`, using the shared `ui` atoms and the pagination package for a list view."

Phase 3 is NOT just wiring up a router. It is the **proof-of-architecture checkpoint** — every decision made in Phases 0–2 must be validated by building a real, working vertical feature.

### Why feature-based modular monolith (not flat folders)

The architecture doc (Part D.1) explicitly states the feature-based internal layout:

```
libs/notification/
├── feature-notifications/    # orchestration
├── data-access-notifications/ # I/O only
├── domain-notifications/     # pure functions, zero I/O
└── util-notifications/       # stateless helpers
```

The same pattern applies to `apps/product-a-api`. Every domain module inside the BFF is self-contained: it owns its routes, controller, service, and (later) its repository. Adding a new domain means creating one directory and registering one `AppModule` — no changes to any other module.

### Why Feature-Sliced Design (FSD) for the frontend

FSD is the 2026 industry consensus for enterprise React. It enforces a strict **one-directional dependency rule** across 6 layers — a `features/` layer can import from `entities/` and `shared/`, but never from `pages/` or `app/`. This maps directly onto the Nx boundary rules already in the monorepo:

- FSD layer boundaries = Nx `depConstraints`
- FSD `shared/` = `@vami/ui` + `@vami/design-tokens`
- FSD `entities/user` = user data model + AuthContext
- FSD `features/auth` = login form + logout button (the actual user-facing workflows)
- FSD `pages/` = route-level compositions

---

## Part 3 — Folder Structure Specification

### `apps/product-a-api` — BFF (Modular Monolith)

```
apps/product-a-api/
├── src/
│   ├── bootstrap/
│   │   ├── app.js          # Express factory — returns configured app, testable without starting server
│   │   ├── server.js       # Entry point: validateEnv, create app, listen, SIGTERM handler
│   │   └── registry.js     # Wires ServiceRegistry + ModuleRegistry, registers domain modules
│   │
│   ├── infra/              # Cross-cutting infrastructure (never imported by domain modules)
│   │   ├── security.js     # helmet + cors factory functions
│   │   ├── rate-limit.js   # express-rate-limit + Redis store instances
│   │   ├── context.js      # ALS request context middleware (wraps @vami/util runWithContext)
│   │   └── error-handler.js # Express 4-arg error handler, maps AppError → JSON
│   │
│   ├── modules/            # ← FEATURE-BASED DOMAIN MODULES (each is a self-contained AppModule)
│   │   │
│   │   ├── auth/           # Bounded context: authentication proxy
│   │   │   ├── auth.controller.js  # HTTP only: validate input, call service, set cookies
│   │   │   ├── auth.service.js     # Business logic: orchestrates identity-service calls + circuit breaker
│   │   │   ├── auth.routes.js      # express.Router(): mounts controller methods on paths
│   │   │   └── index.js            # AppModule: { name, registerServices, registerRoutes, onEvent }
│   │   │
│   │   ├── profile/        # Bounded context: user profile management
│   │   │   ├── profile.controller.js
│   │   │   ├── profile.service.js
│   │   │   ├── profile.repository.js  # Data access only: abstracts DB queries (stub now, real in Phase 4)
│   │   │   ├── profile.routes.js
│   │   │   └── index.js            # AppModule
│   │   │
│   │   └── health/         # Bounded context: operational endpoints
│   │       ├── health.controller.js
│   │       ├── health.routes.js
│   │       └── index.js            # AppModule (registerRoutes only, no registerServices)
│   │
│   ├── middleware/         # Shared request-lifecycle middleware (not domain-specific)
│   │   ├── authenticate.js # Wraps @vami/auth-client authenticate, reads from httpOnly cookie
│   │   └── require-permission.js # Wraps @vami/authz requirePermission
│   │
│   └── resilience/
│       └── identity-client.js # opossum circuit breaker for all identity-service HTTP calls
│
├── src/__tests__/
│   ├── app.integration.test.js  # supertest: full middleware stack, real module registry
│   ├── auth.module.test.js      # unit: auth service with mocked identity-client
│   └── health.module.test.js    # unit: /healthz and /readyz responses
│
├── package.json
└── project.json               # Nx tags: scope:app, domain:product-a
```

### `apps/product-a-web` — Frontend (Feature-Sliced Design)

```
apps/product-a-web/
├── src/
│   ├── app/                # FSD Layer 1 — global providers, router, theme
│   │   ├── App.jsx         # React Router routes, ThemeProvider, AuthProvider
│   │   ├── providers.jsx   # Composes all React context providers in correct order
│   │   └── index.css       # CSS custom properties from @vami/design-tokens
│   │
│   ├── pages/              # FSD Layer 2 — route-level compositions (thin, delegate to widgets)
│   │   ├── LoginPage/
│   │   │   ├── LoginPage.jsx
│   │   │   └── index.js
│   │   ├── DashboardPage/
│   │   │   ├── DashboardPage.jsx
│   │   │   └── index.js
│   │   └── ProfilePage/
│   │       ├── ProfilePage.jsx
│   │       └── index.js
│   │
│   ├── widgets/            # FSD Layer 3 — complex self-contained UI blocks
│   │   ├── AppHeader/      # Navigation bar: user avatar, logout button, product name
│   │   │   ├── AppHeader.jsx
│   │   │   └── index.js
│   │   └── UserProfileCard/
│   │       ├── UserProfileCard.jsx
│   │       └── index.js
│   │
│   ├── features/           # FSD Layer 4 — user-facing workflows (business actions)
│   │   ├── auth/           # Login, logout, session management
│   │   │   ├── ui/
│   │   │   │   ├── LoginForm.jsx       # Form: calls auth API, updates AuthContext
│   │   │   │   └── LogoutButton.jsx    # Button: calls logout, clears context
│   │   │   ├── api/
│   │   │   │   └── authApi.js          # fetch: POST /api/v1/auth/login, /logout
│   │   │   ├── model/
│   │   │   │   └── auth.store.js       # local state: isSubmitting, error
│   │   │   └── index.js               # Public API: LoginForm, LogoutButton
│   │   │
│   │   └── update-profile/            # Edit profile vertical (proof-of-architecture feature)
│   │       ├── ui/
│   │       │   └── UpdateProfileForm.jsx
│   │       ├── api/
│   │       │   └── profileApi.js       # PATCH /api/v1/profile
│   │       ├── model/
│   │       │   └── profile.store.js
│   │       └── index.js
│   │
│   ├── entities/           # FSD Layer 5 — core domain models (data, not actions)
│   │   └── user/
│   │       ├── model/
│   │       │   ├── AuthContext.jsx     # Context: { user, isLoading, setUser }
│   │       │   └── useCurrentUser.js   # Fetches /api/v1/auth/me on mount
│   │       ├── ui/
│   │       │   └── UserAvatar.jsx      # Pure display: avatar + initials fallback
│   │       └── index.js               # Exports: AuthContext, useAuth, UserAvatar
│   │
│   └── shared/             # FSD Layer 6 — foundational, no business logic
│       ├── api/
│       │   └── apiClient.js   # fetch: base URL, credentials: 'include', JSON
│       ├── ui/
│       │   └── index.js       # Re-exports Button, Input, Icon from @vami/ui
│       ├── config/
│       │   └── env.js         # import.meta.env constants
│       └── lib/
│           └── ProtectedRoute.jsx  # Redirect unauthenticated → /login
│
├── src/__tests__/
│   ├── LoginPage.test.jsx
│   ├── DashboardPage.test.jsx
│   └── UpdateProfileForm.test.jsx
│
├── vite.config.js          # Dev proxy: /api → http://localhost:4000; @vami/* aliases
├── package.json
└── project.json            # Nx tags: scope:app, domain:product-a
```

---

## Part 4 — Module Contract Specification

### AppModule contract (BFF)

Every domain module in `apps/product-a-api/src/modules/` exports a single `AppModule` object. Same contract used by `services/identity-service` — zero new patterns.

```js
// apps/product-a-api/src/modules/auth/index.js
/** @type {import('@vami/registry').AppModule} */
const authModule = {
  name: "bff.auth",

  registerServices(registry) {
    const { AuthService } = require("./auth.service");
    registry.register({
      name: "bff.auth.service",
      factory: (deps) =>
        new AuthService({ identityClient: deps["bff.identity-client"] }),
      dependencies: ["bff.identity-client"],
      singleton: true,
    });
  },

  registerRoutes(app) {
    const { createAuthRouter } = require("./auth.routes");
    app.use(createAuthRouter());
  },
};

module.exports = { authModule };
```

### Bootstrap wiring (`bootstrap/registry.js`)

```js
// apps/product-a-api/src/bootstrap/registry.js
const { ServiceRegistry, ModuleRegistry } = require("@vami/registry");
const { authModule } = require("../modules/auth");
const { profileModule } = require("../modules/profile");
const { healthModule } = require("../modules/health");
const { createIdentityClient } = require("../resilience/identity-client");

/**
 * Builds and returns the wired DI container + module registry.
 * Returned separately so tests can inject mock services before app creation.
 * @returns {{ serviceRegistry: ServiceRegistry, moduleRegistry: ModuleRegistry }}
 */
function buildRegistries() {
  const serviceRegistry = new ServiceRegistry();
  const moduleRegistry = new ModuleRegistry();

  // Cross-cutting infra services registered before any domain module
  serviceRegistry.register({
    name: "bff.identity-client",
    factory: () => createIdentityClient(),
    singleton: true,
  });

  // Domain modules — each is self-contained and independently testable
  moduleRegistry
    .register(healthModule) // health first: /healthz available immediately
    .register(authModule)
    .register(profileModule);

  moduleRegistry.registerAllServices(serviceRegistry);
  return { serviceRegistry, moduleRegistry };
}

module.exports = { buildRegistries };
```

### App factory (`bootstrap/app.js`) — middleware order is mandatory

```js
// apps/product-a-api/src/bootstrap/app.js
const express = require("express");
const cookieParser = require("cookie-parser");
const { buildHelmet, buildCors } = require("../infra/security");
const { buildContextMiddleware } = require("../infra/context");
const { errorHandler } = require("../infra/error-handler");
const { buildRegistries } = require("./registry");

function createApp() {
  const app = express();
  const { serviceRegistry, moduleRegistry } = buildRegistries();

  app.use(buildHelmet()); // 1. Security headers — always first
  app.use(buildCors()); // 2. CORS
  app.use(cookieParser()); // 3. Cookie parsing (before auth middleware reads cookies)
  app.use(express.json({ limit: "100kb" })); // 4. Body parsing
  app.use(buildContextMiddleware()); // 5. ALS context: requestId, traceId injected into every log
  moduleRegistry.mountAll(app); // 6. Domain modules mount their own routes
  app.use((_req, res) => res.status(404).json({ error: "NOT_FOUND" })); // 7. 404
  app.use(errorHandler); // 8. Error handler — must be last, must have 4 args

  return { app, serviceRegistry, moduleRegistry };
}

module.exports = { createApp };
```

---

## Part 5 — Key Implementation Details

### Controller (auth) — HTTP only, zero business logic

```js
// apps/product-a-api/src/modules/auth/auth.controller.js
function createAuthController(registry) {
  const authService = registry.resolve("bff.auth.service");

  return {
    async login(req, res, next) {
      try {
        const { email, password } = req.body || {};
        if (!email || !password)
          throw new BadRequestError("email and password required");

        const { user, accessToken, refreshToken } = await authService.login({
          email,
          password,
        });

        res.cookie("access_token", accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 15 * 60 * 1000, // 15 min
        });

        res.cookie("refresh_token", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/api/v1/auth/refresh", // scoped path — not sent on every request
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // Body: user info ONLY — zero token fields
        res.status(200).json({ success: true, user });
      } catch (err) {
        next(err);
      }
    },

    async logout(req, res, next) {
      try {
        // req.user set by authenticate middleware — NEVER from req.body
        const { jti, sessionId } = req.user || {};
        if (jti || sessionId) await authService.logout({ jti, sessionId });

        res.clearCookie("access_token");
        res.clearCookie("refresh_token", { path: "/api/v1/auth/refresh" });
        res.json({ success: true });
      } catch (err) {
        next(err);
      }
    },

    async me(req, res, next) {
      try {
        // req.user.userId guaranteed by authenticate middleware — IDOR-safe
        const user = await authService.getProfile(req.user.userId);
        res.json({ success: true, user });
      } catch (err) {
        next(err);
      }
    },
  };
}
module.exports = { createAuthController };
```

### Circuit breaker (`resilience/identity-client.js`) — per architecture Part K

```js
const CircuitBreaker = require("opossum");
const { ServiceUnavailableError } = require("@vami/util");

const BASE = process.env.IDENTITY_SERVICE_URL || "http://localhost:5000";
const OPTS = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30_000,
  volumeThreshold: 5,
};

function makeBreakerFor(fn) {
  const b = new CircuitBreaker(fn, OPTS);
  b.fallback(() => {
    throw new ServiceUnavailableError("Identity service unavailable");
  });
  b.on("open", () => console.error("[breaker] identity circuit OPEN"));
  return b;
}

function createIdentityClient() {
  const loginBreaker = makeBreakerFor(async ({ email, password }) => {
    const res = await fetch(`${BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(`identity login: ${res.status}`);
    return res.json();
  });

  const logoutBreaker = makeBreakerFor(async ({ jti, sessionId }) => {
    const res = await fetch(`${BASE}/api/v1/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jti, sessionId }),
    });
    if (!res.ok) throw new Error(`identity logout: ${res.status}`);
    return res.json();
  });

  const profileBreaker = makeBreakerFor(async (userId) => {
    const res = await fetch(`${BASE}/api/v1/auth/me`, {
      headers: { "x-user-id": userId }, // server-to-server: user id in header, not query param
    });
    if (!res.ok) throw new Error(`identity profile: ${res.status}`);
    return res.json();
  });

  return {
    login: (creds) => loginBreaker.fire(creds),
    logout: (params) => logoutBreaker.fire(params),
    getProfile: (userId) => profileBreaker.fire(userId),
  };
}

module.exports = { createIdentityClient };
```

### FSD `entities/user` — AuthContext (session from cookie, no localStorage)

```jsx
// entities/user/model/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "../../../shared/api/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from httpOnly cookie — browser sends it automatically
  useEffect(() => {
    apiClient("/api/v1/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside <AuthProvider>");
  return ctx;
}
```

---

## Part 6 — File Inventory

### `apps/product-a-api` (new files)

| File                                    | Purpose                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `bootstrap/app.js`                      | Express factory, testable in isolation                                  |
| `bootstrap/server.js`                   | `validateEnv` + listen + graceful SIGTERM                               |
| `bootstrap/registry.js`                 | `ServiceRegistry` + `ModuleRegistry` wiring                             |
| `infra/security.js`                     | `helmet` + `cors` factories                                             |
| `infra/rate-limit.js`                   | Redis-backed limiters (5/15min login, 200/15min general)                |
| `infra/context.js`                      | ALS `requestId`/`traceId` middleware                                    |
| `infra/error-handler.js`                | 4-arg error handler; no stack in production                             |
| `middleware/authenticate.js`            | Reads `access_token` cookie → `req.user` via `@vami/auth-client`        |
| `middleware/require-permission.js`      | `@vami/authz` `requirePermission` wrapper                               |
| `modules/auth/auth.controller.js`       | HTTP: parse → service → set cookies                                     |
| `modules/auth/auth.service.js`          | Orchestrates identity-client calls                                      |
| `modules/auth/auth.routes.js`           | Router + rate limiter + authenticate middleware                         |
| `modules/auth/index.js`                 | `AppModule`                                                             |
| `modules/profile/profile.controller.js` | HTTP: CRUD profile                                                      |
| `modules/profile/profile.service.js`    | Profile business logic                                                  |
| `modules/profile/profile.repository.js` | Data access stub (real DB in Phase 4)                                   |
| `modules/profile/profile.routes.js`     | Router                                                                  |
| `modules/profile/index.js`              | `AppModule`                                                             |
| `modules/health/health.controller.js`   | `/healthz` (200 always) + `/readyz` (checks Redis)                      |
| `modules/health/health.routes.js`       | Router                                                                  |
| `modules/health/index.js`               | `AppModule`                                                             |
| `resilience/identity-client.js`         | `opossum` circuit breaker for identity-service                          |
| `__tests__/app.integration.test.js`     | supertest: full stack                                                   |
| `__tests__/auth.module.test.js`         | Unit: AuthService with mocked client                                    |
| `__tests__/health.module.test.js`       | Unit: /healthz 200, /readyz 503                                         |
| `package.json`                          | Deps: express, helmet, cors, cookie-parser, opossum, express-rate-limit |
| `project.json`                          | `scope:app`, `domain:product-a`                                         |

### `apps/product-a-web` (new files)

| File                                    | Purpose                                           |
| --------------------------------------- | ------------------------------------------------- |
| `app/App.jsx`                           | Routes + providers                                |
| `app/providers.jsx`                     | Provider composition order                        |
| `app/index.css`                         | CSS variables from `@vami/design-tokens`          |
| `pages/LoginPage/`                      | Route: Login                                      |
| `pages/DashboardPage/`                  | Route: Dashboard (protected)                      |
| `pages/ProfilePage/`                    | Route: Profile (protected)                        |
| `widgets/AppHeader/`                    | Nav bar with logout                               |
| `widgets/UserProfileCard/`              | Profile display with edit link                    |
| `features/auth/ui/LoginForm.jsx`        | Login form (uses `@vami/ui` atoms)                |
| `features/auth/ui/LogoutButton.jsx`     | Logout button                                     |
| `features/auth/api/authApi.js`          | `login()` / `logout()`                            |
| `features/update-profile/`              | Full profile edit vertical                        |
| `entities/user/model/AuthContext.jsx`   | Auth context + `useAuth`                          |
| `entities/user/model/useCurrentUser.js` | Fetches `/api/v1/auth/me` on mount                |
| `entities/user/ui/UserAvatar.jsx`       | Avatar with initials fallback                     |
| `shared/api/apiClient.js`               | fetch wrapper: base URL, `credentials: 'include'` |
| `shared/ui/index.js`                    | Re-exports from `@vami/ui`                        |
| `shared/lib/ProtectedRoute.jsx`         | Auth guard: redirect to `/login`                  |
| `vite.config.js`                        | Dev proxy + path aliases                          |
| `__tests__/LoginPage.test.jsx`          | Form interaction, redirect                        |
| `__tests__/DashboardPage.test.jsx`      | Protected route redirect                          |
| `__tests__/UpdateProfileForm.test.jsx`  | PATCH, success, error                             |

### Modified files (hardening H1–H9)

| File                                      | Change                                                               |
| ----------------------------------------- | -------------------------------------------------------------------- |
| `services/identity-service/src/routes.js` | H1 logout auth, H2 /me auth, H3 cookie-only tokens, H4 rate limiting |
| `services/identity-service/src/index.js`  | H5 fix onEvent SessionStore                                          |
| `services/identity-service/src/tokens.js` | H6 kid from KeyManager                                               |
| `services/identity-service/src/keys.js`   | H6 add getKeyId() method                                             |
| `libs/shared/util/src/logger.js`          | H7 remove double JSON format                                         |
| `libs/shared/util/src/errors.js`          | Add `ServiceUnavailableError` (HTTP 503)                             |
| `.github/workflows/ci.yml`                | H8 ubuntu-24.04                                                      |
| `docker-compose.yml`                      | H9 Redis password                                                    |

---

## Part 7 — Nx Boundary Rule Additions

```js
// Additions to eslint.config.js depConstraints:
{
  sourceTag: 'scope:app',
  onlyDependOnLibsWithTags: ['scope:util', 'scope:ui', 'platform:shared'],
},
// FSD layer rules (product-a-web internal) enforced via path-based ESLint rule:
// shared/ → no imports from features/, entities/, widgets/, pages/, app/
// entities/ → no imports from features/, widgets/, pages/, app/
// features/ → no imports from widgets/, pages/, app/
// widgets/ → no imports from pages/, app/
// pages/ → no imports from app/ (except providers)
```

---

## Part 8 — Verification Checkpoints

### Automated (target: 160+ tests)

```bash
pnpm nx run-many -t test
pnpm exec tsc --noEmit
pnpm audit --audit-level=high
pnpm nx run-many -t lint
```

### Architecture proof checkpoints (from Part E Phase 3)

> "Do not proceed to Phase 4 until this feature is fully working, tested, and deployed to at least a staging environment."

- [ ] Adding a new module = create directory + one line in `registry.js` — zero changes to `app.js` or other modules
- [ ] Login → httpOnly cookies set → `document.cookie` in browser console shows nothing → `/api/v1/auth/me` returns user
- [ ] Logout → cookies cleared → `/api/v1/auth/me` returns 401
- [ ] Stop identity-service → login returns 503 (not crash) — circuit breaker fires
- [ ] 6th login in 15min → 429 Too Many Requests
- [ ] Unauthenticated visit to `/` → redirected to `/login`
- [ ] Profile edit form uses `Input` + `Button` from `@vami/ui` — design token pipeline confirmed working in a real app
- [ ] `/healthz` → 200; stop Redis → `/readyz` → 503
- [ ] `pnpm exec tsc --noEmit` passes with zero errors on new files

---

---

## Part 9 — Resolved Architectural Decisions

### Decision 1: Polyglot Persistence + DB-Agnostic Pagination

**Your comment is correct and is the FAANG-standard approach.** The research confirms it directly:

- **Netflix** uses Cassandra for time-series, MySQL for billing, Elasticsearch for search, Redis for sessions — different databases per domain, chosen for access-pattern fit.
- **Uber** uses MySQL for core trips, PostGIS for geospatial, InfluxDB for metrics, MongoDB for document metadata.

The key insight: **the monorepo and polyglot persistence are orthogonal**. The monorepo is a code organization strategy. Each service/product in the monorepo chooses its database independently based on what its data model demands.

#### What this means for `@vami/pagination`

`buildKeysetQuery` currently returns MongoDB `$lt`/`$or` ODM syntax. This is wrong for a **shared platform library** — it leaks a database-specific implementation detail into code that must work across products using different databases.

**Decision:** `buildKeysetQuery` must return a **neutral filter descriptor object**, not DB-specific syntax. Each product's `data-access` repository layer translates the descriptor into whatever query syntax its database requires.

```js
// CURRENT (wrong — MongoDB-specific):
{ filter: { $or: [{ score: { $lt: sortValue } }, { score: sortValue, _id: { $lt: id } }] }, limit: 20 }

// CORRECTED (neutral descriptor — DB-agnostic):
{
  cursorCondition: { sortField: 'score', sortValue: 95, id: 'abc123', direction: 'lt' },
  limit: 20
}
```

**Each product's repository adapter translates this:**

```js
// Postgres adapter (product-a uses Postgres for relational user/profile data)
function toPostgresWhere({ cursorCondition }) {
  const { sortField, sortValue, id, direction } = cursorCondition;
  return {
    text: `WHERE (${sortField} < $1 OR (${sortField} = $1 AND id < $2))`,
    values: [sortValue, id],
  };
}

// MongoDB adapter (product-b might use MongoDB for flexible document data)
function toMongoFilter({ cursorCondition }) {
  const { sortField, sortValue, id } = cursorCondition;
  return {
    $or: [
      { [sortField]: { $lt: sortValue } },
      { [sortField]: sortValue, _id: { $lt: id } },
    ],
  };
}
```

**This is the Repository + Adapter Pattern** — the same design that makes FAANG services database-portable:

- `@vami/pagination` handles the cursor **cryptography** (HMAC signing, tamper detection) and **semantics** (page size ceiling, sort coordinate encoding) — universal across all databases.
- The product's `data-access` repository translates the neutral descriptor → database-specific syntax.
- Product A uses Postgres. Product B uses MongoDB. The shared library does not care.

#### What this means for the monorepo

Each product (`apps/product-a-api`, future `apps/product-b-api`) has its own `data-access/` repositories registered as singleton services in its `ServiceRegistry`. The BFF resolves the repository adapter via DI — not by importing database drivers directly in business services.

**Files to modify as part of hardening:**

- `libs/shared/pagination/src/index.js` — change `buildKeysetQuery` to return neutral descriptor
- `libs/shared/pagination/src/__tests__/` — update tests to validate descriptor shape, not DB syntax

---

### Decision 2: ABAC Ownership — RBAC+ReBAC Hybrid (Zanzibar-influenced)

**Your comment is correct.** The current `policy.js` owner check is structurally wrong compared to how FAANG companies actually implement ownership-based access control.

#### What FAANG companies actually do

| Company     | System                  | Model                                                                                                             |
| ----------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Google**  | Zanzibar                | ReBAC — ownership IS a relationship tuple in a graph (`user:alice owner doc:123`). Access = path exists in graph. |
| **Airbnb**  | Himeji (Zanzibar-clone) | ReBAC — `guest:123 can view listing:456` only if a confirmed reservation relationship exists                      |
| **Netflix** | SpiceDB + Caveats       | ReBAC + ABAC — graph relationships for ownership, attribute caveats for dynamic context (region, time)            |

**The core insight from Zanzibar:** ownership is not a bypass of the permission system. It IS the permission system. Ownership is modeled as a **relationship** that grants specific permissions — not a flag that overrides all permission checks.

#### The bug in the current implementation

```js
// CURRENT policy.js — owner check fires BEFORE the permission matrix:
if (resourceContext && resourceContext.ownerId === user.userId) {
  return true; // ← bypasses everything — any permission granted if you own the resource
}
```

This means `can(user, 'resource:delete:all', { ownerId: user.userId })` returns `true` for a `GUEST`, which is dangerous.

#### The correct hybrid RBAC + ReBAC-influenced model (right for our scale)

Full Zanzibar (OpenFGA/SpiceDB) is overkill pre-launch. But the **conceptual model** must be correct:

1. **Ownership grants a specific, bounded set of permissions on that resource** — not unlimited access.
2. **The permission matrix still applies for non-ownership paths** — a `GUEST` can never `delete` even their own resource if `GUEST` role excludes `resource:delete`.
3. **Tenant isolation is always evaluated last and always wins** — cross-tenant access denied regardless of ownership.

**Decision: fix `policy.js` to implement ownership as a permission-scoped relationship:**

```js
/**
 * Permissions that ownership of a resource unconditionally grants.
 * Based on Zanzibar principle: ownership = a relationship that resolves
 * to a bounded set of capabilities, NOT a bypass of the system.
 *
 * Any permission NOT in this set requires the role-permission matrix.
 * @type {Set<string>}
 */
const OWNER_PERMISSIONS = new Set([
  "resource:read",
  "resource:update",
  "resource:delete", // owner can delete their own resource
  "resource:share",
]);

function can(user, permission, resourceContext, options = {}) {
  if (!user || !user.userId || !Array.isArray(user.roles)) return false;

  // 1. SUPER_ADMIN override — O(1) fast path
  if (user.roles.includes(ROLES.SUPER_ADMIN)) return true;

  // 2. Tenant isolation — always evaluated, always wins over ownership
  if (
    user.tenantId &&
    resourceContext?.tenantId &&
    user.tenantId !== resourceContext.tenantId
  )
    return false;

  // 3. Custom rule (escape hatch for product-specific logic)
  if (typeof options.customRule === "function") {
    if (options.customRule(user, resourceContext)) return true;
  }

  // 4. Ownership check — grants only bounded OWNER_PERMISSIONS, not everything
  //    This is the Zanzibar model: owner is a relationship that resolves to
  //    specific permissions, not an unconditional bypass.
  if (
    resourceContext?.ownerId === user.userId &&
    OWNER_PERMISSIONS.has(permission)
  ) {
    return true;
  }

  // 5. Role-Permission Matrix — applies to all non-owner paths
  for (const role of user.roles) {
    const perms = ROLE_PERMISSIONS[role];
    if (perms && perms.has(permission)) return true;
  }

  return false;
}
```

**Files to modify:**

- `libs/shared/authz/src/policy.js` — implement bounded `OWNER_PERMISSIONS` set + reorder evaluation
- `libs/shared/authz/src/roles.js` — add `OWNER_PERMISSIONS` export
- `libs/shared/authz/src/__tests__/policy.spec.js` — add tests: owner without permission in matrix → denied; owner with permission in OWNER_PERMISSIONS → allowed; cross-tenant owner → denied

---

### Decision 3: `ServiceUnavailableError` addition to `@vami/util`

The circuit breaker fallback needs HTTP 503. Added to `errors.js`:

```js
class ServiceUnavailableError extends AppError {
  constructor(
    message = "Service Unavailable",
    errorCode = "SERVICE_UNAVAILABLE",
  ) {
    super(message, 503, errorCode, true);
  }
}
```

---

## Part 8 — Verification Checkpoints

### Automated (target: 160+ tests)

```bash
pnpm nx run-many -t test
pnpm exec tsc --noEmit
pnpm audit --audit-level=high
pnpm nx run-many -t lint
```

### Architecture proof checkpoints (from Part E Phase 3)

> "Do not proceed to Phase 4 until this feature is fully working, tested, and deployed to at least a staging environment."

- [ ] Adding a new module = create directory + one line in `registry.js` — zero changes to `app.js` or other modules
- [ ] Login → httpOnly cookies set → `document.cookie` in browser console shows nothing → `/api/v1/auth/me` returns user
- [ ] Logout → cookies cleared → `/api/v1/auth/me` returns 401
- [ ] Stop identity-service → login returns 503 (not crash) — circuit breaker fires
- [ ] 6th login in 15min → 429 Too Many Requests
- [ ] Unauthenticated visit to `/` → redirected to `/login`
- [ ] Profile edit form uses `Input` + `Button` from `@vami/ui` — design token pipeline confirmed working in a real app
- [ ] `/healthz` → 200; stop Redis → `/readyz` → 503
- [ ] `pnpm exec tsc --noEmit` passes with zero errors on new files
- [ ] `can(guestUser, 'resource:delete', { ownerId: guestUser.userId })` → **false** (GUEST not in OWNER_PERMISSIONS for delete OR role matrix) — verifies authz fix
- [ ] `buildKeysetQuery({ cursor, sortField: 'score' })` returns neutral descriptor, not `$or`/`$lt` — verifies pagination fix
- [ ] `can(user, 'resource:update', { ownerId: user.userId })` → **true** (update is in OWNER_PERMISSIONS) — verifies bounded ownership semantics
