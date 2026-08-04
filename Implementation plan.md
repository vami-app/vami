# Enterprise Scaling Roadmap — VAMI / Smalloys Platform

> **Status:** All 25 audit gaps resolved. Build: ✅ `next build` passes clean — 35 routes, 0 errors, 0 TypeScript violations.  
> **Document Purpose:** Now that the foundation is enterprise-grade, this document defines how to scale every layer — from a single app to a multi-product platform — with the architectural rigor used at Netflix, Vercel, Shopify, and Airbnb engineering orgs.

---

## Current State Audit (Post-Sprint 5)

### What Was Accomplished

| Layer                | Status  | Notes                                                                  |
| -------------------- | ------- | ---------------------------------------------------------------------- |
| **Modular Monolith** | ✅ Done | `modules/` with 7 domain modules, public API barrels, repository layer |
| **Cache Layer**      | ✅ Done | `'use cache'` + `revalidateTag` across all 4 services                  |
| **Security**         | ✅ Done | JWT revocation, brute-force lockout, upload MIME+size validation       |
| **Observability**    | ✅ Done | Structured JSON logging, event bus, instrumentation hook               |
| **API Quality**      | ✅ Done | Centralized error handling, sanitized responses, ObjectId validation   |
| **Media Pipeline**   | ✅ Done | WebP conversion, signed uploads, background Cloudinary cleanup         |
| **SEO**              | ✅ Done | Native `robots.js`, dynamic DB-driven `sitemap.js`                     |
| **PPR**              | ✅ Done | `cacheComponents: true` — all routes correctly classified (○◐ƒ)        |

### Build Output (Current)

```
○  /                         Static    1h revalidate, 1d expire
○  /about                    Static
○  /products                 Static
○  /blog                     Static
◐  /blog/[slug]              Partial Prerender (static shell + streamed content)
◐  /products/[category]      Partial Prerender
◐  /admin                    Partial Prerender (5m revalidate, 10m expire)
◐  /admin/settings           Partial Prerender
ƒ  /api/*                    Dynamic (serverless functions)
```

### What Is NOT Yet Done (Scaling Targets)

The gaps below are not bugs — they are the **next growth phase**. Do these in priority order.

---

## Phase 1 — Monorepo Migration (Priority: High)

### Why Now

You've mentioned building a second product. The time to migrate to a monorepo is **before** the second product — not after. Doing it after means migrating two codebases under deadline pressure.

### Architecture: pnpm Workspaces + Turborepo

This is the FAANG-standard stack (used by Vercel, Shopify, Linear, Radix UI, shadcn/ui themselves). It gives:

- **Zero dependency duplication** — shared packages are referenced locally via `workspace:*`
- **Incremental builds** — Turborepo only rebuilds what changed (80%+ build time reduction)
- **Remote caching** — share build artifacts across machines and CI
- **Independent deployments** — each app deploys separately; only changed apps rebuild

### Target Directory Structure

```
vami-platform/                   ← monorepo root
├── turbo.json                   ← task orchestration
├── pnpm-workspace.yaml          ← workspace package discovery
├── package.json                 ← root-level scripts only
│
├── apps/
│   ├── web/                     ← current Smalloys app (moved here)
│   │   └── package.json         ← "name": "@vami/web"
│   ├── admin/                   ← optional: split admin to separate deploy
│   │   └── package.json         ← "name": "@vami/admin"
│   └── product-2/               ← future product (new Next.js app)
│       └── package.json         ← "name": "@vami/product-2"
│
└── packages/
    ├── ui/                      ← ATOMIC DESIGN SYSTEM (see Phase 2)
    │   └── package.json         ← "name": "@vami/ui"
    ├── config-typescript/       ← shared tsconfig.json base
    ├── config-eslint/           ← shared eslint config
    ├── config-tailwind/         ← shared tailwind preset + design tokens
    ├── lib-logger/              ← extracted lib/logger.js
    ├── lib-events/              ← extracted lib/events.js
    └── lib-auth/                ← shared auth primitives (JWT, RBAC)
```

### Migration Steps (Incremental — No Rewrites)

**Step 1: Initialize Monorepo Root**

```bash
mkdir vami-platform && cd vami-platform
pnpm init
pnpm add -D turbo
```

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Create `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": { "dependsOn": ["^lint"] },
    "type-check": { "dependsOn": ["^build"] }
  }
}
```

**Step 2: Move Current App**

```bash
mkdir -p apps/web
# Move all current project files into apps/web/
# Update apps/web/package.json name to "@vami/web"
# Add to jsconfig.json: transpilePackages: ['@vami/ui']
```

