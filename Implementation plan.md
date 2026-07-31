# Implementation Plan: Product Catalog & Blog Website

**Document type:** Software Implementation Plan
**Project reference:** Structurally inspired by smalloys.com (B2B industrial catalog site), generalized for any product category
**Prepared:** July 31, 2026

---

## 1. Project Overview

### 1.1 What is being built

A responsive, SEO-optimized website consisting of:

- A **public-facing catalog site** that displays products (organized by category and sub-attributes), a blog, and standard trust pages (About, Contact, Certificates).
- A **private admin dashboard** where the site owner can perform full CRUD (Create, Read, Update, Delete) on products (including photo uploads) and blog posts, without touching code.

### 1.2 Explicit requirements (as stated)

| #   | Requirement                                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Website type: B2B-style catalog + blog, structurally modeled on smalloys.com but **not category-locked** — the product domain is generic (could be metals, electronics, furniture, any physical product line) |
| 2   | Tech stack: **Next.js, Node, Express, Mongoose, Cloudinary, GitHub, Vercel**                                                                                                                                  |
| 3   | Fully responsive — must be specified from the smallest screen size to the largest                                                                                                                             |
| 4   | Admin page to manage product photos and blog content, with full CRUD                                                                                                                                          |
| 5   | SEO optimization built in, not bolted on                                                                                                                                                                      |
| 6   | All phases documented in depth — from local development to production deployment                                                                                                                              |
| 7   | Budget constraint: free-tier services only (small-scale project)                                                                                                                                              |

### 1.3 Reference structure being adapted (smalloys.com)

- Homepage: hero/slider, About summary, product category grid, stats counters, client logos, footer
- Mega-menu: category → sub-category (shape/variant) → detail landing page (SEO-driven)
- About Us / Contact Us / Certificates (trust pages)
- Interactive utility tool (weight calculator equivalent — optional, domain-specific)
- Blog for SEO content
- Downloadable catalog (PDF)
- Analytics + SEO meta tags throughout

This plan generalizes "metal category → shape" into "**Category → Product → Variant/Spec**", so the same architecture works regardless of what you actually sell.

---

## 2. Tech Stack — Decision & Justification

### 2.1 Final stack

| Layer                   | Technology                                                         | Why                                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend framework      | **Next.js (App Router)**                                           | Server-side rendering (SSR) + static generation (SSG) — mandatory for SEO on a catalog site. A plain React SPA (Vite) is invisible to search engines without extra tooling. |
| Backend                 | **Node.js + Express**, mounted as custom server logic / API routes | Matches stated stack; used for CRUD APIs, auth, image-handling, and any logic not natively suited to Next.js API routes                                                     |
| ODM / Database driver   | **Mongoose** on **MongoDB Atlas** (free M0 tier)                   | Flexible schema — different product categories can have different spec fields without rigid SQL migrations                                                                  |
| Image hosting           | **Cloudinary** (free tier: 25 GB storage/bandwidth)                | Offloads image storage/transformation from your server; generates responsive image URLs on the fly (critical for the responsive-design requirement)                         |
| Styling                 | **Tailwind CSS**                                                   | Utility-first, fast to build responsive breakpoints (already in your skillset)                                                                                              |
| Hosting / CI-CD         | **Vercel** (free Hobby tier) + **GitHub**                          | Native Next.js support, auto-deploy on push, free SSL, edge network                                                                                                         |
| Auth                    | **JWT + bcrypt**, stored in httpOnly cookies                       | Single-admin system; no need for a full user-management system                                                                                                              |
| Rich text editor (blog) | **TipTap**                                                         | Lightweight, integrates cleanly with React/Next.js                                                                                                                          |

### 2.2 Architectural decision: Express inside Next.js vs. separate service

You specified both **Next.js** and **Express** — here is how they combine correctly rather than conflicting:

**Chosen approach: Next.js API Routes as the primary backend, with Express-style middleware patterns reused inside them.**

- Route handlers (`app/api/.../route.js`) act as your Express-equivalent controllers.
- Middleware logic (auth checks, validation) is written as reusable functions, same mental model as Express middleware, just invoked manually inside each handler.
- **Single deployment, single free-tier service (Vercel).** No second server to pay for, monitor, or keep alive.

