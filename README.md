# Inkwell

A Medium-inspired publishing platform — a quiet place to **read, write, and share stories**.
Clean serif reading typography, multi-clap, responses, tags, follow, and bookmarks.

Built as a full-stack MVP:

- **Frontend** — Next.js 15 (App Router, JavaScript + JSDoc), Tailwind CSS, Tiptap editor
- **Backend** — Node.js + Express, MongoDB + Mongoose
- **Auth** — JWT access/refresh tokens in httpOnly cookies, bcrypt password hashing
- **Security** — server-side HTML sanitization (`sanitize-html`), rate limiting, request validation

> Accent color is **deep indigo** (not Medium's green); the wordmark and components are original.

---

## Prerequisites

| Tool | Version used | Notes |
|---|---|---|
| Node.js | v20+ (tested on v24) | |
| pnpm | v9+ (tested on v11) | `npm i -g pnpm` |
| MongoDB | v4.4+ running locally | see options below |

### Getting MongoDB

**Option A — local install:** Start your local `mongod` (default `mongodb://127.0.0.1:27017`).

**Option B — Docker (no install):**
```bash
docker run -d --name inkwell-mongo -p 27017:27017 mongo:latest
```

---

## Setup (fresh clone → running app)

```bash
# 1. Install all workspace dependencies (client + server)
pnpm install

# 2. Create env files from the examples
cp server/.env.example server/.env
cp client/.env.example client/.env.local

# 3. Seed the database with demo users + stories (optional but recommended)
pnpm seed

# 4. Start both apps together (client on :3000, server on :5000)
pnpm dev
```

Then open **http://localhost:3000**.

### Demo login (after seeding)

| Email | Password |
|---|---|
| `ada@inkwell.dev` | `password123` |

All five seeded users share the password `password123`.

---

## Environment variables

**`server/.env`**

| Var | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | API port |
| `CLIENT_URL` | `http://localhost:3000` | CORS origin + cookie target |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/inkwell` | database |
| `JWT_ACCESS_SECRET` | dev value | **change in production** |
| `JWT_REFRESH_SECRET` | dev value | **change in production** |
| `JWT_ACCESS_EXPIRES` | `15m` | access token TTL |
| `JWT_REFRESH_EXPIRES` | `7d` | refresh token TTL |
| `COOKIE_SECURE` | `false` | set `true` behind HTTPS |

**`client/.env.local`**

| Var | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | backend base URL |

---

## Available scripts (run from repo root)

| Command | Effect |
|---|---|
| `pnpm dev` | Run client + server concurrently |
| `pnpm build` | Production build of the client |
| `pnpm start` | Run both apps in production mode |
| `pnpm seed` | Wipe + reseed the database |

Per-app: `pnpm --filter client <script>` / `pnpm --filter server <script>`.

---

## Project structure

```
inkwell/
├── client/                 # Next.js frontend
│   └── src/
│       ├── app/            # App Router routes (see below)
│       ├── components/     # layout / post / editor / ui / profile
│       ├── context/        # AuthContext
│       ├── hooks/          # useInfiniteScroll
│       └── lib/            # api.js (fetch wrapper), utils.js
├── server/                 # Express API
│   └── src/
│       ├── config/         # db, env
│       ├── models/         # User, Post, Comment
│       ├── controllers/    # auth, user, post, comment
│       ├── routes/         # + upload route
│       ├── middlewares/    # auth, error, rateLimiter, upload, validate
│       ├── utils/          # jwt, slugify, sanitize, readTime, asyncHandler, apiResponse
│       ├── validators/     # auth, post
│       └── scripts/seed.js
└── package.json            # pnpm workspace root
```

### Frontend routes

| Path | Page |
|---|---|
| `/` | Home feed (infinite scroll) |
| `/login`, `/register` | Auth |
| `/search?q=` | Search results |
| `/tag/[tag]` | Tag-filtered feed |
| `/@[username]` | Public profile + author's stories |
| `/p/[slug]` | Read a story |
| `/new-story` | Editor (create) |
| `/edit/[slug]` | Editor (edit own) |
| `/settings` | Edit profile + avatar |
| `/bookmarks` | Saved stories |

### API endpoints

Standard envelope: `{ success, data, message }` (or `{ success:false, message, errors? }`).

```
POST   /api/auth/register              POST   /api/posts
POST   /api/auth/login                 GET    /api/posts/:slug
POST   /api/auth/logout                PATCH  /api/posts/:slug      (author)
POST   /api/auth/refresh               DELETE /api/posts/:slug      (author)
GET    /api/auth/me                    POST   /api/posts/:slug/clap
GET    /api/users/:username            POST   /api/posts/:slug/bookmark
PATCH  /api/users/me                   GET    /api/posts/:slug/comments
POST   /api/users/me/avatar            POST   /api/posts/:slug/comments
POST   /api/users/:username/follow     DELETE /api/comments/:id     (author)
GET    /api/users/me/bookmarks         GET    /api/posts/tags/trending
GET    /api/posts   (cursor,limit,tag,author,q)   POST /api/uploads/image
```

---

## Security notes

- **Stored XSS prevention:** all editor HTML is sanitized server-side with `sanitize-html` before
  saving — `<script>`, event handlers, and `javascript:` URLs are stripped.
- **Passwords:** bcrypt (cost 12), never returned in any API response (`select: false`).
- **Tokens:** 15-min access + 7-day refresh, both httpOnly + `sameSite: lax` cookies. No tokens in
  `localStorage`. The client transparently refreshes on a 401.
- **Rate limiting** on `/api/auth/*`, **express-validator** on all mutating bodies, **author-only**
  guards on post/comment edit + delete.

---

## Assumptions & decisions

- **Monorepo** via pnpm workspaces; `pnpm dev` runs both apps with `concurrently`.
- **Images** are stored on local disk (`server/uploads/`, gitignored) and served via
  `express.static`. Seed data uses remote demo images (picsum / pravatar).
- **`sharp`** native build is intentionally skipped (`pnpm-workspace.yaml`) — Next.js 15 runs fine
  without it in local dev; `verifyDepsBeforeRun: false` keeps `pnpm dev`/`seed` from erroring on it.
- **`/@[username]`** is implemented as a `[username]` dynamic segment that captures the whole
  `@ada` string and strips the leading `@` (static routes like `/search`, `/p` take precedence).
- Password-reset email is **out of scope** for the MVP (would log a token to console).

## Not built (post-MVP, by design)

Publications, membership/paywall, real-time notifications, OAuth, writer stats dashboard, text
highlighting, admin dashboard, CI/CD.

## Future / stretch (free tiers, not wired up)

- **Cloudinary** free tier for image hosting (replace local-disk Multer).
- **MongoDB Atlas** free M0 tier for cloud persistence (swap `MONGO_URI`).
- **Mailtrap** free sandbox for password-reset email testing.

---

## Verification checklist

All items below were exercised against the running app (`pnpm dev`, client :3000 + server :5000):

- [x] `pnpm install && pnpm dev` starts both client and server with zero errors
- [x] Register → login → session persists on refresh (httpOnly cookie + `/auth/me`)
- [x] Create draft → publish → appears in home feed
- [x] Clap increments and persists; **capped at 50 per user** (sending 60 clamps to 50)
- [x] Comment post + delete — **delete blocked (403) for non-owner**, allowed (200) for owner
- [x] Tag filter (`?tag=`) and search (`?q=`) return correct filtered results
- [x] Follow/unfollow toggles and updates the follower count
- [x] Bookmark toggle persists and shows on `/bookmarks`
- [x] `<script>alert(1)</script>` submitted in the editor does **not** execute on the story page
      (sanitized to inert text server-side; `javascript:` links stripped)
- [x] No horizontal scroll / broken layout at 320 / 375 / 768 / 1024 / 1440 / 1920px
- [x] Production build (`pnpm --filter client build`) compiles all routes with no type/lint errors
```