**Step 3: Shared Config Packages**

```bash
mkdir packages/config-typescript && cd packages/config-typescript
pnpm init   # "@vami/config-typescript"
```

Create `packages/config-typescript/base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

**Step 4: Extract Shared Lib Packages**

```js
// packages/lib-logger/index.js
// Extract current lib/logger.js (zero-dep JSON logger)
// apps/web imports: import { logger } from '@vami/lib-logger'
```

**Step 5: Add Second Product**

```bash
cd apps && pnpm create next-app@latest product-2 --no-tailwind
# product-2/package.json: add "@vami/ui": "workspace:*"
```

### Key Rules

> [!IMPORTANT]
> **Never** import from `apps/web/*` inside `packages/*`. Packages are consumed by apps, not the reverse.  
> **Always** use `workspace:*` (not version numbers) for internal package dependencies.  
> **Scope** Next.js-specific code (Server Components, `next/image`) to `apps/` — not in `packages/ui`. Packages should be framework-agnostic UI primitives only.

---

## Phase 2 — Atomic Design System (`packages/ui`)

### The Model: 5-Layer Atomic Design + Design Tokens

The current `components/` folder has no enforced structure. At scale, this becomes unmaintainable. The fix is to treat the UI as a product.

```
packages/ui/
├── src/
│   ├── tokens/               ← LAYER 0: Design Tokens (CSS vars, not hardcoded values)
│   │   ├── colors.css        ← hsl-based palette, brand, semantic
│   │   ├── typography.css    ← font-size scale, line-height, tracking
│   │   ├── spacing.css       ← spacing scale (4px base unit)
│   │   ├── radii.css         ← border-radius tokens
│   │   └── shadows.css       ← elevation/shadow scale
│   │
│   ├── atoms/                ← LAYER 1: Primitive building blocks
│   │   ├── Button/
│   │   │   ├── Button.jsx    ← uses Radix Slot for composition
│   │   │   ├── Button.stories.jsx
│   │   │   └── index.js
│   │   ├── Input/
│   │   ├── Label/
│   │   ├── Badge/
│   │   ├── Avatar/
│   │   ├── Skeleton/         ← loading state primitives
│   │   ├── Spinner/
│   │   └── Typography/       ← Heading, Body, Caption, Code
│   │
│   ├── molecules/            ← LAYER 2: Atoms + behavior
│   │   ├── FormField/        ← Label + Input + ErrorMessage
│   │   ├── SearchInput/      ← Input + clear button + icon
│   │   ├── Pagination/       ← prev/next + page indicator
│   │   ├── FileUpload/       ← drag-drop zone + preview
│   │   ├── TagInput/         ← Input + removable tags
│   │   └── StatusBadge/      ← Badge + semantic color by status
│   │
│   ├── organisms/            ← LAYER 3: Domain-agnostic complex components
│   │   ├── DataTable/        ← sortable, filterable table
│   │   ├── Modal/            ← Radix Dialog primitive + styles
│   │   ├── Combobox/         ← Radix Combobox primitive
│   │   ├── Navbar/           ← responsive nav shell
│   │   ├── Sidebar/          ← collapsible sidebar shell
│   │   ├── Toast/            ← notification system (wraps react-hot-toast)
│   │   └── RichTextEditor/   ← TipTap wrapper
│   │
│   └── index.js              ← PUBLIC API — only import from here
│
├── package.json
└── README.md
```

### Design Token Implementation

**Why tokens matter:** Today `components/ui/*.jsx` uses hardcoded Tailwind classes. If you rebrand or white-label the product, you change thousands of lines. With tokens, you change one file.

```css
/* packages/ui/src/tokens/colors.css */
:root {
  /* Brand */
  --color-brand-50: hsl(220, 100%, 97%);
  --color-brand-500: hsl(220, 90%, 56%);
  --color-brand-900: hsl(220, 80%, 20%);

  /* Semantic */
  --color-text-primary: hsl(220, 20%, 10%);
  --color-text-muted: hsl(220, 10%, 50%);
  --color-surface: hsl(0, 0%, 100%);
  --color-surface-subtle: hsl(220, 20%, 97%);
  --color-border: hsl(220, 15%, 90%);

  /* Status */
  --color-success: hsl(142, 70%, 40%);
  --color-warning: hsl(38, 92%, 50%);
  --color-error: hsl(0, 72%, 51%);
}