**Rejected alternative:** A fully separate Express server (e.g., on Render/Railway free tier) with Next.js only for frontend.

- Rejected because: two services to deploy and monitor, free-tier backend hosts often spin down on inactivity (cold starts hurt UX and SEO crawlers), and it adds no real capability you don't already get from Next.js API routes for a project this size.
- **Exception:** If you later need long-running background jobs (e.g., scheduled scraping, heavy image processing, cron-like tasks) that don't fit serverless functions, a separate small Express service becomes justified. Not needed at this stage.

---

## 3. System Architecture

### 3.1 High-level diagram (described)

```
[Browser]
   │
   ▼
[Vercel Edge Network]
   │
   ▼
[Next.js App]
   ├── Public Pages (SSR/SSG) ──► reads from MongoDB via Mongoose
   ├── Admin Pages (client-rendered, auth-protected)
   └── API Routes (Express-style handlers)
              ├── /api/products   → CRUD → MongoDB Atlas
              ├── /api/categories → CRUD → MongoDB Atlas
              ├── /api/blog       → CRUD → MongoDB Atlas
              ├── /api/auth       → JWT issue/verify
              └── /api/upload     → Cloudinary API
```

### 3.2 Repository structure

```
/project-root
├── app/
│   ├── (public)/
│   │   ├── page.jsx                    → Homepage
│   │   ├── products/[category]/page.jsx
│   │   ├── products/[category]/[slug]/page.jsx
│   │   ├── blog/page.jsx
│   │   ├── blog/[slug]/page.jsx
│   │   ├── about/page.jsx
│   │   ├── contact/page.jsx
│   │   └── certificates/page.jsx
│   ├── admin/
│   │   ├── login/page.jsx
│   │   ├── layout.jsx                  → auth guard wrapper
│   │   ├── products/page.jsx           → list + delete
│   │   ├── products/new/page.jsx
│   │   ├── products/[id]/edit/page.jsx
│   │   ├── blog/page.jsx
│   │   ├── blog/new/page.jsx
│   │   └── blog/[id]/edit/page.jsx
│   ├── api/
│   │   ├── products/route.js
│   │   ├── products/[id]/route.js
│   │   ├── categories/route.js
│   │   ├── blog/route.js
│   │   ├── blog/[id]/route.js
│   │   ├── auth/login/route.js
│   │   ├── upload/route.js
│   │   ├── sitemap.xml/route.js
│   │   └── robots.txt/route.js
│   └── layout.jsx
├── components/
│   ├── layout/ (Navbar, Footer, MobileMenu)
│   ├── product/ (ProductCard, ProductGrid, ProductGallery)
│   ├── blog/ (BlogCard, BlogEditor)
│   └── admin/ (DataTable, ImageUploader, ProtectedRoute)
├── lib/
│   ├── db.js              → cached Mongoose connection
│   ├── auth.js             → JWT helpers, middleware
│   └── cloudinary.js       → upload helper
├── models/
│   ├── Category.js
│   ├── Product.js
│   ├── BlogPost.js
│   └── Admin.js
├── public/
├── .env.local
├── tailwind.config.js
└── next.config.js
```

---

## 4. Data Models (Generic — not category-locked)

```js
// models/Category.js
{
  name: String,          // "Titanium", "Electronics", "Chairs" — anything
  slug: String,          // unique, URL-safe
  description: String,
  image: String,         // Cloudinary URL
  seoTitle: String,
  seoDescription: String,
  createdAt: Date
}

// models/Product.js
{
  name: String,
  slug: String,          // unique
  category: ObjectId,    // ref: Category
  shortDescription: String,
  longDescription: String,      // rich text
  specs: [{ key: String, value: String }],  // generic key-value — replaces "shape" concept
  variants: [{                              // e.g. Sheet/Plate/Rod, OR Size S/M/L, OR Color
    name: String,
    priceNote: String,          // "Contact for quote" or actual price
    images: [String]            // Cloudinary URLs
  }],
  images: [String],       // main gallery
  featured: Boolean,
  status: String,         // "draft" | "published"
  seoTitle: String,
  seoDescription: String,
  createdAt: Date,
  updatedAt: Date
}

// models/BlogPost.js
{
  title: String,
  slug: String,
  coverImage: String,
  content: String,        // rich text HTML
  excerpt: String,
  tags: [String],
  status: String,          // "draft" | "published"
  seoTitle: String,
  seoDescription: String,
  publishedAt: Date,
  createdAt: Date
}

// models/Admin.js
{
  email: String,
  passwordHash: String
}
```

