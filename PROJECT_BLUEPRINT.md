# 🖋️ Inkwell — Project Blueprint

> **Version:** 1.1.0 · **Stack:** Next.js 15 + Express + MongoDB · **Package Manager:** pnpm (v11)
> A Medium-inspired publishing platform — read, write, and share stories. Optimized for SEO, subdomains, and data export portability.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Layout (Monorepo)](#2-repository-layout-monorepo)
3. [Technology Stack](#3-technology-stack)
4. [Architecture Diagram](#4-architecture-diagram)
5. [Server Architecture (Backend)](#5-server-architecture-backend)
   - 5.1 [Entry Point & Bootstrap](#51-entry-point--bootstrap)
   - 5.2 [Configuration Layer](#52-configuration-layer)
   - 5.3 [Database Models](#53-database-models)
   - 5.4 [Middleware Chain](#54-middleware-chain)
   - 5.5 [Routes & Controllers](#55-routes--controllers)
   - 5.6 [Utility Functions](#56-utility-functions)
   - 5.7 [Input Validation](#57-input-validation)
   - 5.8 [Seed & Verification Scripts](#58-seed--verification-scripts)
6. [Client Architecture (Frontend)](#6-client-architecture-frontend)
   - 6.1 [Next.js App Router Layout Tree](#61-nextjs-app-router-layout-tree)
   - 6.2 [Route Pages](#62-route-pages)
   - 6.3 [Component Library](#63-component-library)
   - 6.4 [State Management & Context](#64-state-management--context)
   - 6.5 [API Client (lib/api.js)](#65-api-client-libapiJs)
   - 6.6 [Custom Hooks](#66-custom-hooks)
   - 6.7 [Design System (Tailwind)](#67-design-system-tailwind)
7. [Authentication & Subdomain Flow](#7-authentication--subdomain-flow)
8. [Data Flow — End-to-End](#8-data-flow--end-to-end)
9. [API Reference](#9-api-reference)
10. [Security Model](#10-security-model)
11. [File Upload & Export Pipelines](#11-file-upload--export-pipelines)
12. [Environment Variables](#12-environment-variables)
13. [Scripts & Developer Workflow](#13-scripts--developer-workflow)
14. [Out of Scope (MVP)](#14-out-of-scope-mvp)
15. [Future / Post-MVP Roadmap](#15-future--post-mvp-roadmap)

---

## 1. Project Overview

**Inkwell** is a full-stack, Medium-inspired content publishing platform. Writers can create richly
formatted stories using a WYSIWYG Tiptap editor. Every story is indexable by search engines from day one
with canonical links and schema-rich metadata. Users retain true ownership of their content with full profile,
JSON, and Markdown-rendered file exports.

| Attribute       | Value                                          |
|-----------------|------------------------------------------------|
| Project name    | `inkwell`                                      |
| Accent color    | Deep Indigo (`#4f46e5` — distinct from Medium) |
| Auth strategy   | JWT in httpOnly cookies (access + refresh)     |
| Storage         | Local disk (MVP); upgrade path: Cloudinary     |
| Database        | MongoDB (local or Atlas free M0)               |
| Deployment      | Run locally; cloud-ready via env swap          |

---

## 2. Repository Layout (Monorepo)

```
inkwell/                            ← pnpm workspace root
│
├── package.json                    ← Root scripts: dev, build, start, seed
├── pnpm-workspace.yaml             ← Workspace: ["client", "server"]
├── pnpm-lock.yaml                  ← Lockfile (pnpm v11)
├── .npmrc                          ← pnpm settings
├── .gitignore
├── README.md
├── PROJECT_BLUEPRINT.md            ← This document
│
├── client/                         ← Next.js 15 frontend (port 3000)
│   ├── package.json
│   ├── next.config.mjs             ← Image remote patterns, API URL
│   ├── tailwind.config.js          ← Design tokens, typography plugin
│   ├── postcss.config.mjs
│   ├── jsconfig.json               ← Path alias: @/ → src/
│   ├── .env.example / .env.local
│   ├── public/
│   │   └── google37b5f6fe1e66acb6.html ← Google Search Console site verification file
│   └── src/
│       ├── middleware.js           ← Subdomain rewrites (ada.inkwell.app → /@ada)
│       ├── app/                    ← App Router root
│       │   ├── layout.jsx          ← Root layout: fonts + AuthProvider
│       │   ├── globals.css         ← Base CSS + Tailwind directives
│       │   ├── sitemap.js          ← Dynamic sitemap.xml route generator
│       │   ├── robots.js           ← Dynamic robots.txt route generator
│       │   ├── (auth)/             ← Route group: no Navbar
│       │   │   ├── layout.jsx      ← Centered logo header only
│       │   │   ├── login/page.jsx
│       │   │   └── register/page.jsx
│       │   └── (main)/             ← Route group: Navbar + Footer
│       │       ├── layout.jsx      ← Navbar + main + Footer wrapper
│       │       ├── page.jsx        ← Home feed (/)
│       │       ├── [username]/page.jsx    ← Profile (/@username)
│       │       ├── bookmarks/page.jsx
│       │       ├── edit/[slug]/page.jsx
│       │       ├── new-story/page.jsx
│       │       ├── p/[slug]/page.jsx      ← Server Component: dynamic metadata + JSON-LD
│       │       │   └── StoryPageClient.jsx ← Client interactivity wrapper (claps, comments)
│       │       ├── search/page.jsx
│       │       ├── settings/page.jsx
│       │       └── tag/[tag]/page.jsx
│       ├── components/
│       │   ├── editor/
│       │   │   ├── StoryComposer.jsx     ← Full create/edit form
│       │   │   └── StoryEditor.jsx       ← Tiptap WYSIWYG core
│       │   ├── layout/
│       │   │   ├── Navbar.jsx            ← Sticky header, search, avatar menu
│       │   │   ├── Footer.jsx
│       │   │   ├── Logo.jsx
│       │   │   ├── MobileDrawer.jsx      ← Hamburger nav overlay
│       │   │   └── RequireAuth.jsx       ← Auth gate wrapper
│       │   ├── post/
│       │   │   ├── PostCard.jsx          ← Feed card
│       │   │   ├── PostList.jsx          ← Infinite-scroll list
│       │   │   ├── ClapButton.jsx        ← Multi-clap + optimistic update
│       │   │   ├── BookmarkButton.jsx    ← Toggle bookmark
│       │   │   ├── CommentSection.jsx    ← Comments list + form
│       │   │   └── TrendingTags.jsx      ← Sidebar tag cloud
│       │   ├── profile/
│       │   │   └── FollowButton.jsx      ← Toggle follow/unfollow
│       │   └── ui/
│       │       ├── Avatar.jsx            ← Image + initials fallback
│       │       ├── Button.jsx            ← Variants: default, secondary, ghost, danger
│       │       ├── Input.jsx             ← Styled form input
│       │       └── Skeleton.jsx          ← Loading placeholder
│       ├── context/
│       │   └── AuthContext.jsx           ← Global auth state + actions
77:       ├── hooks/
│       │   └── useInfiniteScroll.js      ← IntersectionObserver sentinel
│       └── lib/
│           ├── api.js                    ← Fetch wrapper + token refresh
│           └── utils.js                  ← formatDate, formatCount, cx, initials
│
└── server/                         ← Express API (port 5000)
    ├── package.json
    ├── nodemon.json                 ← Watch: src/**/*.js
    ├── .env.example / .env
    ├── uploads/                     ← Local image storage (gitignored)
    └── src/
        ├── server.js                ← Bootstrap: DB connect → listen
        ├── app.js                   ← Express app: CORS, body parsers, routes
        ├── config/
        │   ├── env.js               ← Validated env object
        │   └── db.js                ← Mongoose connect
        ├── models/
        │   ├── User.js              ← Schema + export, subdomain, bookmarks
        │   ├── Post.js              ← Schema + seo fields, indexable, pre-save hooks
        │   └── Comment.js           ← Schema
        ├── controllers/
        │   ├── auth.controller.js   ← register, login, logout, refresh, me
        │   ├── post.controller.js   ← CRUD + sitemap-data, clap, bookmark, trendingTags
        │   ├── user.controller.js   ← profile, updateMe, uploadAvatar, follow, bookmarks, export
        │   └── comment.controller.js← list, add, delete
        ├── routes/
        │   ├── auth.routes.js
        │   ├── post.routes.js
        │   ├── user.routes.js
        │   ├── comment.routes.js
        │   ├── upload.routes.js
        │   └── feed.routes.js       ← RSS feeds routes (global, author, tag)
        ├── middlewares/
        │   ├── auth.middleware.js   ← requireAuth / optionalAuth
        │   ├── error.middleware.js  ← notFound + centralized errorHandler
        │   ├── rateLimiter.js       ← authLimiter (50/15m), generalLimiter (1000/15m)
        │   ├── upload.middleware.js ← Multer: disk storage, 5MB limit, image-only
        │   └── validate.js          ← express-validator result handler
        ├── utils/
        │   ├── jwt.js               ← sign/verify tokens + cookie helpers
        │   ├── apiResponse.js       ← sendSuccess() + ApiError class
        │   ├── asyncHandler.js      ← try/catch wrapper for async controllers
        │   ├── slugify.js           ← baseSlug() + makeSlug() (unique suffix)
        │   ├── sanitize.js          ← sanitize-html: strips XSS from editor HTML
        │   ├── readTime.js          ← estimateReadTime() at 200 WPM
        │   ├── rss.js               ← RSS feed builder utilizing 'feed' library
        │   └── exportAccount.js     ← ZIP stream export using 'archiver' + 'turndown'
        ├── validators/
        │   ├── auth.validator.js    ← registerRules, loginRules
        │   └── post.validator.js    ← createPostRules, updatePostRules, commentRules
        └── scripts/
            ├── seed.js              ← Demo data: 5 users, 15 posts, comments, follows, claps
            ├── test_seo_spec.js     ← Verification script for user/post model schemas
            └── reset_export_limit.js ← Utility script to reset export limits for developer testing
```

---

## 3. Technology Stack

### Backend

| Layer            | Technology                | Version   | Purpose                                   |
|------------------|---------------------------|-----------|-------------------------------------------|
| Runtime          | Node.js                   | v20+      | JavaScript runtime                        |
| Framework        | Express                   | 4.21.x    | HTTP server & routing                     |
| Database         | MongoDB + Mongoose         | 8.9.x     | Document DB + ODM                         |
| Auth             | jsonwebtoken              | 9.0.x     | JWT signing & verification                |
| Password hashing | bcryptjs                  | 2.4.x     | Bcrypt (cost 12)                          |
| Cookies          | cookie-parser             | 1.4.x     | Parse incoming cookies                    |
| CORS             | cors                      | 2.8.x     | Cross-origin allow with credentials       |
| Validation       | express-validator         | 7.2.x     | Request body validation rules             |
| Rate limiting    | express-rate-limit        | 7.4.x     | IP-based throttle                         |
| File uploads     | multer                    | 1.4.x     | Multipart form-data handler               |
| HTML sanitize    | sanitize-html             | 2.14.x    | Strip XSS from Tiptap output              |
| RSS Syndication  | feed                      | 4.2.x     | Construct standard RSS 2.0 feeds          |
| Markdown Convert | turndown                  | 7.2.x     | HTML to Markdown converter                |
| ZIP compression  | archiver                  | 7.0.x     | ZIP streaming library                     |
| Environment      | dotenv                    | 16.4.x    | Load .env file                            |
| Dev server       | nodemon                   | 3.1.x     | Auto-restart on file change               |

### Frontend

| Layer         | Technology                 | Version   | Purpose                                   |
|---------------|----------------------------|-----------|-------------------------------------------|
| Framework     | Next.js (App Router)       | 15.1.4    | SSR/CSR routing, image optimization       |
| UI Library    | React                      | 19.0.x    | Component model                           |
| Styling       | Tailwind CSS               | 3.4.x     | Utility-first CSS                         |
| Typography    | @tailwindcss/typography    | 0.5.x     | Prose styles for article content          |
| Rich editor   | Tiptap + extensions        | 2.10.x    | ProseMirror-based WYSIWYG                 |
| Fonts         | Google Fonts via next/font | —         | Inter (sans), Source Serif 4 (serif)      |

### Tooling

| Tool      | Purpose                                              |
|-----------|------------------------------------------------------|
| pnpm      | Monorepo package manager with workspaces             |
| concurrently | Run client + server in parallel with one command  |
| Git       | Version control                                      |

---

## 4. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER (User)                              │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Next.js 15 Client  (localhost:3000)             │   │
│  │                                                              │   │
│  │  ┌──────────────┐  ┌─────────────────┐  ┌───────────────┐   │   │
│  │  │  AuthContext  │  │  Route Pages    │  │  middleware   │   │   │
│  │  │  (React ctx) │  │  (App Router)   │  │  (subdomains) │   │   │
│  │  │  user state  │  │  sitemap.js     │  │               │   │   │
│  │  │  login/logout│  │  robots.js      │  │               │   │   │
│  │  └──────┬───────┘  └────────┬────────┘  └───────┬───────┘   │   │
│  │         │                   │                    │            │   │
│  │         └───────────────────┼────────────────────┘            │   │
│  │                             │                                  │   │
│  │                    lib/api.js (apiFetch)                       │   │
│  │         fetch() with credentials + auto token refresh          │   │
│  └─────────────────────────────┬────────────────────────────────┘   │
│                                 │  httpOnly cookies                   │
│                     HTTP + JSON │  (accessToken, refreshToken)        │
└─────────────────────────────────┼───────────────────────────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │  Express API (localhost:5000) │
                    │                              │
                    │  CORS ← CLIENT_URL           │
                    │  Rate limiters               │
                    │  Cookie parser               │
                    │  Body parser (JSON 1MB)       │
                    │                              │
                    │  /api/auth/*   authLimiter   │
                    │  /api/posts/*                │
                    │  /api/users/*                │
                    │  /api/comments/*             │
                    │  /api/feed/*                 │
                    │  /api/uploads/*              │
                    │  /uploads/*    static files  │
                    │                              │
                    │  ┌──────────────────────┐   │
                    │  │   Middleware Chain    │   │
                    │  │  requireAuth         │   │
                    │  │  optionalAuth        │   │
                    │  │  validate            │   │
                    │  └──────────────────────┘   │
                    │                              │
                    │  Controllers → Models        │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────▼───────────────┐
                    │         MongoDB               │
                    │   Database: inkwell           │
                    │                               │
                    │  ┌────────┐  ┌─────────────┐ │
                    │  │  User  │  │    Post      │ │
                    │  │        │  │  (+ clapSub) │ │
                    │  └────────┘  └─────────────┘ │
                    │         ┌──────────┐          │
                    │         │ Comment  │          │
                    │         └──────────┘          │
                    └───────────────────────────────┘
```

---

## 5. Server Architecture (Backend)

### 5.1 Entry Point & Bootstrap

#### `server/src/server.js`
The application bootstrap. Sequence:
1. Call `connectDB()` — connects Mongoose to MongoDB.
2. `app.listen(env.port)` — starts HTTP server.
3. Register `SIGINT` / `SIGTERM` handlers for graceful shutdown.

#### `server/src/app.js`
Creates and configures the Express application:
- `app.set('trust proxy', 1)` — trust reverse proxy (for rate limiter IP detection).
- CORS with `credentials: true` and origin locked to `env.clientUrl`.
- JSON body parser (1 MB limit) + URL-encoded + cookie-parser.
- `express.static` on `/uploads/` with 7-day cache + `Cross-Origin-Resource-Policy: cross-origin`.
- Health check: `GET /api/health`.
- Rate limiters and route mounts.
- 404 handler + centralized error handler at the bottom.

---

### 5.2 Configuration Layer

#### `server/src/config/env.js`
Loads `server/.env` via dotenv. Exports a typed config object:

| Property          | Type    | Default                             |
|-------------------|---------|-------------------------------------|
| `port`            | number  | `5000`                              |
| `nodeEnv`         | string  | `"development"`                     |
| `clientUrl`       | string  | `"http://localhost:3000"`           |
| `mongoUri`        | string  | `"mongodb://127.0.0.1:27017/inkwell"` |
| `jwtAccessSecret` | string  | `"dev_access_secret_change_me"`     |
| `jwtRefreshSecret`| string  | `"dev_refresh_secret_change_me"`    |
| `jwtAccessExpires`| string  | `"15m"`                             |
| `jwtRefreshExpires`| string | `"7d"`                              |
| `cookieSecure`    | boolean | `false` (set `true` in prod/HTTPS)  |
| `isProd`          | boolean | Derived from `nodeEnv === 'production'` |

#### `server/src/config/db.js`
- Sets `strictQuery: true` (Mongoose 8 safe default).
- Connects to `env.mongoUri`.
- Logs host/db name on success; calls `process.exit(1)` on fatal error.

---

### 5.3 Database Models

#### `User` model — `server/src/models/User.js`

| Field       | Type               | Constraints                                   |
|-------------|--------------------|-----------------------------------------------|
| `name`      | String             | required, maxlength 80                        |
| `username`  | String             | required, unique, lowercase, 3–30 chars, indexed |
| `email`     | String             | required, unique, lowercase, indexed          |
| `password`  | String             | required, `select: false` (never returned)    |
| `bio`       | String             | maxlength 200, default `""`                   |
| `avatarUrl` | String             | default `""`                                  |
| `followers` | [ObjectId → User]  | Array of follower user refs                   |
| `following` | [ObjectId → User]  | Array of following user refs                  |
| `bookmarks` | [ObjectId → Post]  | Array of bookmarked post refs                 |
| `subdomain` | String             | lowercase, unique, sparse index               |
| `customDomain`| String           | default `null` (v2 BYO custom domain)         |
| `exportRequestedAt` | Date       | Timestamp throttle for account zip downloads  |
| `exportStatus` | String          | enum: `"idle" \| "pending" \| "ready" \| "failed"`, default `"idle"` |
| `passwordResetTokenHash` | String | `select: false` — SHA-256 of the emailed reset token; raw token is never stored |
| `passwordResetExpiresAt` | Date  | `select: false` — reset token TTL (30 min from request) |
| `createdAt` / `updatedAt` | Date | auto via timestamps                    |

**Hooks & methods:**
- `pre('save')` — bcrypt hash (cost 12) if password modified.
- `comparePassword(candidate)` — bcrypt compare.
- `toPublicJSON(includeEmail)` — safe API shape, includes subdomain/customDomain properties, never leaks password.

---

#### `Post` model — `server/src/models/Post.js`

| Field            | Type                | Constraints / Notes                          |
|------------------|---------------------|----------------------------------------------|
| `title`          | String              | required, maxlength 160                      |
| `subtitle`       | String              | maxlength 200, default `""`                  |
| `slug`           | String              | required, unique, indexed                    |
| `contentHtml`    | String              | required — sanitized HTML from Tiptap        |
| `coverImage`     | String              | URL or relative `/uploads/` path             |
| `tags`           | [String]            | max 5, indexed                               |
| `author`         | ObjectId → User     | required, indexed                            |
| `status`         | `"draft"` \| `"published"` | default `"draft"`, indexed          |
| `claps`          | [clapSchema]        | embedded `{ user, count (0–50) }` subdocs    |
| `totalClaps`     | Number              | denormalized sum                             |
| `views`          | Number              | incremented on published reads (non-author)  |
| `readTimeMinutes`| Number              | computed at 200 WPM                          |
| `publishedAt`    | Date                | set on first publish                         |
| `seo`            | subdocument         | contains optional override metadata (`metaTitle`, `metaDescription`, `canonicalUrl`) |
| `indexable`      | Boolean             | default `false`, sets to `true` on publish   |

**Indexes:**
- Full-text: `{ title: 'text', subtitle: 'text', tags: 'text' }` — powers `?q=` search.
- Compound: `{ status: 1, publishedAt: -1 }` — powers feed sort.

**Hooks & methods:**
- `pre('save')` — recomputes `readTimeMinutes` when `contentHtml` changes, forces `indexable = true` and generates the unique `canonicalUrl` based on site env values on the first published save. Reverts `indexable` to `false` if post status flips back to draft.
- `toCardJSON(viewerId)` — feed-safe response shape including viewer-specific clap count, indexable state, and custom SEO configurations.

---

#### `Comment` model — `server/src/models/Comment.js`

| Field     | Type            | Constraints                |
|-----------|-----------------|----------------------------|
| `post`    | ObjectId → Post | required, indexed          |
| `author`  | ObjectId → User | required                   |
| `content` | String          | required, maxlength 2000   |

---

### 5.4 Middleware Chain

The request flows through:

```
Request
  │
  ├─ CORS (allow CLIENT_URL + credentials)
  ├─ express.json() body parser (1 MB)
  ├─ express.urlencoded()
  ├─ cookieParser()
  │
  ├─ /uploads/* → express.static (served files)
  ├─ /api/health → quick health check
  │
  ├─ /api/* → generalLimiter (1000 req / 15 min / IP)
  │
  ├─ /api/auth/* → authLimiter (50 req / 15 min / IP) → auth routes
  ├─ /api/posts/* → post routes
  ├─ /api/users/* → user routes
  ├─ /api/comments/* → comment routes
  ├─ /api/feed/* → feed routes (RSS feeds)
  ├─ /api/uploads/* → upload routes
  │
  ├─ notFound (404 catcher)
  └─ errorHandler (centralized)
```

#### `auth.middleware.js` — Two guard modes

| Middleware    | Behavior                                                        |
|---------------|-----------------------------------------------------------------|
| `requireAuth` | Reads `accessToken` cookie → verifies → loads user → `req.user`. Throws 401 if missing/invalid. |
| `optionalAuth`| Same as above but silently ignores missing/invalid token. Used on public endpoints needing viewer personalization (clap state, bookmark state). |

#### `error.middleware.js` — Centralized error handling

Normalizes all errors into `{ success: false, message, errors? }`:
- `ValidationError` → 400 with field-level messages
- MongoDB `code 11000` duplicate key → 409 "already taken"
- Mongoose `CastError` (bad ObjectId) → 400
- `ApiError` instances → their `statusCode`
- Unknown → 500 (stack trace excluded in production)

#### `rateLimiter.js`

| Limiter          | Window  | Max Requests | Applied To        |
|------------------|---------|--------------|-------------------|
| `authLimiter`    | 15 min  | 50           | `/api/auth/*`     |
| `generalLimiter` | 15 min  | 1,000        | All `/api/*`      |

#### `upload.middleware.js`

- Storage: `multer.diskStorage` → `server/uploads/` with random 24-hex filename.
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
- File size limit: **5 MB**.

#### `validate.js`

Runs `validationResult(req)` after express-validator rule arrays. Returns 422 with field errors on failure.

---

### 5.5 Routes & Controllers

#### Auth (`/api/auth/`)

| Method | Path       | Auth      | Description                                      |
|--------|------------|-----------|--------------------------------------------------|
| POST   | /register  | —         | Create account; issues access + refresh cookies  |
| POST   | /login     | —         | Verify credentials; issues cookies               |
| POST   | /logout    | required  | Clears both auth cookies                         |
| POST   | /refresh   | —         | Reads refreshToken cookie → rotates both tokens  |
| GET    | /me        | required  | Returns current user (`toPublicJSON(true)`)      |

**Token strategy:**
- `signAccessToken(userId)` → JWT signed with `jwtAccessSecret`, expires in `15m`.
- `signRefreshToken(userId)` → JWT signed with `jwtRefreshSecret`, expires in `7d`.
- Both set as `httpOnly`, `sameSite: lax`, `secure: env.cookieSecure` cookies.

---

#### Posts (`/api/posts/`)

| Method | Path                | Auth              | Description                                      |
|--------|---------------------|-------------------|--------------------------------------------------|
| GET    | /tags/trending      | —                 | Top N tags by post count (MongoDB aggregation)   |
| GET    | /sitemap-data       | —                 | Minimal public fields query for sitemap generation |
| GET    | /                   | optional          | Cursor-paginated feed (filters: tag, author, q, status) |
| POST   | /                   | required          | Create post (draft or publish immediately)       |
| GET    | /:slug              | optional          | Single post (views++ if published + non-author)  |
| PATCH  | /:slug              | required (author) | Update fields; change status draft↔published     |
| DELETE | /:slug              | required (author) | Delete post + remove from all bookmarks          |
| POST   | /:slug/clap         | required          | Multi-clap (capped at 50/user, batched)          |
| POST   | /:slug/bookmark     | required          | Toggle bookmark on req.user                      |
| GET    | /:slug/comments     | —                 | List all comments for a post                     |
| POST   | /:slug/comments     | required          | Add a comment                                    |

**Feed query parameters:**
- `cursor` — ObjectId for cursor pagination (newest-first by `_id`)
- `limit` — max 30 (default 10)
- `tag` — filter by tag
- `author` — filter by username
- `q` — full-text MongoDB search
- `status` — `draft` or `all` (only for own posts)

**Clap logic:**
- Per-user clap subdocument embedded in post.
- Cap: 50 claps per user per story.
- Batching handled client-side (debounced 500ms).
- `totalClaps` is a denormalized sum updated on each save.

---

#### Users (`/api/users/`)

| Method | Path               | Auth              | Description                            |
|--------|--------------------|-------------------|----------------------------------------|
| GET    | /me/bookmarks      | required          | Current user's bookmarked posts        |
| PATCH  | /me                | required          | Update name, bio, avatarUrl            |
| POST   | /me/avatar         | required          | Upload avatar image (multipart)        |
| POST   | /me/export/request | required          | Request account ZIP export (1/24h)     |
| GET    | /me/export/download| required          | Streams down the account export ZIP    |
| PATCH  | /me/subdomain      | required          | Claims a custom unique subdomain name  |
| GET    | /:username         | optional          | Public profile + post count + isFollowing |
| POST   | /:username/follow  | required          | Toggle follow / unfollow               |

---

#### RSS Feeds (`/api/feed/`)

| Method | Path               | Auth              | Description                            |
|--------|--------------------|-------------------|----------------------------------------|
| GET    | /rss               | —                 | Latest 50 posts published site-wide    |
| GET    | /user/:username/rss| —                 | Latest 50 posts published by user      |
| GET    | /tag/:tag/rss      | —                 | Latest 50 posts published under tag    |

---

#### Comments (`/api/comments/`)

| Method | Path  | Auth              | Description                    |
|--------|-------|-------------------|--------------------------------|
| DELETE | /:id  | required (author) | Delete own comment             |

---

#### Uploads (`/api/uploads/`)

| Method | Path    | Auth     | Description                                              |
|--------|---------|----------|----------------------------------------------------------|
| POST   | /image  | required | Upload image; returns `{ url: "/uploads/<filename>" }`  |

---

### 5.6 Utility Functions

| File              | Function(s)              | Purpose                                              |
|-------------------|--------------------------|------------------------------------------------------|
| `jwt.js`          | `signAccessToken(userId)`| Sign 15-min JWT with access secret                   |
|                   | `signRefreshToken(userId)`| Sign 7-day JWT with refresh secret                  |
|                   | `verifyAccessToken(token)`| Verify + decode access JWT                          |
|                   | `verifyRefreshToken(token)`| Verify + decode refresh JWT                        |
|                   | `setAuthCookies(res, tokens)` | Set both cookies (httpOnly, sameSite: lax)      |
|                   | `clearAuthCookies(res)`   | Clear both cookies on logout                        |
| `apiResponse.js`  | `sendSuccess(res, status, data, message)` | Standard `{ success:true, data, message }` |
|                   | `ApiError(statusCode, message, errors)` | Operational error class                 |
| `asyncHandler.js` | `asyncHandler(fn)`       | Wraps async express handlers; forwards errors to next() |
| `slugify.js`      | `baseSlug(text)`         | Lowercase, hyphenated, 80-char slug                  |
|                   | `makeSlug(title)`        | `baseSlug + "-" + 8 random hex chars` (unique)       |
| `sanitize.js`     | `sanitizeContent(dirty)` | strips `<script>`, event attrs, `javascript:` URLs   |
| `readTime.js`     | `estimateReadTime(html)` | Strips tags, counts words ÷ 200 WPM, min 1 minute   |
| `rss.js`          | `buildFeed(params)`      | Generates XML RSS feed string using `feed` library   |
| `exportAccount.js`| `streamExport(res, u, p)`| Streams a compressed ZIP directory of user data using `archiver` and `turndown` |

---

### 5.7 Input Validation

All validation is done via `express-validator` before controllers run.

#### Auth validators
- `registerRules`: name (required), username (3–30, `[a-z0-9_]`), email (valid format), password (min 8)
- `loginRules`: email (valid), password (not empty)
- `forgotPasswordRules`: email (valid format)
- `resetPasswordRules`: token (64-char hex), password (min 8)

#### Post validators
- `createPostRules`: title (required, max 160), subtitle (optional, max 200), contentHtml (optional, string), tags (optional, array max 5), status (optional, draft|published), seo.metaTitle (optional, max 160), seo.metaDescription (optional, max 200)
- `updatePostRules`: all optional variants of above
- `commentRules`: content (required, max 2000)

#### User validators
- `updateSubdomainRules`: subdomain (required, 3-30 chars, lowercase letters, numbers, and hyphens `[a-z0-9-]`, unique subdomain check, reserved blacklist check, username collision check)

---

### 5.8 Seed & Verification Scripts

#### `server/src/scripts/seed.js` — run with `pnpm seed`
1. Clears all `User`, `Post`, `Comment` documents.
2. Creates **5 demo users** (Ada Lovelace, James Baldwin, Grace Hopper, Maya Chen, Leo Torres).
   - Password: `password123` (bcrypt-hashed via model hook)
   - Avatar: `https://i.pravatar.cc/200?img=N`
3. Creates **15 published posts** distributed round-robin across users.
   - `publishedAt` staggered 26h apart (last ~15 days)
   - Cover images from picsum.photos
   - Deterministic clap counts from adjacent users
   - Views seeded with variety
4. Adds **1 comment per post** from adjacent user.
5. Wires **follow relationships**: everyone follows Ada & Grace; Ada follows Grace & Maya.
6. Seeds **bookmarks**: Ada saves posts 1 & 3; Maya saves post 0.

#### `server/src/scripts/test_seo_spec.js` — run with `node src/scripts/test_seo_spec.js`
1. Connects to database.
2. Performs mock updates on User subdomain and verifies validation limits.
3. Performs mock updates on Post SEO fields and validates pre-save canonical / indexable auto-updates.

#### `server/src/scripts/reset_export_limit.js` — run with `node src/scripts/reset_export_limit.js`
1. Connects to database.
2. Resets the rate limit throttle for account exports across all users to allow repeat testing.

#### `server/src/scripts/run_evidence_verification.js` — run with `node src/scripts/run_evidence_verification.js`
1. Connects to database.
2. Runs 10 comprehensive verification tests covering authenticated flows, indexing invariants, canonical URL immutability, subdomain rules (including reserved list and username collisions), draft interaction gates, RSS syndication feeds, and dynamic sitemaps.
3. Automatically triggers Next.js frontend fetches (for robots.txt and sitemap.xml) and parses structural JSON-LD metadata for crawlers.
4. Performs a complete ZIP archive extraction to verify file counts and translations.

---

## 6. Client Architecture (Frontend)

### 6.1 Next.js App Router Layout Tree

```
RootLayout (app/layout.jsx)
│   Fonts: Inter + Source Serif 4 via CSS variables
│   Wraps all children in <AuthProvider>
│
├── AuthLayout ((auth)/layout.jsx)
│   Centered logo-only header; no Navbar/Footer
│   ├── /login
│   └── /register
│
└── MainLayout ((main)/layout.jsx)
    Navbar + <main> + Footer
    ├── /                    ← HomePage
    ├── /@[username]         ← ProfilePage
    ├── /bookmarks           ← BookmarksPage
    ├── /edit/[slug]         ← EditPage
    ├── /new-story           ← NewStoryPage
    ├── /p/[slug]            ← StoryPage (Server Component)
    │   └── StoryPageClient  ← Client Interactivity Wrapper
    ├── /search              ← SearchPage
    ├── /settings            ← SettingsPage
    └── /tag/[tag]           ← TagPage
```

**Note:** `/@[username]` is Next.js dynamic segment `[username]` capturing `@ada`; the page strips the `@` prefix. `/p/*`, `/search`, etc. take static precedence over `/@username`.

---

### 6.2 Route Pages

| Route                  | Component         | Key Features                                         |
|------------------------|-------------------|------------------------------------------------------|
| `/`                    | HomePage          | Hero section + `<PostList>` feed + `<TrendingTags>` sidebar |
| `/login`               | LoginPage         | Email/password form → `AuthContext.login()`          |
| `/register`            | RegisterPage      | Name/username/email/password → `AuthContext.register()` |
| `/@[username]`         | ProfilePage       | User bio, follow button, author's stories. Custom subdomain mapping rewrites resolve here. |
| `/p/[slug]`            | StoryPage         | Server Component. Feeds metadata, embeds JSON-LD schema, renders `<StoryPageClient>`. |
| `/new-story`           | NewStoryPage      | `<StoryComposer mode="create">`                     |
| `/edit/[slug]`         | EditPage          | `<StoryComposer mode="edit">` (author-only guard)    |
| `/settings`            | SettingsPage      | Profile edit form + avatar upload                    |
| `/bookmarks`           | BookmarksPage     | User's bookmarked posts via `GET /api/users/me/bookmarks` |
| `/search?q=`           | SearchPage        | Query `?q=` fed to `GET /api/posts?q=`               |
| `/tag/[tag]`           | TagPage           | Filter feed by `GET /api/posts?tag=`                 |

---

### 6.3 Component Library

#### `components/editor/`

**`StoryComposer.jsx`** — Full story creation/editing shell:
- Manages: title, subtitle, contentHtml, coverImage, tags, status, slug.
- Handles cover image upload via `POST /api/uploads/image`.
- `save(nextStatus)`: POST (create) or PATCH (edit) to the post API.
- After create → redirects to `/edit/[slug]` (draft) or `/p/[slug]` (publish).
- Shows error banner; Delete button in edit mode with confirmation.

**`StoryEditor.jsx`** — Tiptap WYSIWYG core:
- Extensions: StarterKit (H1–H3, code block), Image (no base64), Link (autolink), Placeholder.
- Sticky toolbar with: H1/H2/H3, Bold, Italic, Strikethrough, Blockquote, Bullet list, Ordered list, Code block, Link, Image.
- Image button → file picker → `POST /api/uploads/image` → `setImage()`.
- Syncs external `value` changes (for edit mode).

#### `components/layout/`

**`Navbar.jsx`** — Sticky top navigation:
- Desktop: Logo · search bar · (Write button + avatar menu) or (Sign in · Get started).
- Mobile: hamburger (→ `MobileDrawer`) + search toggle.
- Avatar dropdown: Profile, Write, Bookmarks, Settings, Sign out.
- Closes menus on `pathname` change.

**`MobileDrawer.jsx`** — Slide-in nav overlay for mobile breakpoints.

**`Footer.jsx`** — Minimal branding footer.

**`Logo.jsx`** — SVG Inkwell wordmark.

**`RequireAuth.jsx`** — Client-side auth gate; redirects to `/login` if not authenticated.

#### `components/post/`

**`PostCard.jsx`** — Feed card displaying:
- Author avatar + name (linked to profile) · date
- Title (serif, large) + subtitle (2-line clamp)
- First tag chip · read time · clap count (with icon)
- Optional cover thumbnail (lazy-loaded)
- Draft badge if `showStatus && status === 'draft'`

**`PostList.jsx`** — Infinite-scrolling list of `<PostCard>` items:
- Uses `useInfiniteScroll` hook with sentinel element.
- Fetches pages from `GET /api/posts` with cursor pagination.
- Accepts: `tag`, `author`, `q`, `status` filter props.
- Shows `<Skeleton>` loaders during first load.

**`ClapButton.jsx`** — Multi-clap interaction:
- Optimistic local state update on click.
- Batches rapid clicks via 500ms debounce before API call.
- 50 clap hard cap with visual disabled state.
- Unauthenticated users → redirect to `/login?next=/p/[slug]`.
- Rollback on API error.

**`BookmarkButton.jsx`** — Toggle bookmark:
- Calls `POST /api/posts/:slug/bookmark`.
- Optimistic state toggle.

**`CommentSection.jsx`** — Flat responses list:
- Loads on mount: `GET /api/posts/:slug/comments`.
- Authenticated users see textarea + Respond button.
- Optimistic prepend on submit; delete with optimistic removal + rollback.
- Shows character counter (max 2000).

**`TrendingTags.jsx`** — Sidebar tag cloud:
- Fetches `GET /api/posts/tags/trending`.
- Renders pill links to `/tag/[tag]`.

#### `components/profile/`

**`FollowButton.jsx`** — Toggle follow/unfollow:
- Calls `POST /api/users/:username/follow`.
- Shows real-time follower count.

#### `components/ui/`

| Component      | Description                                              |
|----------------|----------------------------------------------------------|
| `Avatar.jsx`   | Round image with initials fallback (from `utils.initials()`) |
| `Button.jsx`   | Variants: `default` (indigo), `secondary`, `ghost`, `danger` |
| `Input.jsx`    | Styled text input with label + error display             |
| `Skeleton.jsx` | Animated gray placeholder for loading states            |

---

### 6.4 State Management & Context

**`AuthContext.jsx`** — Single React context for global auth state:

```
AuthProvider
├── state: { user: AuthUser | null, loading: boolean }
├── refreshUser()  → GET /api/auth/me  (called on mount)
├── login(email, password)  → POST /api/auth/login
├── register(payload)       → POST /api/auth/register
├── logout()                → POST /api/auth/logout → user = null
└── setUser(u)              ← escape hatch for settings updates
```

- Bootstraps on app load by calling `/api/auth/me` (cookie auto-attached).
- `loading = true` until the initial `me` check completes (prevents flash).
- `useAuth()` hook — throws if used outside `AuthProvider`.

No external state library (Redux, Zustand, etc.) is used — React context is sufficient for this MVP scope.

---

### 6.5 API Client (`lib/api.js`)

**Core function: `apiFetch(path, options)`**
- Always sends `credentials: 'include'` (cookies cross-origin).
- Automatically sets `Content-Type: application/json` (unless FormData).
- On 401: silently attempts `POST /api/auth/refresh` once (singleton promise prevents stampedes).
  - If refresh succeeds → retries the original request.
  - If refresh fails → throws the 401 error.
- Parses JSON response; throws `ApiError` for non-2xx or `success: false` envelope.
- Returns `data` field of the success envelope.

**Convenience methods:**
```js
api.get(path)
api.post(path, data)
api.patch(path, data)
api.del(path)
api.upload(path, formData)
```

**`resolveMedia(path)`** — Converts relative `/uploads/...` paths to full `API_URL + path` URLs.

---

### 6.6 Custom Hooks

**`useInfiniteScroll(onLoadMore, { hasMore, loading })`**
- Uses `IntersectionObserver` on a sentinel element.
- When sentinel is visible and `hasMore && !loading`, calls `onLoadMore`.
- Returns a `sentinelRef` callback to attach to the sentinel DOM node.
- Disconnects observer on unmount.

---

### 6.7 Design System (Tailwind)

**Color palette:**
```
accent:
  50:  #eef2ff   100: #e0e7ff   200: #c7d2fe
  300: #a5b4fc   400: #818cf8   500: #6366f1
  600: #4f46e5 ← primary CTA   700: #4338ca
  800: #3730a3   900: #312e81

ink:
  DEFAULT: #242424  ← body text
  soft:    #6b6b6b  ← secondary text
  faint:   #a3a3a3  ← placeholder/meta text
```

**Typography:**
- `font-sans` → `var(--font-inter)` (Inter)
- `font-serif` → `var(--font-source-serif)` (Source Serif 4) — article titles & body

**Max widths:**
- `max-w-reading` → `680px` — article body
- `max-w-feed` → `728px` — post list feed

**Custom animation:**
- `animate-clap` → `scale(1) → scale(1.35) → scale(1)` in 0.3s — triggered on clap button click

**Typography plugin:** `@tailwindcss/typography` provides `prose` classes for rendering `contentHtml` in the story reader page.

---

## 7. Authentication & Subdomain Flow

```
┌──────────────┐              ┌──────────────┐              ┌──────────────┐
│    Browser   │              │  Express API  │              │  MongoDB     │
└──────┬───────┘              └──────┬───────┘              └──────┬───────┘
       │                             │                             │
       │  POST /api/auth/login       │                             │
       │  { email, password }        │                             │
       │────────────────────────────►│                             │
       │                             │  User.findOne({ email })    │
       │                             │  .select('+password')       │
       │                             │────────────────────────────►│
       │                             │◄────────────────────────────│
       │                             │  bcrypt.compare()           │
       │                             │                             │
       │                             │  signAccessToken(userId)    │
       │                             │  signRefreshToken(userId)   │
       │◄────────────────────────────│                             │
       │  Set-Cookie: accessToken    │                             │
       │  Set-Cookie: refreshToken   │                             │
       │  { success, data: { user }} │                             │
       │                             │                             │
       │  [Claim subdomain]          │                             │
       │  PATCH /api/users/me/sub    │                             │
       │  { subdomain: "ada-love" }  │                             │
       │────────────────────────────►│                             │
       │                             │  CheckReserved()            │
       │                             │  User.save()                │
       │◄────────────────────────────│                             │
       │  200 OK                     │                             │
       │                             │                             │
       │  [HTTP Request with subdomain]                            │
       │  GET ada-love.inkwell.app/  │                             │
       │  Next.js middleware rewrites│                             │
       │  internally to:             │                             │
       │  → /@ada-love/              │                             │
```

### Password Reset Flow

```
1. /forgot-password → POST /api/auth/forgot-password { email }
   - Rate limited: 5/hour per IP (each request sends an email).
   - If the account exists: 32-byte random token generated,
     SHA-256 hash + 30-min expiry saved on the user, raw token emailed
     as {CLIENT_URL}/reset-password?token=<raw>.
   - Response is IDENTICAL whether or not the email exists
     (no account enumeration). Email send failures are logged, never leaked.
2. Email link → /reset-password?token=... → POST /api/auth/reset-password
   - Looks up by hash(token) + unexpired TTL; 400 if invalid or expired.
   - Sets new password (bcrypt via pre-save hook), clears token fields
     (single-use), and issues a fresh session (auto-login).
```

**Email delivery** (`server/src/utils/email.js`) — provider picked from env, no code change needed:
| Env keys set | Provider |
|---|---|
| `RESEND_API_KEY` | Resend HTTP API (production; requires SPF/DKIM on the sending domain) |
| `MAILTRAP_API_TOKEN` + `MAILTRAP_INBOX_ID` | Mailtrap sandbox (dev — never reaches real inboxes) |
| none | Console log (zero-credential local testing) |

`EMAIL_FROM` sets the From header (default `Inkwell <onboarding@resend.dev>`). Templates live in `server/src/utils/emailTemplates.js` — table layout + inline CSS for email-client compatibility, with plaintext fallback.

---

## 8. Data Flow — End-to-End

### Reading the Home Feed

```
HomePage
  └─ <PostList> mounts
       │
       ├─ apiFetch('GET /api/posts?limit=10')
       │    └─ Express: optionalAuth → listPosts controller
       │         ├─ filter: { status: 'published' }
       │         ├─ Post.find().sort({_id: -1}).limit(11).populate('author')
       │         ├─ hasMore = docs.length > 10
       │         └─ posts.map(p => p.toCardJSON(viewerId))
       │
       ├─ Renders PostCard list
       └─ useInfiniteScroll sentinel
            └─ On intersect → apiFetch('GET /api/posts?cursor=<lastId>')
                 └─ [same flow with _id < cursor filter]
```

### Writing and Publishing a Story

```
/new-story
  └─ <StoryComposer mode="create">
       ├─ User types title/subtitle in textarea
       ├─ <StoryEditor> (Tiptap) → onChange(html)
       ├─ [optional] Upload cover → POST /api/uploads/image
       ├─ Add tags (Enter/comma)
       │
       ├─ "Save draft" → api.post('/api/posts', { status:'draft', ... })
       │    └─ Server: sanitizeContent(html) → makeSlug(title) → Post.create()
       │    └─ Client: router.replace('/edit/<slug>')
       │
       └─ "Publish" → api.post('/api/posts', { status:'published', ... })
            └─ Server: post.publishedAt = new Date() → Post.save()
            └─ Client: router.push('/p/<slug>')
```

### Clapping

```
User clicks ClapButton (optimistic)
  ├─ setViewer(v + 1), setTotal(t + 1)
  ├─ pending.current += 1
  ├─ Start 500ms debounce timer
  │
  [500ms passes — timer fires]
  └─ flush()
       ├─ api.post('/api/posts/:slug/clap', { count: pending })
       │    └─ Server: entry.count = min(50, entry.count + count)
       │              applied = entry.count - previous
       │              post.totalClaps += applied → Post.save()
       └─ setTotal(data.totalClaps), setViewer(data.viewerClapCount)
            └─ [on error: rollback optimistic state]
```

---

## 9. API Reference

**Standard envelope:**
```json
// Success
{ "success": true, "data": { ... }, "message": "..." }

// Error
{ "success": false, "message": "...", "errors": [{ "field": "email", "message": "..." }] }
```

### Complete Endpoint List

```
Auth
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/logout                  (requireAuth)
  POST   /api/auth/refresh
  GET    /api/auth/me                      (requireAuth)
  POST   /api/auth/forgot-password         (rate limit: 5/h per IP)
  POST   /api/auth/reset-password

Users
  GET    /api/users/:username              (optionalAuth)
  PATCH  /api/users/me                     (requireAuth)
  POST   /api/users/me/avatar              (requireAuth, multipart)
  POST   /api/users/:username/follow       (requireAuth)
  GET    /api/users/me/bookmarks           (requireAuth)
  POST   /api/users/me/export/request      (requireAuth, rate limit: 1/24h)
  GET    /api/users/me/export/download     (requireAuth)
  PATCH  /api/users/me/subdomain           (requireAuth)

Posts
  GET    /api/posts                        (optionalAuth, ?cursor,limit,tag,author,q,status)
  POST   /api/posts                        (requireAuth)
  GET    /api/posts/sitemap-data           (public, sitemap data loader)
  GET    /api/posts/tags/trending          (?limit)
  GET    /api/posts/:slug                  (optionalAuth)
  PATCH  /api/posts/:slug                  (requireAuth + author check)
  DELETE /api/posts/:slug                  (requireAuth + author check)
  POST   /api/posts/:slug/clap             (requireAuth)
  POST   /api/posts/:slug/bookmark         (requireAuth)
  GET    /api/posts/:slug/comments
  POST   /api/posts/:slug/comments         (requireAuth)

Comments
  DELETE /api/comments/:id                 (requireAuth + author check)

Feeds
  GET    /api/feed/rss
  GET    /api/feed/user/:username/rss
  GET    /api/feed/tag/:tag/rss

Uploads
  POST   /api/uploads/image                (requireAuth, multipart field: "image")

Static Files
  GET    /uploads/:filename                (served directly, 7-day cache)

Health
  GET    /api/health
```

---

## 10. Security Model

| Threat                      | Mitigation                                                                     |
|-----------------------------|--------------------------------------------------------------------------------|
| Stored XSS via editor       | `sanitize-html` server-side before `contentHtml` is saved. Strips `<script>`, all event handler attrs, `javascript:` and `data:` link schemes. |
| Password exposure           | `password` field has `select: false` on schema — never returned in queries unless explicitly `.select('+password')`. |
| Weak passwords              | Minimum 8 characters enforced via express-validator.                           |
| Password cracking           | bcrypt with cost factor 12 (~250ms/hash — makes brute force impractical).     |
| Token theft (XSS)           | All tokens live only in `httpOnly` cookies — inaccessible to JavaScript.      |
| CSRF                        | `sameSite: lax` on cookies. Secured by same-origin Vercel rewrite proxies `/api/*` to Render, making requests first-party to bypass third-party cookie restrictions (Safari/ITP). |
| Token replay after logout   | Logout clears cookies client-side. Stateless design (no server-side blacklist). |
| Expired access tokens       | 15m TTL; client silently refreshes via `/api/auth/refresh` on 401.            |
| Long-lived token abuse      | Refresh token expires in 7 days; rotation on each refresh call.               |
| API abuse / DoS             | Rate limiting: 50/15m on auth, 1000/15m general.                              |
| Unauthorized edits          | Author-only guards on PATCH/DELETE for posts and DELETE for comments.         |
| Invalid input               | express-validator rules on all mutating endpoints + validate middleware.       |
| CORS misconfiguration       | Origin checker matches local dev hosts, custom production domain, and specific anchored Vercel preview domains (`*.vercel.app` containing user team/project slug) to block phishing/session hijack; `credentials: true`. |
| Unauthorized file types     | Multer `fileFilter` rejects non-image MIME types; 5MB size limit.              |
| ObjectId injection          | `mongoose.isValidObjectId()` check before using IDs; CastError → 400.        |
| Export data scraping        | Rate-limiting on export requests (1 request / 24 hours), own account only.    |
| Subdomain claims hijacking  | Reserved subdomain checks against blacklist, uniqueness index constraints, username collision checks.     |

---

## 11. File Upload & Export Pipelines

### Image Upload
```
Client browser
  │
  ├─ User selects file (file picker)
  ├─ new FormData() → form.append('image', file)
  ├─ api.upload('/api/uploads/image', form)
  │    └─ apiFetch: no Content-Type header (browser sets multipart boundary)
  │
  ▼
Express: POST /api/uploads/image
  ├─ requireAuth (must be logged in)
  ├─ multer.single('image')
  │    ├─ Validates MIME: jpeg/png/webp/gif only
  │    ├─ Max size: 5MB
  │    └─ Stores to: server/uploads/<12-byte-hex>.<ext>
  ├─ asyncHandler
  └─ sendSuccess(201, { url: '/uploads/<filename>' })
```

### Zipped Data Export
```
Client browser
  │
  ├─ POST /api/users/me/export/request
  │    └─ Throttles request (max 1/24h)
  ├─ GET /api/users/me/export/download
  │
  ▼
Express: GET /api/users/me/export/download
  ├─ requireAuth (own account only)
  ├─ Post.find({ author: req.user._id })
  ├─ Stream zip construction via archiver
  │    ├─ profile.json (User details)
  │    ├─ posts-index.json (Manifest list)
  │    ├─ posts/<slug>.json (Model dump)
  │    └─ posts/<slug>.md (Markdown dump via turndown)
  └─ Pipes ZIP buffer directly to Client response stream
```

---

## 12. Environment Variables

### Server (`server/.env`)

| Variable             | Default                            | Required in Prod | Notes                            |
|----------------------|------------------------------------|------------------|----------------------------------|
| `PORT`               | `5000`                             | ✓                | API port                         |
| `NODE_ENV`           | `development`                      | ✓                | `production` disables error stack|
| `CLIENT_URL`         | `http://localhost:3000`            | ✓                | CORS origin                      |
| `MONGO_URI`          | `mongodb://127.0.0.1:27017/inkwell`| ✓                | Full connection string           |
| `JWT_ACCESS_SECRET`  | `dev_access_secret_change_me`      | ✓ CHANGE ME      | Min 32 random chars              |
| `JWT_REFRESH_SECRET` | `dev_refresh_secret_change_me`     | ✓ CHANGE ME      | Different from access secret     |
| `JWT_ACCESS_EXPIRES` | `15m`                              | —                | Short TTL                        |
| `JWT_REFRESH_EXPIRES`| `7d`                               | —                | Long TTL                         |
| `COOKIE_SECURE`      | `false`                            | Set `true`       | Must be `true` behind HTTPS      |

### Client (`client/.env.local`)

| Variable                       | Default                  | Notes                           |
|--------------------------------|--------------------------|---------------------------------|
| `NEXT_PUBLIC_API_URL`          | `http://localhost:5000`  | Backend base URL                |
| `NEXT_PUBLIC_SITE_URL`          | `http://localhost:3000`  | Frontend base URL               |
| `NEXT_PUBLIC_ENABLE_SUBDOMAINS` | `false`                  | Enable wildcard subdomain routing middleware |

---

## 13. Scripts & Developer Workflow

### Root (run from `inkwell/`)

```bash
pnpm install              # Install all workspace dependencies
pnpm dev                  # Run client (:3000) + server (:5000) concurrently
pnpm build                # Production build of client (server has no build step)
pnpm start                # Run both in production mode
pnpm seed                 # Wipe DB and reseed with demo data
```

### Per-package

```bash
pnpm --filter client dev
pnpm --filter server dev
pnpm --filter server seed
```

### Development ports

| Service | Port | URL                        |
|---------|------|----------------------------|
| Client  | 3000 | http://localhost:3000      |
| Server  | 5000 | http://localhost:5000      |
| API health | — | http://localhost:5000/api/health |

### Demo accounts (after `pnpm seed`)

| Name          | Email                | Password     | Username    |
|---------------|----------------------|--------------|-------------|
| Ada Lovelace  | ada@inkwell.dev      | password123  | ada         |
| James Baldwin | james@inkwell.dev    | password123  | jbaldwin    |
| Grace Hopper  | grace@inkwell.dev    | password123  | grace       |
| Maya Chen     | maya@inkwell.dev     | password123  | maya        |
| Leo Torres    | leo@inkwell.dev      | password123  | leo         |

---

## 14. Out of Scope (MVP)

The following were intentionally excluded to keep the MVP focused:

- Email verification
- OAuth / social login (Google, GitHub)
- Real-time notifications (WebSockets)
- Writer analytics dashboard
- Publications / multi-author collections
- Membership / paywall
- Text highlighting / inline responses
- Admin dashboard
- CI/CD pipeline
- Post scheduling
- Nested comments / threads
- Dark mode

---

## 15. Future / Post-MVP Roadmap

| Feature                    | Approach                                                   |
|----------------------------|------------------------------------------------------------|
| Cloud image hosting        | Cloudinary free tier — replace Multer `diskStorage`        |
| Cloud database             | MongoDB Atlas M0 free tier — swap `MONGO_URI`              |
| Real-time notifications    | Socket.IO or Server-Sent Events                            |
| OAuth                      | Passport.js (Google/GitHub strategies)                     |
| Analytics                  | Writer dashboard: views, claps, read-time trends           |
| Search enhancement         | Elasticsearch or Atlas Search (fuzzy, stemming)            |
| CDN                        | Cloudfront / Vercel edge caching for static assets         |
| Testing                    | Vitest unit tests + Playwright E2E                         |
| CI/CD                      | GitHub Actions: lint → test → build → deploy               |
| Docker                     | `docker-compose.yml` for mongo + server + client           |

---

*Blueprint updated: 2026-07-15 — Aligned with SEO, Ownership & Portability v1.1.0 specifications.*