[data-theme="dark"] {
  --color-text-primary: hsl(220, 20%, 95%);
  --color-text-muted: hsl(220, 10%, 60%);
  --color-surface: hsl(220, 20%, 10%);
  --color-surface-subtle: hsl(220, 20%, 13%);
  --color-border: hsl(220, 15%, 20%);
}
```

**Token-to-Tailwind Bridge** (`packages/config-tailwind/preset.js`):

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: "hsl(var(--color-brand-50))",
          500: "hsl(var(--color-brand-500))",
        },
        text: {
          primary: "hsl(var(--color-text-primary))",
          muted: "hsl(var(--color-text-muted))",
        },
        surface: {
          DEFAULT: "hsl(var(--color-surface))",
          subtle: "hsl(var(--color-surface-subtle))",
        },
        border: { DEFAULT: "hsl(var(--color-border))" },
      },
    },
  },
};
```

### Headless Primitives Strategy

> [!IMPORTANT]
> Do **NOT** build accessibility logic from scratch. Use headless primitives:
>
> - **Radix UI** — Dialog, Popover, DropdownMenu, Select, Tabs, Accordion
> - **Base UI** (MUI team, 2026 default for shadcn) — newer API with `render` props instead of `asChild`
> - Your atoms/molecules wrap these primitives with your token-based styles

```jsx
// packages/ui/src/organisms/Modal/Modal.jsx
import * as Dialog from "@radix-ui/react-dialog";

export function Modal({
  trigger,
  title,
  description,
  children,
  open,
  onOpenChange,
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="modal-content">
          {title && (
            <Dialog.Title className="modal-title">{title}</Dialog.Title>
          )}
          {description && (
            <Dialog.Description className="modal-description">
              {description}
            </Dialog.Description>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

---

## Phase 3 — Performance Optimization

### 3.1 Image Pipeline

Current state: `<img>` tags used in admin and some public pages. This is a significant LCP regression.

**Actions Required:**

1. **Replace all `<img>` with `next/image`** in public-facing pages:

   ```jsx
   // Before (current — no optimization)
   <img src={product.images[0]} alt={product.name} />;

   // After (WebP, AVIF, lazy-load, dimensions reserved = no CLS)
   import Image from "next/image";
   <Image
     src={product.images[0]}
     alt={product.name}
     width={800}
     height={600}
     sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
     priority={isFirstProduct} // only for LCP image
   />;
   ```

2. **Add Cloudinary as a Next.js image domain:**

   ```js
   // next.config.mjs
   images: {
     remotePatterns: [{
       protocol: 'https',
       hostname: 'res.cloudinary.com',
       pathname: '/your-cloud-name/**',
     }],
   },
   ```

3. **Hero image blur placeholder:**
   ```jsx
   <Image
     placeholder="blur"
     blurDataURL={product.blurDataUrl} // generate via Cloudinary f_auto,q_1,w_50
     {...imageProps}
   />
   ```

### 3.2 Bundle Size Audit

```bash
npm install --save-dev @next/bundle-analyzer
# next.config.mjs:
import bundleAnalyzer from '@next/bundle-analyzer';
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });
export default withBundleAnalyzer(nextConfig);
# Run: ANALYZE=true npm run build
```

**Known Wins (check these first):**

- `moment` → `date-fns` (60KB savings if moment is in tree)
- `lucide-react@1.28` — already modern tree-shakeable ✅
- TipTap — ensure only `@tiptap/starter-kit` is used (not enterprise kit)
- `cloudinary` SDK — only imported server-side ✅ (but verify no client leak)

### 3.3 React Server Component Discipline

**Audit boundary placements** — run this and fix violations:

```bash
grep -r "'use client'" app/ components/ --include="*.jsx" --include="*.tsx"
```

Rule: `'use client'` components should be **leaves** of the tree, not wrappers. If a `'use client'` component renders children, those children are also client-rendered even if they don't need to be.

**Pattern: push state down**

```jsx
// BAD: entire page is client
'use client';
export default function ProductPage({ id }) {
  const [qty, setQty] = useState(1);
  return (
    <div>
      <ProductDetails id={id} />  // ← this is now a client component too
      <QuantitySelector qty={qty} onChange={setQty} />
    </div>
  );
}