**Why `specs: [{key, value}]` instead of fixed fields:** this is the generalization point. smalloys.com hardcodes "Grade / Shape" because it only sells metals. Your version needs to describe _any_ product, so specs are stored as flexible key-value pairs (e.g., `{"Material": "Oak"}`, `{"Grade": "Titanium Gr.2"}`, `{"Screen size": "15 inch"}`) rendered as a spec table on the product page.

---

## 5. Admin Panel Specification

### 5.1 Access

- Single login page (`/admin/login`) — email + password against the one `Admin` document
- JWT issued on success, stored in an httpOnly, secure cookie
- All `/admin/*` routes wrapped in a server-side auth check (redirect to login if invalid/missing token)
- All write API routes (`POST`, `PUT`, `DELETE`) verify the JWT server-side — never trust the client

### 5.2 Product management

- **List view:** paginated table — thumbnail, name, category, status (draft/published), edit/delete actions
- **Create/Edit form:**
  - Name, slug (auto-generated, editable)
  - Category dropdown (with "add new category" inline option)
  - Short + long description (rich text for long)
  - Dynamic spec key-value rows (add/remove rows)
  - Dynamic variant rows, each with its own image upload
  - Main image gallery uploader (drag-drop, multi-file, preview thumbnails, reorder, delete individual images)
  - SEO fields (title, meta description) with live character-count validation (Google truncates ~60 char titles, ~155-160 char descriptions)
  - Status toggle: Draft / Published
  - Save → validates required fields client-side AND server-side before writing to MongoDB

### 5.3 Blog management

- Same list/create/edit pattern
- Rich text editor (TipTap) with image insertion (uploads to Cloudinary inline)
- Auto-slug from title, editable
- Draft/Published toggle so you can write without it going live

### 5.4 Image handling flow

1. Admin selects file(s) in the browser
2. File sent to `/api/upload` (protected route)
3. Route streams file to Cloudinary via server-side SDK (keeps your Cloudinary API secret off the client)
4. Cloudinary returns a secure URL + public ID
5. URL saved into the Product/BlogPost document
6. On delete, the corresponding Cloudinary asset is also deleted (avoid orphaned storage eating your free tier quota)

---

## 6. Responsive Design Specification (smallest → largest screen)

This is treated as a first-class requirement, not an afterthought. Tailwind's default breakpoint scale is used as the baseline, with explicit behavior defined per range.

### 6.1 Breakpoint scale

| Breakpoint       | Min width | Typical device                          |
| ---------------- | --------- | --------------------------------------- |
| Base (no prefix) | 0px       | Small phones (iPhone SE, older Android) |
| `sm`             | 640px     | Large phones (landscape), phablets      |
| `md`             | 768px     | Tablets (portrait)                      |
| `lg`             | 1024px    | Tablets (landscape), small laptops      |
| `xl`             | 1280px    | Laptops/desktops                        |
| `2xl`            | 1536px    | Large desktops, wide monitors           |

### 6.2 Behavior per section, per breakpoint

**Navigation**

