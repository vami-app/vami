# Inkwell Blueprint — 02: Repository Layout & Architecture Diagram

> Part of the [Inkwell Project Blueprint](README.md) suite.

---

## 1. Repository Layout (Monorepo)

```
inkwell/                            ← pnpm workspace root
│
├── package.json                    ← Root scripts: dev, build, start, seed
├── pnpm-workspace.yaml             ← Workspace: ["client", "server"]
├── pnpm-lock.yaml                  ← Lockfile (pnpm v11)
├── .npmrc                          ← pnpm settings
├── .gitignore
├── README.md
├── PROJECT_BLUEPRINT.md            ← Master blueprint document
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
│       │   ├── (legal)/            ← Route group: legal pages
│       │   │   ├── layout.jsx
│       │   │   ├── terms/page.jsx
│       │   │   └── privacy/page.jsx
│       │   └── (main)/             ← Route group: Navbar + Footer
│       │       ├── layout.jsx      ← Navbar + main + Footer wrapper
│       │       ├── page.jsx        ← Home feed (/)
│       │       ├── [username]/page.jsx    ← Profile (/@username)
│       │       ├── bookmarks/page.jsx
│       │       ├── edit/[slug]/page.jsx
│       │       ├── new-story/page.jsx
│       │       ├── p/[slug]/page.jsx      ← Server Component: dynamic metadata + JSON-LD
│       │       │   └── StoryPageClient.jsx ← Client interactivity wrapper (claps, comments)
│       │       ├── pub/[slug]/            ← Publication profile page
│       │       │   └── dashboard/         ← Publication member dashboard
│       │       ├── lists/                 ← Reading lists management page
│       │       │   └── [slug]/            ← Single reading list view
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
│       │   │   ├── VerificationBanner.jsx← Unverified email alert banner
│       │   │   └── RequireAuth.jsx       ← Auth gate wrapper
│       │   ├── post/
│       │   │   ├── PostCard.jsx          ← Feed card
│       │   │   ├── PostList.jsx          ← Infinite-scroll list
│       │   │   ├── ClapButton.jsx        ← Multi-clap + optimistic update
│       │   │   ├── BookmarkButton.jsx    ← Toggle bookmark
│       │   │   ├── CommentSection.jsx    ← Threaded comments list + form
│       │   │   ├── TrendingTags.jsx      ← Sidebar 7-day tag cloud
│       │   │   ├── ForYouFeed.jsx        ← Personalized feed tab with disclosure
│       │   │   ├── RelatedPosts.jsx      ← Story page same-tag related posts
│       │   │   └── AddToListModal.jsx    ← Save to reading list popup
│       │   ├── profile/
│       │   │   └── FollowButton.jsx      ← Toggle follow/unfollow
│       │   └── ui/
│       │       ├── Avatar.jsx            ← Image + initials fallback
│       │       ├── Button.jsx            ← Variants: default, secondary, ghost, danger
│       │       ├── Input.jsx             ← Styled form input
│       │       └── Skeleton.jsx          ← Loading placeholder
│       ├── context/
│       │   └── AuthContext.jsx           ← Global auth state + actions
│       ├── hooks/
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
        │   ├── Post.js              ← Schema + seo fields, indexable, pre-save hooks, visibleQuery
        │   ├── Publication.js       ← Publication schema
        │   ├── PublicationMember.js ← Membership role schema
        │   ├── ReadingList.js       ← Reading list schema
        │   ├── Follow.js            ← Attributed follow history schema
        │   ├── Report.js            ← Moderation report schema
        │   ├── AuditLog.js          ← Moderation action log schema
        │   ├── PostRevision.js      ← Edit snapshot revision schema
        │   └── Comment.js           ← Threaded comments schema
        ├── controllers/
        │   ├── auth.controller.js   ← register, login, logout, refresh, me
        │   ├── post.controller.js   ← CRUD + sitemap-data, clap, bookmark, trendingTags, related
        │   ├── user.controller.js   ← profile, updateMe, uploadAvatar, follow, bookmarks, export, delete
        │   ├── publication.controller.js ← Publication management, submissions queue, review
        │   ├── recommendation.controller.js ← Personalized recommendation scoring pipeline
        │   ├── readingList.controller.js ← Reading list CRUD & post management
        │   ├── admin.controller.js  ← Admin stats, reports queue, user role/ban control
        │   └── comment.controller.js← list, add, delete (threaded soft-delete)
        ├── routes/
        │   ├── auth.routes.js
        │   ├── post.routes.js
        │   ├── user.routes.js
        │   ├── publication.routes.js
        │   ├── readingList.routes.js
        │   ├── admin.routes.js
        │   ├── report.routes.js
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
        │   ├── exportAccount.js     ← ZIP stream export using 'archiver' + 'turndown'
        │   ├── notify.js            ← Email notification dispatcher
        │   └── emailTemplates.js    ← Transactonal HTML email templates
        ├── validators/
        │   ├── auth.validator.js    ← registerRules, loginRules
        │   └── post.validator.js    ← createPostRules, updatePostRules, commentRules
        └── scripts/
            ├── seed.js              ← Demo data: 5 users, 15 posts, comments, follows, claps
            ├── test_seo_spec.js     ← Verification script for user/post model schemas
            ├── reset_export_limit.js ← Utility script to reset export limits
            ├── run_evidence_verification.js ← 10-suite E2E verification
            ├── send-weekly-digest.js← Weekly digest cron trigger
            ├── test_phase_b.js      ← Phase B automated verification suite
            └── test_phase_c.js      ← Phase C automated verification suite
```

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BROWSER (User)                                  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │              Next.js 15 Client  (localhost:3000)                  │  │
│  │                                                                   │  │
│  │  ┌──────────────┐  ┌──────────────────┐  ┌─────────────────────┐  │  │
│  │  │  AuthContext │  │  Route Pages     │  │  middleware         │  │  │
│  │  │  (React ctx) │  │  (App Router)    │  │  (subdomains)       │  │  │
│  │  │  user state  │  │  sitemap.js      │  │                     │  │  │
│  │  │  login/logout│  │  robots.js       │  │                     │  │  │
│  │  └──────┬───────┘  └────────┬─────────┘  └──────────┬──────────┘  │  │
│  │         │                   │                       │             │  │
│  │         └───────────────────┼───────────────────────┘             │  │
│  │                             │                                     │  │
│  │                    lib/api.js (apiFetch)                          │  │
│  │         fetch() with credentials + auto token refresh             │  │
│  └─────────────────────────────┬─────────────────────────────────────┘  │
│                                │  httpOnly cookies                      │
│                    HTTP + JSON │  (accessToken, refreshToken)           │
└────────────────────────────────┼────────────────────────────────────────┘
                                 │
                    ┌────────────▼──────────────┐
                    │  Express API (localhost:5000) │
                    │                           │
                    │  CORS ← CLIENT_URL        │
                    │  Rate limiters            │
                    │  Cookie parser            │
                    │  Body parser (JSON 1MB)   │
                    │                           │
                    │  /api/auth/*   authLimiter│
                    │  /api/posts/*             │
                    │  /api/publications/*      │
                    │  /api/lists/*             │
                    │  /api/users/*             │
                    │  /api/admin/*             │
                    │  /api/reports/*           │
                    │  /api/comments/*          │
                    │  /api/feed/*              │
                    │  /api/uploads/*           │
                    │  /uploads/*    static     │
                    │                           │
                    │  ┌─────────────────────┐  │
                    │  │  Middleware Chain   │  │
                    │  │  requireAuth        │  │
                    │  │  optionalAuth       │  │
                    │  │  validate           │  │
                    │  └─────────────────────┘  │
                    │                           │
                    │  Controllers → Models     │
                    └────────────┬──────────────┘
                                 │
                    ┌────────────▼──────────────┐
                    │         MongoDB           │
                    │   Database: inkwell       │
                    │                           │
                    │  ┌─────────┐  ┌─────────┐ │
                    │  │  User   │  │  Post   │ │
                    │  └─────────┘  └─────────┘ │
                    │  ┌─────────┐  ┌─────────┐ │
                    │  │ Comment │  │ Follow  │ │
                    │  └─────────┘  └─────────┘ │
                    │  ┌─────────┐  ┌─────────┐ │
                    │  │ Pub/Mem │  │ ReadList│ │
                    │  └─────────┘  └─────────┘ │
                    │  ┌─────────┐  ┌─────────┐ │
                    │  │ Report  │  │ AuditLog│ │
                    │  └─────────┘  └─────────┘ │
                    └───────────────────────────┘
```

---

*Next document: [03 Server Architecture (Backend)](03_server_backend_architecture.md)*