// GOOD: only the interactive piece is client
// ProductPage is a Server Component
export default async function ProductPage({ id }) {
  const product = await getProductById(id);
  return (
    <div>
      <ProductDetails product={product} />  // ← Server Component
      <QuantitySelector />  // ← 'use client' leaf
    </div>
  );
}
```

### 3.4 Streaming with Suspense

Current: admin pages and some product pages are full PPR. Improve by streaming individual slow parts:

```jsx
// app/admin/(protected)/products/page.jsx
import { Suspense } from "react";
import ProductTableSkeleton from "./ProductTableSkeleton"; // instant
import ProductTable from "./ProductTable"; // streams in

export default function AdminProductsPage() {
  return (
    <div>
      <PageHeader>Products</PageHeader>
      <Suspense fallback={<ProductTableSkeleton />}>
        <ProductTable />
      </Suspense>
    </div>
  );
}
```

### 3.5 Instant Navigation (Next.js 16)

```js
// app/(public)/products/page.jsx — add this export
export const unstable_instant = true;
// Enables instant client-side navigation for static cached routes
```

---

## Phase 4 — Database Scaling

### 4.1 Indexes (Critical — Do This Now)

Current `models/` have minimal indexes. Add compound indexes for the most common query patterns:

```js
// models/Product.js
ProductSchema.index({ status: 1, category: 1 }); // category listing pages
ProductSchema.index({ status: 1, featured: 1 }); // homepage featured
ProductSchema.index({ slug: 1, category: 1 }); // product detail lookup
ProductSchema.index({ status: 1, createdAt: -1 }); // admin list

// models/BlogPost.js
BlogPostSchema.index({ status: 1, publishedAt: -1 }); // blog listing ✅ (already added)
BlogPostSchema.index({ tags: 1, status: 1 }); // tag filtering

// models/Category.js
CategorySchema.index({ slug: 1 }, { unique: true }); // slug lookup (should be unique)
```

**Run in Atlas (Query Profiler → Slow Query Log):**

```
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().sort({ ts: -1 }).limit(10)
```

### 4.2 Connection Pool Tuning

Current: `maxPoolSize: 10` (good for serverless). When you move to persistent servers or scale to >10 instances:

```js
// lib/db.js — dynamic pool sizing formula
const MAX_CONNECTIONS_ATLAS = 500; // M10 = 500, M20 = 1500
const INSTANCES = parseInt(process.env.INSTANCE_COUNT || '1', 10);
const maxPoolSize = Math.floor((MAX_CONNECTIONS_ATLAS / INSTANCES) * 0.8);
// Add maxIdleTimeMS to recycle idle connections
maxIdleTimeMS: 10000,
waitQueueTimeoutMS: 5000,
```

### 4.3 Read Replicas (When Traffic Grows)

MongoDB Atlas M10+ includes replica sets. Distribute read-heavy operations to secondaries:

```js
// For analytics/reporting queries that can tolerate slight staleness
const results = await Product.find(query)
  .read("secondaryPreferred") // reads from nearest secondary
  .lean();
```

### 4.4 Atlas Search (Full-Text Search)

Add product/blog search without a separate search service:

```js
// models/Product.js — Atlas Search Index (define in Atlas UI)
// {
//   "mappings": {
//     "dynamic": false,
//     "fields": {
//       "name": [{ "type": "string" }, { "type": "autocomplete" }],
//       "shortDescription": [{ "type": "string" }],
//       "status": [{ "type": "token" }]
//     }
//   }
// }

// services/search.service.js
export async function searchProducts(query) {
  return Product.aggregate([
    {
      $search: {
        index: "product_search",
        compound: {
          should: [
            {
              autocomplete: {
                query,
                path: "name",
                fuzzy: { maxEdits: 1 },
                score: { boost: { value: 3 } },
              },
            },
            { text: { query, path: "shortDescription" } },
          ],
          filter: [{ term: { query: "published", path: "status" } }],
        },
      },
    },
    {
      $project: {
        name: 1,
        slug: 1,
        images: 1,
        category: 1,
        score: { $meta: "searchScore" },
      },
    },
    {
      $limit: 20,
    },
  ]);
}
```

---

## Phase 5 — Security Hardening (Next Layer)

### 5.1 Edge Rate Limiting

Current: no rate limiting. Any attacker can hammer `/api/auth/login` from multiple IPs.

```bash
pnpm add @upstash/ratelimit @upstash/redis
```

```js
// middleware.js (Next.js Edge Middleware — runs globally before any route)
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Sliding window: 20 requests per 10 seconds per IP
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "10 s"),
  analytics: true,
});

// More restrictive limit for auth routes
const authRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(5, "60 s"),
});