- Base–`md` (< 768px): Hamburger menu, full-screen slide-in overlay, categories shown as an accordion (not a hover mega-menu — hover doesn't exist on touch)
- `lg`+ (≥ 1024px): Full horizontal nav bar, mega-menu on hover/click showing category → sub-category columns
- Sticky header on scroll at all sizes, but height reduces on scroll for mobile to save vertical space

**Hero section**

- Base: single image/slide, text stacked below or as overlay with darkening gradient for legibility, CTA button full-width
- `md`: text and image can sit side-by-side if using a two-column hero
- `lg`+: full slider/carousel behavior enabled (disable auto-rotating carousels below `md` — they hurt mobile performance and UX; show a static hero image instead on small screens)

**Product category grid**

- Base: 1 column
- `sm`: 2 columns
- `md`: 3 columns
- `lg`+: 4 columns
- Grid uses CSS Grid with `gap` scaling down on mobile (tighter spacing) and up on desktop

**Product detail page**

- Base: image gallery on top (swipeable), spec table below, full-width "Request Quote" button fixed to bottom of viewport (thumb-reachable)
- `md`: image gallery left, spec/CTA panel right, two-column layout
- `lg`+: same two-column but with larger image previews and a sticky "Request Quote" sidebar that follows scroll

**Spec/data tables**

- Base: convert to stacked key-value pairs (real `<table>` elements overflow badly on narrow screens) — each row becomes a labeled block
- `md`+: render as an actual table

**Blog listing**

- Base: 1 column, full-width cards
- `md`: 2 columns
- `lg`+: 3 columns, sidebar appears (recent posts, tags) at `lg`+ only — hidden on mobile to avoid clutter

**Admin dashboard tables**

- Base: card-based list (each row becomes a card with key fields + action buttons) — raw data tables are unusable below `md`
- `md`+: standard table with sortable columns

**Images**

- All images served via Cloudinary's responsive URL transformations — request different resolutions per breakpoint using `srcset`/Next.js `<Image>` component, so a phone never downloads a desktop-sized hero image
- Lazy-load all below-the-fold images

**Touch targets**

- All interactive elements ≥ 44×44px on base/sm (Apple/Google accessibility guideline) — buttons, nav links, form inputs

**Typography scaling**

- Base font size 16px minimum (never smaller — mobile Safari auto-zooms on inputs below 16px, which is jarring)
- Headings scale via Tailwind's responsive text classes, e.g., `text-2xl md:text-3xl lg:text-4xl`

### 6.3 Testing matrix (must verify before launch)

| Device class     | Width tested |
| ---------------- | ------------ |
| Small phone      | 360px, 375px |
| Large phone      | 414px, 428px |
| Tablet portrait  | 768px        |
| Tablet landscape | 1024px       |
| Small laptop     | 1280px       |
| Desktop          | 1440px       |
| Large monitor    | 1920px+      |

Use Chrome DevTools device toolbar + at least one real phone and one real tablet before calling responsive work "done." Emulators miss real touch/scroll quirks.

---

## 7. SEO Optimization Plan

SEO is the entire reason smalloys.com structures itself the way it does. This is treated as a core deliverable, not a checkbox.

### 7.1 Technical SEO (enabled by Next.js by default)

- **SSR/SSG for all public pages** — search engines get fully-rendered HTML, not an empty `<div id="root">`
- **Dynamic `generateMetadata()` per page** — unique `<title>` and meta description pulled from each Product/BlogPost/Category document's `seoTitle`/`seoDescription` fields
- **Canonical URLs** on every page (prevents duplicate-content penalties, especially important if a product ever appears under multiple category paths)
- **Structured data (JSON-LD)** — `Product` schema on product pages (name, image, description, brand), `Article` schema on blog posts, `Organization`/`LocalBusiness` schema site-wide. This is what powers rich results in Google.
- **Dynamically generated `sitemap.xml`** — built from live DB content (every product + blog post + category, auto-updates as you add content — no manual sitemap editing ever)
- **`robots.txt`** — allow all public routes, explicitly disallow `/admin/*`
- **Image `alt` text** — required field in the admin form for every uploaded image, not optional
- **Semantic HTML** — proper heading hierarchy (one `<h1>` per page), `<nav>`, `<main>`, `<article>` tags

### 7.2 On-page/content SEO

- One dedicated landing page per Product (this is the exact strategy smalloys.com uses for every metal+shape combo — you replicate the pattern generically: one URL per product, one URL per category)
- Category pages act as topical hubs linking out to all products in that category (internal linking)
- Blog used to target long-tail informational queries that funnel into product pages (internal links from blog → relevant products)
- URL structure: clean, slug-based, no query strings — `/products/titanium/grade-2-plate` not `/products?id=482`

### 7.3 Performance SEO (Core Web Vitals — Google ranking factor)

- Next.js `<Image>` component everywhere (auto width/height, lazy loading, modern formats like WebP/AVIF via Cloudinary)
- Minimize client-side JavaScript on public pages — keep interactivity (admin forms, filters) as isolated client components, keep product/blog pages as server components wherever possible
- Font optimization via `next/font` (no render-blocking font requests)
- Target scores: LCP < 2.5s, CLS < 0.1, INP < 200ms (measure with Lighthouse before launch)

### 7.4 Off-page/setup tasks (manual, one-time)

- Register site with Google Search Console, submit sitemap
- Set up Google Analytics or a privacy-friendlier alternative (Plausible/Umami — note: paid or self-hosted, GA4 is the free option)
- Register Google Business Profile if there's a physical location (mirrors smalloys.com's local-SEO angle)

