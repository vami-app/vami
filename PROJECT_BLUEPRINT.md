# ðŸ–‹ï¸ Inkwell â€” Project Blueprint

> **Version:** 1.1.0 Â· **Stack:** Next.js 15 + Express + MongoDB Â· **Package Manager:** pnpm (v11)
> A Medium-inspired publishing platform â€” read, write, and share stories. Optimized for SEO, subdomains, and data export portability.

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
8. [Data Flow â€” End-to-End](#8-data-flow--end-to-end)
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
| Accent color    | Deep Indigo (`#4f46e5` â€” distinct from Medium) |
| Auth strategy   | JWT in httpOnly cookies (access + refresh)     |
| Storage         | Local disk (MVP); upgrade path: Cloudinary     |
| Database        | MongoDB (local or Atlas free M0)               |
| Deployment      | Run locally; cloud-ready via env swap          |

---

## 2. Repository Layout (Monorepo)

```
inkwell/                            â† pnpm workspace root
â”‚
â”œâ”€â”€ package.json                    â† Root scripts: dev, build, start, seed
â”œâ”€â”€ pnpm-workspace.yaml             â† Workspace: ["client", "server"]
â”œâ”€â”€ pnpm-lock.yaml                  â† Lockfile (pnpm v11)
â”œâ”€â”€ .npmrc                          â† pnpm settings
â”œâ”€â”€ .gitignore
â”œâ”€â”€ README.md
â”œâ”€â”€ PROJECT_BLUEPRINT.md            â† This document
â”‚
â”œâ”€â”€ client/                         â† Next.js 15 frontend (port 3000)
â”‚   â”œâ”€â”€ package.json
â”‚   â”œâ”€â”€ next.config.mjs             â† Image remote patterns, API URL
â”‚   â”œâ”€â”€ tailwind.config.js          â† Design tokens, typography plugin
â”‚   â”œâ”€â”€ postcss.config.mjs
â”‚   â”œâ”€â”€ jsconfig.json               â† Path alias: @/ â†’ src/
â”‚   â”œâ”€â”€ .env.example / .env.local
â”‚   â”œâ”€â”€ public/
â”‚   â”‚   â””â”€â”€ google37b5f6fe1e66acb6.html â† Google Search Console site verification file
â”‚   â””â”€â”€ src/
â”‚       â”œâ”€â”€ middleware.js           â† Subdomain rewrites (ada.inkwell.app â†’ /@ada)
â”‚       â”œâ”€â”€ app/                    â† App Router root
â”‚       â”‚   â”œâ”€â”€ layout.jsx          â† Root layout: fonts + AuthProvider
â”‚       â”‚   â”œâ”€â”€ globals.css         â† Base CSS + Tailwind directives
â”‚       â”‚   â”œâ”€â”€ sitemap.js          â† Dynamic sitemap.xml route generator
â”‚       â”‚   â”œâ”€â”€ robots.js           â† Dynamic robots.txt route generator
â”‚       â”‚   â”œâ”€â”€ (auth)/             â† Route group: no Navbar
â”‚       â”‚   â”‚   â”œâ”€â”€ layout.jsx      â† Centered logo header only
â”‚       â”‚   â”‚   â”œâ”€â”€ login/page.jsx
â”‚       â”‚   â”‚   â””â”€â”€ register/page.jsx
â”‚       â”‚   â””â”€â”€ (main)/             â† Route group: Navbar + Footer
â”‚       â”‚       â”œâ”€â”€ layout.jsx      â† Navbar + main + Footer wrapper
â”‚       â”‚       â”œâ”€â”€ page.jsx        â† Home feed (/)
â”‚       â”‚       â”œâ”€â”€ [username]/page.jsx    â† Profile (/@username)
â”‚       â”‚       â”œâ”€â”€ bookmarks/page.jsx
â”‚       â”‚       â”œâ”€â”€ edit/[slug]/page.jsx
â”‚       â”‚       â”œâ”€â”€ new-story/page.jsx
â”‚       â”‚       â”œâ”€â”€ p/[slug]/page.jsx      â† Server Component: dynamic metadata + JSON-LD
â”‚       â”‚       â”‚   â””â”€â”€ StoryPageClient.jsx â† Client interactivity wrapper (claps, comments)
â”‚       â”‚       â”œâ”€â”€ search/page.jsx
â”‚       â”‚       â”œâ”€â”€ settings/page.jsx
â”‚       â”‚       â””â”€â”€ tag/[tag]/page.jsx
â”‚       â”œâ”€â”€ components/
â”‚       â”‚   â”œâ”€â”€ editor/
â”‚       â”‚   â”‚   â”œâ”€â”€ StoryComposer.jsx     â† Full create/edit form
â”‚       â”‚   â”‚   â””â”€â”€ StoryEditor.jsx       â† Tiptap WYSIWYG core
â”‚       â”‚   â”œâ”€â”€ layout/
â”‚       â”‚   â”‚   â”œâ”€â”€ Navbar.jsx            â† Sticky header, search, avatar menu
â”‚       â”‚   â”‚   â”œâ”€â”€ Footer.jsx
â”‚       â”‚   â”‚   â”œâ”€â”€ Logo.jsx
â”‚       â”‚   â”‚   â”œâ”€â”€ MobileDrawer.jsx      â† Hamburger nav overlay
â”‚       â”‚   â”‚   â””â”€â”€ RequireAuth.jsx       â† Auth gate wrapper
â”‚       â”‚   â”œâ”€â”€ post/
â”‚       â”‚   â”‚   â”œâ”€â”€ PostCard.jsx          â† Feed card
â”‚       â”‚   â”‚   â”œâ”€â”€ PostList.jsx          â† Infinite-scroll list
â”‚       â”‚   â”‚   â”œâ”€â”€ ClapButton.jsx        â† Multi-clap + optimistic update
â”‚       â”‚   â”‚   â”œâ”€â”€ BookmarkButton.jsx    â† Toggle bookmark
â”‚       â”‚   â”‚   â”œâ”€â”€ CommentSection.jsx    â† Comments list + form
â”‚       â”‚   â”‚   â””â”€â”€ TrendingTags.jsx      â† Sidebar tag cloud
â”‚       â”‚   â”œâ”€â”€ profile/
â”‚       â”‚   â”‚   â””â”€â”€ FollowButton.jsx      â† Toggle follow/unfollow
â”‚       â”‚   â””â”€â”€ ui/
â”‚       â”‚       â”œâ”€â”€ Avatar.jsx            â† Image + initials fallback
â”‚       â”‚       â”œâ”€â”€ Button.jsx            â† Variants: default, secondary, ghost, danger
â”‚       â”‚       â”œâ”€â”€ Input.jsx             â† Styled form input
â”‚       â”‚       â””â”€â”€ Skeleton.jsx          â† Loading placeholder
â”‚       â”œâ”€â”€ context/
â”‚       â”‚   â””â”€â”€ AuthContext.jsx           â† Global auth state + actions
77:       â”œâ”€â”€ hooks/
â”‚       â”‚   â””â”€â”€ useInfiniteScroll.js      â† IntersectionObserver sentinel
â”‚       â””â”€â”€ lib/
â”‚           â”œâ”€â”€ api.js                    â† Fetch wrapper + token refresh
â”‚           â””â”€â”€ utils.js                  â† formatDate, formatCount, cx, initials
â”‚
â””â”€â”€ server/                         â† Express API (port 5000)
    â”œâ”€â”€ package.json
    â”œâ”€â”€ nodemon.json                 â† Watch: src/**/*.js
    â”œâ”€â”€ .env.example / .env
    â”œâ”€â”€ uploads/                     â† Local image storage (gitignored)
    â””â”€â”€ src/
        â”œâ”€â”€ server.js                â† Bootstrap: DB connect â†’ listen
        â”œâ”€â”€ app.js                   â† Express app: CORS, body parsers, routes
        â”œâ”€â”€ config/
        â”‚   â”œâ”€â”€ env.js               â† Validated env object
        â”‚   â””â”€â”€ db.js                â† Mongoose connect
        â”œâ”€â”€ models/
        â”‚   â”œâ”€â”€ User.js              â† Schema + export, subdomain, bookmarks
        â”‚   â”œâ”€â”€ Post.js              â† Schema + seo fields, indexable, pre-save hooks
        â”‚   â””â”€â”€ Comment.js           â† Schema
        â”œâ”€â”€ controllers/
        â”‚   â”œâ”€â”€ auth.controller.js   â† register, login, logout, refresh, me
        â”‚   â”œâ”€â”€ post.controller.js   â† CRUD + sitemap-data, clap, bookmark, trendingTags
        â”‚   â”œâ”€â”€ user.controller.js   â† profile, updateMe, uploadAvatar, follow, bookmarks, export
        â”‚   â””â”€â”€ comment.controller.jsâ† list, add, delete
        â”œâ”€â”€ routes/
        â”‚   â”œâ”€â”€ auth.routes.js
        â”‚   â”œâ”€â”€ post.routes.js
        â”‚   â”œâ”€â”€ user.routes.js
        â”‚   â”œâ”€â”€ comment.routes.js
        â”‚   â”œâ”€â”€ upload.routes.js
        â”‚   â””â”€â”€ feed.routes.js       â† RSS feeds routes (global, author, tag)
        â”œâ”€â”€ middlewares/
        â”‚   â”œâ”€â”€ auth.middleware.js   â† requireAuth / optionalAuth
        â”‚   â”œâ”€â”€ error.middleware.js  â† notFound + centralized errorHandler
        â”‚   â”œâ”€â”€ rateLimiter.js       â† authLimiter (50/15m), generalLimiter (1000/15m)
        â”‚   â”œâ”€â”€ upload.middleware.js â† Multer: disk storage, 5MB limit, image-only
        â”‚   â””â”€â”€ validate.js          â† express-validator result handler
        â”œâ”€â”€ utils/
        â”‚   â”œâ”€â”€ jwt.js               â† sign/verify tokens + cookie helpers
        â”‚   â”œâ”€â”€ apiResponse.js       â† sendSuccess() + ApiError class
        â”‚   â”œâ”€â”€ asyncHandler.js      â† try/catch wrapper for async controllers
        â”‚   â”œâ”€â”€ slugify.js           â† baseSlug() + makeSlug() (unique suffix)
        â”‚   â”œâ”€â”€ sanitize.js          â† sanitize-html: strips XSS from editor HTML
        â”‚   â”œâ”€â”€ readTime.js          â† estimateReadTime() at 200 WPM
        â”‚   â”œâ”€â”€ rss.js               â† RSS feed builder utilizing 'feed' library
        â”‚   â””â”€â”€ exportAccount.js     â† ZIP stream export using 'archiver' + 'turndown'
        â”œâ”€â”€ validators/
        â”‚   â”œâ”€â”€ auth.validator.js    â† registerRules, loginRules
        â”‚   â””â”€â”€ post.validator.js    â† createPostRules, updatePostRules, commentRules
        â””â”€â”€ scripts/
            â”œâ”€â”€ seed.js              â† Demo data: 5 users, 15 posts, comments, follows, claps
            â”œâ”€â”€ test_seo_spec.js     â† Verification script for user/post model schemas
            â””â”€â”€ reset_export_limit.js â† Utility script to reset export limits for developer testing
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
| Fonts         | Google Fonts via next/font | â€”         | Inter (sans), Source Serif 4 (serif)      |

### Tooling

| Tool      | Purpose                                              |
|-----------|------------------------------------------------------|
| pnpm      | Monorepo package manager with workspaces             |
| concurrently | Run client + server in parallel with one command  |
| Git       | Version control                                      |

---

## 4. Architecture Diagram

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                         BROWSER (User)                              â”‚
â”‚                                                                     â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚              Next.js 15 Client  (localhost:3000)             â”‚   â”‚
â”‚  â”‚                                                              â”‚   â”‚
â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚   â”‚
â”‚  â”‚  â”‚  AuthContext  â”‚  â”‚  Route Pages    â”‚  â”‚  middleware   â”‚   â”‚   â”‚
â”‚  â”‚  â”‚  (React ctx) â”‚  â”‚  (App Router)   â”‚  â”‚  (subdomains) â”‚   â”‚   â”‚
â”‚  â”‚  â”‚  user state  â”‚  â”‚  sitemap.js     â”‚  â”‚               â”‚   â”‚   â”‚
â”‚  â”‚  â”‚  login/logoutâ”‚  â”‚  robots.js      â”‚  â”‚               â”‚   â”‚   â”‚
â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚   â”‚
â”‚  â”‚         â”‚                   â”‚                    â”‚            â”‚   â”‚
â”‚  â”‚         â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜            â”‚   â”‚
â”‚  â”‚                             â”‚                                  â”‚   â”‚
â”‚  â”‚                    lib/api.js (apiFetch)                       â”‚   â”‚
â”‚  â”‚         fetch() with credentials + auto token refresh          â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                                 â”‚  httpOnly cookies                   â”‚
â”‚                     HTTP + JSON â”‚  (accessToken, refreshToken)        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                  â”‚
                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                    â”‚  Express API (localhost:5000) â”‚
                    â”‚                              â”‚
                    â”‚  CORS â† CLIENT_URL           â”‚
                    â”‚  Rate limiters               â”‚
                    â”‚  Cookie parser               â”‚
                    â”‚  Body parser (JSON 1MB)       â”‚
                    â”‚                              â”‚
                    â”‚  /api/auth/*   authLimiter   â”‚
                    â”‚  /api/posts/*                â”‚
                    â”‚  /api/users/*                â”‚
                    â”‚  /api/comments/*             â”‚
                    â”‚  /api/feed/*                 â”‚
                    â”‚  /api/uploads/*              â”‚
                    â”‚  /uploads/*    static files  â”‚
                    â”‚                              â”‚
                    â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
                    â”‚  â”‚   Middleware Chain    â”‚   â”‚
                    â”‚  â”‚  requireAuth         â”‚   â”‚
                    â”‚  â”‚  optionalAuth        â”‚   â”‚
                    â”‚  â”‚  validate            â”‚   â”‚
                    â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
                    â”‚                              â”‚
                    â”‚  Controllers â†’ Models        â”‚
                    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                   â”‚
                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                    â”‚         MongoDB               â”‚
                    â”‚   Database: inkwell           â”‚
                    â”‚                               â”‚
                    â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
                    â”‚  â”‚  User  â”‚  â”‚    Post      â”‚ â”‚
                    â”‚  â”‚        â”‚  â”‚  (+ clapSub) â”‚ â”‚
                    â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
                    â”‚         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”          â”‚
                    â”‚         â”‚ Comment  â”‚          â”‚
                    â”‚         â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜          â”‚
                    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## 5. Server Architecture (Backend)

### 5.1 Entry Point & Bootstrap

#### `server/src/server.js`
The application bootstrap. Sequence:
1. Call `connectDB()` â€” connects Mongoose to MongoDB.
2. `app.listen(env.port)` â€” starts HTTP server.
3. Register `SIGINT` / `SIGTERM` handlers for graceful shutdown.

#### `server/src/app.js`
Creates and configures the Express application:
- `app.set('trust proxy', 1)` â€” trust reverse proxy (for rate limiter IP detection).
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

#### `User` model â€” `server/src/models/User.js`

| Field       | Type               | Constraints                                   |
|-------------|--------------------|-----------------------------------------------|
| `name`      | String             | required, maxlength 80                        |
| `username`  | String             | required, unique, lowercase, 3â€“30 chars, indexed |
| `email`     | String             | required, unique, lowercase, indexed          |
| `password`  | String             | required, `select: false` (never returned)    |
| `bio`       | String             | maxlength 200, default `""`                   |
| `avatarUrl` | String             | default `""`                                  |
| `followers` | [ObjectId â†’ User]  | Array of follower user refs                   |
| `following` | [ObjectId â†’ User]  | Array of following user refs                  |
| `bookmarks` | [ObjectId â†’ Post]  | Array of bookmarked post refs                 |
| `subdomain` | String             | lowercase, unique, sparse index               |
| `customDomain`| String           | default `null` (v2 BYO custom domain)         |
| `exportRequestedAt` | Date       | Timestamp throttle for account zip downloads  |
| `exportStatus` | String          | enum: `"idle" \| "pending" \| "ready" \| "failed"`, default `"idle"` |
| `passwordResetTokenHash` | String | `select: false` â€” SHA-256 of the emailed reset token; raw token is never stored |
| `passwordResetExpiresAt` | Date  | `select: false` â€” reset token TTL (30 min from request) |
| `emailVerified` | Boolean | default `false` |
| `emailVerifyTokenHash` | String | `select: false` â€” SHA-256 of the verification token |
| `emailVerifyExpiresAt` | Date | `select: false` â€” verification token TTL (24 hours) |
| `emailPrefs.allEmails` | Boolean | default `true` |
| `emailPrefs.digestFrequency` | String | enum: `'weekly' \| 'off'`, default `'weekly'` |
| `followedTags` | [String] | Array of followed tag strings, default `[]` |
| `lastDigestSentAt` | Date | Timestamp of the last sent weekly digest, default `null` |
| `createdAt` / `updatedAt` | Date | auto via timestamps                    |

**Hooks & methods:**
- `pre('save')` â€” bcrypt hash (cost 12) if password modified.
- `comparePassword(candidate)` â€” bcrypt compare.
- `toPublicJSON(includeEmail)` â€” safe API shape, includes subdomain/customDomain properties, never leaks password.

---

#### `Post` model â€” `server/src/models/Post.js`

| Field            | Type                | Constraints / Notes                          |
|------------------|---------------------|----------------------------------------------|
| `title`          | String              | required, maxlength 160                      |
| `subtitle`       | String              | maxlength 200, default `""`                  |
| `slug`           | String              | required, unique, indexed                    |
| `contentHtml`    | String              | required â€” sanitized HTML from Tiptap        |
| `coverImage`     | String              | URL or relative `/uploads/` path             |
| `tags`           | [String]            | max 5, indexed                               |
| `author`         | ObjectId â†’ User     | required, indexed                            |
| `status`         | `"draft"` \| `"published"` | default `"draft"`, indexed          |
| `claps`          | [clapSchema]        | embedded `{ user, count (0â€“50) }` subdocs    |
| `totalClaps`     | Number              | denormalized sum                             |
| `views`          | Number              | incremented on published reads (non-author)  |
| `readTimeMinutes`| Number              | computed at 200 WPM                          |
| `publishedAt`    | Date                | set on first publish                         |
| `notifiedAt`     | Date                | default `null`, set when followers are notified of publication |
| `seo`            | subdocument         | contains optional override metadata (`metaTitle`, `metaDescription`, `canonicalUrl`) |
| `indexable`      | Boolean             | default `false`, sets to `true` on publish   |

**Indexes:**
- Full-text: `{ title: 'text', subtitle: 'text', tags: 'text' }` â€” powers `?q=` search.
- Compound: `{ status: 1, publishedAt: -1 }` â€” powers feed sort.

**Hooks & methods:**
- `pre('save')` â€” recomputes `readTimeMinutes` when `contentHtml` changes, forces `indexable = true` and generates the unique `canonicalUrl` based on site env values on the first published save. Reverts `indexable` to `false` if post status flips back to draft.
- `toCardJSON(viewerId)` â€” feed-safe response shape including viewer-specific clap count, indexable state, and custom SEO configurations.

---

#### `Comment` model â€” `server/src/models/Comment.js`

| Field     | Type            | Constraints                |
|-----------|-----------------|----------------------------|
| `post`    | ObjectId â†’ Post | required, indexed          |
| `author`  | ObjectId â†’ User | required                   |
| `content` | String          | required, maxlength 2000   |

---

#### `Follow` model â€” `server/src/models/Follow.js`

| Field | Type | Constraints / Notes |
|---|---|---|
| `follower` | ObjectId â†’ User | required, indexed |
| `followee` | ObjectId â†’ User | required, indexed |
| `followedAt` | Date | default `Date.now` |
| `sourcePost` | ObjectId â†’ Post | nullable â€” set only if the follow originated from a post |

**Indexes:**
- Compound: `{ follower: 1, followee: 1 }` (unique)

---

### 5.4 Middleware Chain

The request flows through:

```
Request
  â”‚
  â”œâ”€ CORS (allow CLIENT_URL + credentials)
  â”œâ”€ express.json() body parser (1 MB)
  â”œâ”€ express.urlencoded()
  â”œâ”€ cookieParser()
  â”‚
  â”œâ”€ /uploads/* â†’ express.static (served files)
  â”œâ”€ /api/health â†’ quick health check
  â”‚
  â”œâ”€ /api/* â†’ generalLimiter (1000 req / 15 min / IP)
  â”‚
  â”œâ”€ /api/auth/* â†’ authLimiter (50 req / 15 min / IP) â†’ auth routes
  â”œâ”€ /api/posts/* â†’ post routes
  â”œâ”€ /api/users/* â†’ user routes
  â”œâ”€ /api/comments/* â†’ comment routes
  â”œâ”€ /api/feed/* â†’ feed routes (RSS feeds)
  â”œâ”€ /api/uploads/* â†’ upload routes
  â”‚
  â”œâ”€ notFound (404 catcher)
  â””â”€ errorHandler (centralized)
```

#### `auth.middleware.js` â€” Two guard modes

| Middleware    | Behavior                                                        |
|---------------|-----------------------------------------------------------------|
| `requireAuth` | Reads `accessToken` cookie â†’ verifies â†’ loads user â†’ `req.user`. Throws 401 if missing/invalid. |
| `optionalAuth`| Same as above but silently ignores missing/invalid token. Used on public endpoints needing viewer personalization (clap state, bookmark state). |

#### `error.middleware.js` â€” Centralized error handling

Normalizes all errors into `{ success: false, message, errors? }`:
- `ValidationError` â†’ 400 with field-level messages
- MongoDB `code 11000` duplicate key â†’ 409 "already taken"
- Mongoose `CastError` (bad ObjectId) â†’ 400
- `ApiError` instances â†’ their `statusCode`
- Unknown â†’ 500 (stack trace excluded in production)

#### `rateLimiter.js`

| Limiter          | Window  | Max Requests | Applied To        |
|------------------|---------|--------------|-------------------|
| `authLimiter`    | 15 min  | 50           | `/api/auth/*`     |
| `generalLimiter` | 15 min  | 1,000        | All `/api/*`      |

#### `upload.middleware.js`

- Storage: `multer.diskStorage` â†’ `server/uploads/` with random 24-hex filename.
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
- File size limit: **5 MB**.

#### `validate.js`

Runs `validationResult(req)` after express-validator rule arrays. Returns 422 with field errors on failure.

---

### 5.5 Routes & Controllers

#### Auth (`/api/auth/`)

| Method | Path       | Auth      | Description                                      |
|--------|------------|-----------|--------------------------------------------------|
| POST   | /register  | â€”         | Create account; issues access + refresh cookies  |
| POST   | /login     | â€”         | Verify credentials; issues cookies               |
| POST   | /logout    | required  | Clears both auth cookies                         |
| POST   | /refresh   | â€”         | Reads refreshToken cookie â†’ rotates both tokens  |
| GET    | /me        | required  | Returns current user (`toPublicJSON(true)`)      |

**Token strategy:**
- `signAccessToken(userId)` â†’ JWT signed with `jwtAccessSecret`, expires in `15m`.
- `signRefreshToken(userId)` â†’ JWT signed with `jwtRefreshSecret`, expires in `7d`.
- Both set as `httpOnly`, `sameSite: lax`, `secure: env.cookieSecure` cookies.

---

#### Posts (`/api/posts/`)

| Method | Path                | Auth              | Description                                      |
|--------|---------------------|-------------------|--------------------------------------------------|
| GET    | /tags/trending      | â€”                 | Top N tags by post count (MongoDB aggregation)   |
| GET    | /sitemap-data       | â€”                 | Minimal public fields query for sitemap generation |
| GET    | /                   | optional          | Cursor-paginated feed (filters: tag, author, q, status) |
| POST   | /                   | required          | Create post (draft or publish immediately)       |
| GET    | /:slug              | optional          | Single post (views++ if published + non-author)  |
| PATCH  | /:slug              | required (author) | Update fields; change status draftâ†”published     |
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
│   ├── /register
│   ├── /forgot-password     # Request password-reset email
│   └── /reset-password      # Consume token → set new password
│
├── LegalLayout ((legal)/layout.jsx)
│   Logo-only header + Footer; no search/write nav
│   ├── /terms               # Terms of Service (static, real content)
│   └── /privacy             # Privacy Policy (static, real content)
│
└── MainLayout ((main)/layout.jsx)
    Navbar + <main> + Footer
    ├── /                    # HomePage
    ├── /@[username]         # ProfilePage
    ├── /bookmarks           # BookmarksPage
    ├── /edit/[slug]         # EditPage
    ├── /new-story           # NewStoryPage
    ├── /p/[slug]            # StoryPage (Server Component)
    │   └── StoryPageClient  # Client Interactivity Wrapper
    ├── /search              # SearchPage
    ├── /settings            # SettingsPage (profile + email prefs + account deletion)
    └── /tag/[tag]           # TagPage
```

**Note:** `/@[username]` is Next.js dynamic segment `[username]` capturing `@ada`; the page strips the `@` prefix. `/p/*`, `/search`, etc. take static precedence over `/@username`.

---

### 6.2 Route Pages

| Route                  | Component             | Key Features                                         |
|------------------------|-----------------------|------------------------------------------------------|
| `/`                    | HomePage              | Hero section + `<PostList>` feed + `<TrendingTags>` sidebar |
| `/login`               | LoginPage             | Email/password form → `AuthContext.login()`          |
| `/register`            | RegisterPage          | Name/username/email/password → `AuthContext.register()` |
| `/forgot-password`     | ForgotPasswordPage    | Email input → POST `/api/auth/forgot-password` → triggers reset email |
| `/reset-password`      | ResetPasswordPage     | Reads `?token=` from query, POSTs new password to `/api/auth/reset-password` |
| `/@[username]`         | ProfilePage           | User bio, follow button, author's stories. Custom subdomain mapping rewrites resolve here. |
| `/p/[slug]`            | StoryPage             | Server Component. Feeds metadata, embeds JSON-LD schema, renders `<StoryPageClient>`. |
| `/new-story`           | NewStoryPage          | `<StoryComposer mode="create">`                     |
| `/edit/[slug]`         | EditPage              | `<StoryComposer mode="edit">` (author-only guard)    |
| `/settings`            | SettingsPage          | Profile edit + avatar upload + email prefs toggle + digest frequency + account deletion |
| `/bookmarks`           | BookmarksPage         | User's bookmarked posts via `GET /api/users/me/bookmarks` |
| `/search?q=`           | SearchPage            | Query `?q=` fed to `GET /api/posts?q=`               |
| `/tag/[tag]`           | TagPage               | Filter feed by `GET /api/posts?tag=`                 |
| `/terms`               | TermsPage             | Terms of Service — static, real drafted content cross-referenced to actual data flows |
| `/privacy`             | PrivacyPage           | Privacy Policy — names real processors (Resend, Mailtrap, MongoDB), covers export/deletion rights |

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

**`VerificationBanner.jsx`** — App-wide banner rendered in `MainLayout` when `user.emailVerified === false`. Shows a dismissible (per session) prompt with a "Resend verification email" action wired to `POST /api/auth/resend-verification`. Disappears permanently once verified.

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
└── setUser(u)              → escape hatch for settings updates
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
┌──────────────┐              ┌─────────────┐              ┌─────────────┐
│    Browser   │              │  Express API  │              │  MongoDB     │
└──────┬───────┘              └──────┬──────┘              └──────┬──────┘
       │                             │                             │
       │  POST /api/auth/login       │                             │
       │  { email, password }        │                             │
       │────────────────────────────>│                             │
       │                             │  User.findOne({ email })    │
       │                             │  .select('+password')       │
       │                             │────────────────────────────>│
       │                             │<────────────────────────────│
       │                             │  bcrypt.compare()           │
       │                             │                             │
       │                             │  signAccessToken(userId)    │
       │                             │  signRefreshToken(userId)   │
       │<────────────────────────────│                             │
       │  Set-Cookie: accessToken    │                             │
       │  Set-Cookie: refreshToken   │                             │
       │  { success, data: { user }} │                             │
       │                             │                             │
       │  [Claim subdomain]          │                             │
       │  PATCH /api/users/me/sub    │                             │
       │  { subdomain: "ada-love" }  │                             │
       │────────────────────────────>│                             │
       │                             │  CheckReserved()            │
       │                             │  User.save()                │
       │<────────────────────────────│                             │
```

## 8. Data Flow — End-to-End

### Reading the Home Feed

```
HomePage
  └── <PostList> mounts
       │
       ├── apiFetch('GET /api/posts?limit=10')
       │    └── Express: optionalAuth → listPosts controller
       │         ├── filter: { status: 'published' }
       │         ├── Post.find().sort({_id: -1}).limit(11).populate('author')
       │         ├── hasMore = docs.length > 10
       │         └── posts.map(p => p.toCardJSON(viewerId))
       │
       ├── Renders PostCard list
       └── useInfiniteScroll sentinel
            └── On intersect → apiFetch('GET /api/posts?cursor=<lastId>')
                 └── [same flow with _id < cursor filter]
```

### Writing and Publishing a Story

```
/new-story
  └── <StoryComposer mode="create">
       ├── User types title/subtitle in textarea
       ├── <StoryEditor> (Tiptap) → onChange(html)
       ├── [optional] Upload cover → POST /api/uploads/image
       ├── Add tags (Enter/comma)
       │
       ├── "Save draft" → api.post('/api/posts', { status:'draft', ... })
       │    └── Server: sanitizeContent(html) → makeSlug(title) → Post.create()
       │    └── Client: router.replace('/edit/<slug>')
       │
       └── "Publish" → api.post('/api/posts', { status:'published', ... })
            └── Server: post.publishedAt = new Date() → Post.save()
            └── Client: router.push('/p/<slug>')
```

### Clapping

```
User clicks ClapButton (optimistic)
  ├── setViewer(v + 1), setTotal(t + 1)
  ├── pending.current += 1
  ├── Start 500ms debounce timer
  │
  [500ms passes — timer fires]
  └── flush()
       ├── api.post('/api/posts/:slug/clap', { count: pending })
       │    └── Server: entry.count = min(50, entry.count + count)
       │              applied = entry.count - previous
       │              post.totalClaps += applied → Post.save()
       └── setTotal(data.totalClaps), setViewer(data.viewerClapCount)
            └── [on error: rollback optimistic state]
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
  GET    /api/auth/verify-email            (none, token query parameter)
  POST   /api/auth/resend-verification     (requireAuth, rate-limited)

Users
  GET    /api/users/:username              (optionalAuth)
  PATCH  /api/users/me                     (requireAuth)
  POST   /api/users/me/avatar              (requireAuth, multipart)
  POST   /api/users/:username/follow       (requireAuth)
  GET    /api/users/me/bookmarks           (requireAuth)
  POST   /api/users/me/export/request      (requireAuth, rate limit: 1/24h)
  GET    /api/users/me/export/download     (requireAuth)
  PATCH  /api/users/me/subdomain           (requireAuth)
  POST   /api/users/me/delete-request      (requireAuth)
  DELETE /api/users/me                     (requireAuth, token query parameter)

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
  ├── User selects file (file picker)
  ├── new FormData() → form.append('image', file)
  ├── api.upload('/api/uploads/image', form)
  │    └── apiFetch: no Content-Type header (browser sets multipart boundary)
  │
  ▼
Express: POST /api/uploads/image
  ├── requireAuth (must be logged in)
  ├── multer.single('image')
  │    ├── Validates MIME: jpeg/png/webp/gif only
  │    ├── Max size: 5MB
  │    └── Stores to: server/uploads/<12-byte-hex>.<ext>
  ├── asyncHandler
  └── sendSuccess(201, { url: '/uploads/<filename>' })
```

### Zipped Data Export
```
Client browser
  │
  ├── POST /api/users/me/export/request
  │    └── Throttles request (max 1/24h)
  ├── GET /api/users/me/export/download
  │
  ▼
Express: GET /api/users/me/export/download
  ├── requireAuth (own account only)
  ├── Post.find({ author: req.user._id })
  ├── Stream zip construction via archiver
  │    ├── profile.json (User details)
  │    ├── posts-index.json (Manifest list)
  │    ├── posts/<slug>.json (Model dump)
  │    └── posts/<slug>.md (Markdown dump via turndown)
  └── Pipes ZIP buffer directly to Client response stream
```

---

## 12. Environment Variables

### Server (`server/.env`)

| Variable             | Default                              | Required in Prod | Notes                                          |
|----------------------|--------------------------------------|------------------|------------------------------------------------|
| `PORT`               | `5000`                               | ✓                | API port                                       |
| `NODE_ENV`           | `development`                        | ✓                | `production` disables error stack              |
| `CLIENT_URL`         | `http://localhost:3000`              | ✓                | CORS origin                                    |
| `MONGO_URI`          | `mongodb://127.0.0.1:27017/inkwell`  | ✓                | Full connection string                         |
| `JWT_ACCESS_SECRET`  | `dev_access_secret_change_me`        | ✓ CHANGE ME      | Min 32 random chars                            |
| `JWT_REFRESH_SECRET` | `dev_refresh_secret_change_me`       | ✓ CHANGE ME      | Different from access secret                   |
| `JWT_ACCESS_EXPIRES` | `15m`                                | —                | Short TTL                                      |
| `JWT_REFRESH_EXPIRES`| `7d`                                 | —                | Long TTL                                       |
| `COOKIE_SECURE`      | `false`                              | Set `true`       | Must be `true` behind HTTPS                    |
| `EMAIL_FROM`         | `Inkwell <onboarding@resend.dev>`    | ✓                | From address for all outgoing emails           |
| `RESEND_API_KEY`     | (empty)                              | Prod only        | Resend API key for production email delivery   |
| `MAILTRAP_API_TOKEN` | (empty)                              | Dev/test only    | Mailtrap API token for sandbox email testing   |
| `MAILTRAP_INBOX_ID`  | (empty)                              | Dev/test only    | Mailtrap Inbox ID for sandbox email testing    |

> **Email fallback priority:** Mailtrap (if token set) → Resend (if API key set) → console.log (local dev with neither configured).

### Client (`client/.env.local`)

| Variable                        | Default                  | Notes                                               |
|---------------------------------|--------------------------|-----------------------------------------------------|
| `NEXT_PUBLIC_API_URL`           | `http://localhost:5000`  | Backend API base URL                                |
| `NEXT_PUBLIC_SITE_URL`          | `http://localhost:3000`  | Frontend site URL (used for canonical tags)         |
| `NEXT_PUBLIC_ENABLE_SUBDOMAINS` | `false`                  | Enable wildcard subdomain routing middleware        |

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

### Server utility scripts (run from `server/` with `node src/scripts/<name>.js`)

| Script | Purpose |
|---|---|
| `seed.js` | Wipe DB + reseed 5 users, 15 posts, comments, follows, claps, bookmarks |
| `test_seo_spec.js` | Verify subdomain + SEO field schemas and pre-save hook behavior |
| `reset_export_limit.js` | Reset `exportRequestedAt` for all users (dev testing helper) |
| `run_evidence_verification.js` | 10-suite E2E verification: auth flows, indexes, canonical URLs, subdomains, RSS, sitemap, ZIP export |
| `backfill_follows.js` | One-time: create `Follow` docs from existing `User.following` arrays (Phase A migration) |
| `send-weekly-digest.js` | Manual trigger for the weekly digest; production use: schedule with `node-cron` or OS cron |

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

## 14. Feature Status — Phase A Complete

The following were listed as intentionally excluded from the initial MVP. **Phase A (Ownership & Trust Foundation) has now been completed**, which resolves several items from this list. Updated status below:

| Item | Original Status | Current Status |
|---|---|---|
| Email verification | Excluded (MVP) | ✅ **Built** — full flow: token, 24h TTL, verified badge, gates publishing |
| Password-reset email | Excluded (MVP) | ✅ **Built** — forgot/reset flow, Mailtrap/Resend, 30-min TTL, hash-not-raw |
| Email notifications (follower alerts) | Excluded (MVP) | ✅ **Built** — new-content notification via `notify.js` + `notifiedAt` guard |
| Weekly digest | Excluded (MVP) | ✅ **Built** — `send-weekly-digest.js` cron script, tag-follow aware, idempotent |
| Account deletion cascade | Excluded (MVP) | ✅ **Built** — two-step (confirm email → DELETE), full erasure or anonymize |
| Legal pages (ToS, Privacy) | Excluded (MVP) | ✅ **Built** — `/terms`, `/privacy` live, cross-referenced to real data practices |
| Email preferences / unsubscribe | Excluded (MVP) | ✅ **Built** — CAN-SPAM one-click unsubscribe, master toggle, digest frequency |
| OAuth / social login | Phase B+ | Pending (Phase E) |
| Real-time notifications (WebSockets) | Phase B+ | Pending (Phase E) |
| Writer analytics dashboard | Phase B+ | Pending (Phase F) |
| Publications / multi-author | Phase B+ | Pending (Phase C) |
| Membership / paywall | Phase B+ | Pending (Phase D) |
| Text highlighting / inline responses | Phase B+ | Pending (Phase F) |
| Admin dashboard | Phase B+ | ✅ **Built** — admin gate, stats view, user ban/role manager, report review queue |
| CI/CD pipeline | Phase B+ | Pending (Phase G) |
| Post scheduling | Phase B+ | Pending (Phase E) |
| Nested comments / threads | Phase B+ | ✅ **Built** — 5-level clamped depth, recursive UI rendering, soft-delete branch |
| Dark mode | Phase B+ | Pending (Phase F) |
| Moderation / reports / review queue | Not planned at MVP | ✅ **Built** — POST report, 3x priority flag, RSS/Weekly-digest/Feed filter, AuditLog |
| Revision history | Not planned at MVP | ✅ **Built** — 50-limit snapshot database compare on update, diff render side-over, content restore |

## 15. Full Development Roadmap

Phase B (Safety & Integrity) is **complete**. The full phased development plan — covering Phases C through G — is documented in `INKWELL_FULL_PRODUCT_ROADMAP.md`.

| Phase | Focus | Status |
|---|---|---|
| A — Ownership & Trust | Email verification, notifications, digest, legal pages, account deletion, sovereign export | **Completed** |
| B — Safety & Integrity | Moderation/reports, admin dashboard, revision history, nested comments | **Completed** |
| C — Growth Engine | Publications, algorithmic feed scoring, reading lists, related posts | Pending |
| D — Monetization Mechanism | Paywall, Stripe test-mode membership, writer payout ledger | Pending |
| E — Identity, Access, Real-time | OAuth (Google + GitHub), Socket.IO notifications, post scheduling | Pending |
| F — Reader Experience Depth | Highlighting/annotations, writer analytics dashboard, dark mode | Pending |
| G — Quality Infrastructure | Vitest unit tests, Playwright E2E suite (local-only) | Pending |

See `INKWELL_FULL_PRODUCT_ROADMAP.md` for detailed feature specs, durations, and definitions of done.

---

*Blueprint updated: 2026-07-17 — Synchronized with Phase A completion. v1.3.0.*