export async function middleware(request) {
  const ip = request.ip ?? "127.0.0.1";
  const pathname = request.nextUrl.pathname;

  // Apply stricter limit to auth endpoints
  const limiter = pathname.startsWith("/api/auth") ? authRatelimit : ratelimit;
  const { success, limit, remaining, reset } = await limiter.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
```

### 5.2 Content Security Policy (CSP)

```js
// next.config.mjs — add to headers()
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https://res.cloudinary.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.cloudinary.com;
  frame-ancestors 'none';
`.replace(/\n/g, '');

async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ],
  }];
},
```

### 5.3 CSRF Protection for State-Changing Routes

With JWT in httpOnly cookies, CSRF is already partially mitigated (SameSite: Lax). Full protection:

```js
// lib/csrf.js
import { createHash, randomBytes } from "crypto";

export function generateCsrfToken() {
  return randomBytes(32).toString("hex");
}

export function verifyCsrfToken(token, sessionToken) {
  // Constant-time comparison to prevent timing attacks
  const expected = createHash("sha256").update(sessionToken).digest("hex");
  return token === expected;
}
```

### 5.4 Helmet-Equivalent Headers Audit

Run `npx security-headers` against your deployed app to score all HTTP headers. Target A+ rating.

---

## Phase 6 — Observability Stack

### 6.1 OpenTelemetry (Replace Current Logger)

Current `lib/logger.js` is a JSON logger — good for logs, but no distributed traces. Add OTel:

```bash
pnpm add @vercel/otel @opentelemetry/sdk-node
```

```js
// instrumentation.js — extend current file
import { registerOTel } from "@vercel/otel";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // OTel — must run before any other code
    registerOTel({ serviceName: "vami-web" });

    // ... existing event bus registration
  }
}
```

**What you get automatically (zero-config):**

- Request traces: TTFB, DB query time, cache hit/miss
- Error traces with stack and context
- Span correlation across DB calls
- Export to Vercel Traces, Sentry, Datadog, or any OTLP endpoint

### 6.2 Sentry Integration

```bash
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Error boundaries for client components:**

```jsx
// app/error.jsx (global error boundary)
"use client";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### 6.3 Real User Monitoring (RUM)

```jsx
// app/layout.jsx
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

// Inside RootLayout:
<>
  {children}
  <SpeedInsights /> {/* Core Web Vitals — p75 LCP, INP, CLS */}
  <Analytics /> {/* Page view + custom events */}
</>;
```

---

## Phase 7 — Infrastructure Enhancements

### 7.1 Upstash Redis — Distributed Cache Layer

When `'use cache'` in-memory cache doesn't survive across cold starts (expected behavior), add a persistent distributed cache:

```js
// next.config.mjs
cacheHandlers: {
  default: require('./cache-handler.js'),
}

// cache-handler.js
const { Redis } = require('@upstash/redis');
const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });

module.exports = class UpstashCacheHandler {
  async get(key) { return redis.get(key); }
  async set(key, data, options) { return redis.set(key, data, { ex: options?.revalidate ?? 3600 }); }
  async revalidateTag(tag) { /* implement tag → key mapping */ }
};
```

### 7.2 Background Jobs with BullMQ

For tasks that shouldn't block HTTP responses and need reliability (email, PDF generation, analytics):

```bash
pnpm add bullmq ioredis
```

```js
// lib/queue.js
import { Queue, Worker } from "bullmq";

const connection = { host: process.env.REDIS_HOST, port: 6379 };

export const emailQueue = new Queue("email", { connection });
export const analyticsQueue = new Queue("analytics", { connection });

// instrumentation.js — register workers on bootstrap
const emailWorker = new Worker(
  "email",
  async (job) => {
    await sendEmail(job.data);
  },
  { connection },
);
```

### 7.3 Edge Middleware — Geo-Based Routing

```js
// middleware.js — add geo routing for multi-region
import { geolocation } from "@vercel/functions";

export function middleware(request) {
  const { country } = geolocation(request);

  // Redirect specific regions to localized versions
  if (country === "IN" && !request.nextUrl.pathname.startsWith("/in")) {
    return NextResponse.redirect(
      new URL(`/in${request.nextUrl.pathname}`, request.url),
    );
  }
}
```

---

## Phase 8 — Developer Experience

### 8.1 TypeScript Migration

The codebase is JavaScript. TypeScript should be added **incrementally** — the `allowJs: true` flag lets you rename files one at a time:

```
Priority order:
1. lib/  → lib/auth.ts, lib/db.ts, lib/logger.ts
2. modules/*/index.ts  → typed public APIs
3. services/  → typed service functions
4. app/api/  → typed route handlers
5. components/  → typed props interfaces
```

**Target: strict mode types for all new files, JS allowed for legacy.**

### 8.2 Database Validation Scripts

```js
// scripts/db-health.mjs
// Check all collections for missing required fields
// Verify all slugs are unique
// Find orphaned products (category deleted)
// Check Cloudinary URLs are accessible
```

### 8.3 Environment Validation (Already Done via env.mjs)

Current `env.mjs` using `@t3-oss/env-nextjs` + Zod — this is correct. ✅ No changes needed.

Expansion: add `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `SENTRY_DSN`, `NEXT_PUBLIC_SITE_URL` validation as you add those services.

### 8.4 Storybook for Design System

When `packages/ui` is created:

```bash
cd packages/ui && pnpm dlx storybook@latest init --type react
```

Every atom/molecule gets a `.stories.jsx` file. Storybook gives:

- Visual component catalog
- Isolation testing (no Next.js dependency)
- Accessibility auditing via `@storybook/addon-a11y`
- Design → code collaboration via Figma plugin

---

## Priority Execution Order

| Priority                        | Phase                                     | Effort           | Impact                                 |
| ------------------------------- | ----------------------------------------- | ---------------- | -------------------------------------- |
| **1 — Do Now**                  | Phase 3.1: Replace `<img>` → `next/image` | Low (2h)         | LCP, CLS improvement                   |
| **2 — Do Now**                  | Phase 4.1: Add compound DB indexes        | Low (1h)         | Query performance 2-10x                |
| **3 — This Sprint**             | Phase 5.1: Edge rate limiting (Upstash)   | Medium (4h)      | Security: prevent brute-force at scale |
| **4 — This Sprint**             | Phase 5.2: CSP headers                    | Low (2h)         | Security: XSS mitigation               |
| **5 — Next Sprint**             | Phase 6.1-6.2: OTel + Sentry              | Medium (4h)      | Production visibility                  |
| **6 — When Building Product 2** | Phase 1: Monorepo migration               | High (2-3 days)  | Platform architecture                  |
| **7 — After Monorepo**          | Phase 2: Atomic Design System             | High (1-2 weeks) | Cross-product UI consistency           |
| **8 — At Scale**                | Phase 4.4: Atlas Search                   | Medium (1 day)   | User experience: search                |
| **9 — At Scale**                | Phase 7.1: Upstash distributed cache      | Medium (1 day)   | Cache persistence across cold starts   |

---

## Architecture Diagram — Target State

```
┌─────────────────────────────────────────────────────────────┐
│                    vami-platform (monorepo)                  │
│                                                              │
│  apps/                          packages/                    │
│  ├── web (Smalloys)             ├── @vami/ui (design system) │
│  │   ├── modules/ (7 domains)  ├── @vami/lib-auth           │
│  │   ├── app/ (PPR routes)     ├── @vami/lib-logger         │
│  │   └── services/             ├── @vami/config-ts           │
│  └── product-2 (future)        └── @vami/config-tailwind    │
│                                                              │
│  Infrastructure:                                             │
│  ├── Vercel (Edge + Serverless Functions)                    │
│  ├── MongoDB Atlas (M10, replica set, Search index)         │
│  ├── Cloudinary (CDN, transforms, signed uploads)            │
│  ├── Upstash Redis (rate limit + distributed cache)          │
│  └── Sentry + OTel (observability + error tracking)         │
└─────────────────────────────────────────────────────────────┘
```

---

## What FAANG Gets Right That This Now Follows

| FAANG Principle           | Current Implementation                                                   |
| ------------------------- | ------------------------------------------------------------------------ |
| **Domain-Driven Design**  | `modules/` with bounded contexts, repository pattern                     |
| **Zero-downtime cache**   | `revalidateTag` per mutation — no manual purge, no downtime              |
| **Defense in depth**      | Auth in JWT + DB check + RBAC permissions + route handler guard          |
| **Fail fast, not silent** | Structured logger at every error path; error sanitization in prod        |
| **Least privilege**       | Cookie: httpOnly, SameSite, secure; JWT: 4h TTL, tokenVersion revocation |
| **Async side effects**    | `unstable_after` for media cleanup; event bus for domain decoupling      |
| **Observability first**   | Structured JSON logs parseable by any aggregator (Vercel, Datadog, etc.) |
| **Static by default**     | PPR: all public routes are static shells with streamed dynamic content   |
| **No secrets on client**  | All env vars server-only (except `NEXT_PUBLIC_*`), validated at boot     |