---

## 8. Security Checklist

- Environment variables (`.env.local`) for all secrets (Mongo URI, JWT secret, Cloudinary keys) — **never committed to Git**. Add `.env*` to `.gitignore` from commit #1.
- Passwords hashed with `bcrypt` (never store plaintext)
- JWT stored in httpOnly, secure, sameSite cookies (not localStorage — vulnerable to XSS)
- All admin API routes verify JWT server-side on every request, no exceptions
- Input validation/sanitization on every write endpoint (reject malformed data before it reaches Mongoose) — a library like `zod` is worth adding here
- Rate limiting on the login route (prevent brute-force — even a simple in-memory counter helps at this scale)
- Cloudinary uploads restricted to image MIME types and a max file size, checked server-side, not just client-side
- HTTPS everywhere — automatic on Vercel, no action needed

---

## 9. Phase-Wise Implementation Plan (Local → Production)

### Phase 0 — Environment Setup (0.5 day)

- [ ] Install Node.js (LTS), Git
- [ ] Create GitHub repository, add `.gitignore` (node_modules, .env\*)
- [ ] `npx create-next-app@latest` — enable Tailwind, App Router, ESLint
- [ ] Create free MongoDB Atlas account → free M0 cluster → get connection string → whitelist IP (0.0.0.0/0 for dev, tighten later if possible)
- [ ] Create free Cloudinary account → get cloud name, API key, API secret
- [ ] Create `.env.local` with all secrets, confirm it's git-ignored
- [ ] `npm install mongoose bcryptjs jsonwebtoken cloudinary` (+ `zod` for validation, `slugify` for slug generation)

### Phase 1 — Data Layer (1 day)

- [ ] Write `lib/db.js` with cached-connection pattern (critical: prevents "too many connections" errors in serverless environment)
- [ ] Write all four Mongoose models (Category, Product, BlogPost, Admin)
- [ ] Manually seed one Admin document via a one-off script (hash a password with bcrypt, insert directly into Atlas or via a temporary script)
- [ ] Manually insert 2-3 test categories and products directly in Atlas UI to have data to build against

### Phase 2 — Core Backend CRUD (2-3 days)

- [ ] `/api/categories` — GET (list), POST (create)
- [ ] `/api/products` — GET (list, with pagination + filter by category), POST (create)
- [ ] `/api/products/[id]` — GET, PUT, DELETE
- [ ] `/api/blog` and `/api/blog/[id]` — same pattern
- [ ] Test every route with Thunder Client/Postman/Insomnia before writing any UI
- [ ] Add `zod` validation schemas for each POST/PUT body

### Phase 3 — Authentication (1-2 days)

- [ ] `/api/auth/login` — verify credentials, issue JWT cookie
- [ ] `/api/auth/logout` — clear cookie
- [ ] `lib/auth.js` — `requireAuth()` helper used at the top of every protected route handler
- [ ] Protect all write routes from Phase 2 with `requireAuth()`
- [ ] Test: confirm write routes reject requests without a valid cookie (use Postman without the cookie to verify 401)

### Phase 4 — Image Upload Pipeline (1 day)

- [ ] `lib/cloudinary.js` — server-side upload/delete helpers
- [ ] `/api/upload` route — protected, accepts file, uploads to Cloudinary, returns URL
- [ ] Wire delete: when a product/blog image is removed, also call Cloudinary delete (avoid orphaned assets)

### Phase 5 — Admin Dashboard UI (4-5 days)

- [ ] `/admin/login` page + redirect logic
- [ ] `admin/layout.jsx` — server-side auth guard for all nested admin routes
- [ ] Products: list (table/card responsive), create form, edit form (with dynamic specs/variants rows, image uploader with drag-drop and reorder)
- [ ] Blog: list, create/edit with TipTap editor + inline image upload
- [ ] Category management (simple CRUD, needed before products can be assigned)
- [ ] Toast notifications for save/error states
- [ ] Confirm delete actions with a modal (no accidental deletes)

### Phase 6 — Public Site UI (4-5 days)

- [ ] Shared layout: Navbar (responsive per Section 6), Footer
- [ ] Homepage: hero, category grid, featured products, stats, client logos (static or CMS-driven), contact CTA
- [ ] Category listing page (`/products/[category]`)
- [ ] Product detail page (`/products/[category]/[slug]`) — gallery, specs table, variants, quote CTA
- [ ] Blog listing + detail pages
- [ ] About, Contact (with a working contact form — can POST to a simple `/api/contact` that emails you via a free service like Resend's free tier, or just stores submissions in Mongo for now), Certificates page

### Phase 7 — SEO Implementation (2 days)

- [ ] `generateMetadata()` on every public page, pulling from DB `seoTitle`/`seoDescription` with sensible fallbacks
- [ ] JSON-LD structured data components for Product, Article, Organization
- [ ] `/sitemap.xml` route — dynamically built from live DB
- [ ] `/robots.txt` route
- [ ] Verify canonical tags, one `<h1>` per page, alt text present everywhere

### Phase 8 — Responsive QA Pass (1-2 days)

- [ ] Test every page against the full breakpoint matrix (Section 6.3)
- [ ] Fix overflow issues, tap-target sizing, table-to-card conversions on mobile
- [ ] Test on at least one real iOS and one real Android device if possible

### Phase 9 — Performance & Accessibility Pass (1 day)

- [ ] Run Lighthouse (Performance, SEO, Accessibility, Best Practices) on key pages — target 90+ on each
- [ ] Fix any render-blocking resources, oversized images, missing alt text, low-contrast text flagged by the audit
- [ ] Check keyboard navigation works for the admin forms at minimum

### Phase 10 — Pre-Launch Hardening (1 day)

- [ ] Re-check Security Checklist (Section 8) item by item
- [ ] Remove any test/seed data not meant for production
- [ ] Set real Admin credentials (not the dev test password)
- [ ] Confirm environment variables are set correctly in Vercel (not just locally)

### Phase 11 — Deployment (0.5 day)

- [ ] Push final code to GitHub `main` branch
- [ ] Import repo into Vercel, add all environment variables in the Vercel dashboard
- [ ] Trigger deploy, verify build succeeds
- [ ] Point custom domain (if owned) at Vercel, verify SSL auto-provisions
- [ ] Test the live production site end-to-end: public pages, admin login, product CRUD, blog CRUD, image upload

### Phase 12 — Post-Launch (ongoing)

- [ ] Submit sitemap to Google Search Console
- [ ] Set up Google Analytics / alternative
- [ ] Monitor MongoDB Atlas free-tier storage usage (512MB cap) and Cloudinary free-tier usage (25GB cap) periodically so you're not surprised by limits
- [ ] Set up Vercel deployment notifications (email/Slack on failed builds)

---

## 10. Estimated Timeline

**~4-5 weeks part-time** (evenings/weekends), broken down as:

- Setup + backend (Phases 0-4): ~1 week
- Admin + public UI (Phases 5-6): ~2 weeks
- SEO + QA + hardening (Phases 7-10): ~1 week
- Deployment + launch (Phase 11): ~1 day

---

## 11. Known Risks / Honest Caveats

- **Free tier limits are real, not theoretical.** MongoDB Atlas M0 caps at 512MB — fine for text/product data, but you must keep only URLs (not raw images) in the database. Cloudinary's free tier caps at 25GB bandwidth/month — if traffic grows meaningfully, this becomes a real constraint, not a hypothetical one.
- **Vercel serverless functions have execution time limits** on the free tier (10s on Hobby) — large image uploads or heavy processing could hit this; keep upload handling lean and consider client-side image compression before upload if this becomes an issue.
- **Single-admin auth is appropriate for solo use only.** If more than one person will manage content, revisit the auth model (roles/permissions) before launch, not after.
- **SEO takes time regardless of technical correctness.** Everything in Section 7 removes technical barriers to ranking; it does not guarantee ranking. Content quality and backlinks still matter and are outside this plan's scope.
