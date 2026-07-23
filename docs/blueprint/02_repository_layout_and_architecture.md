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
├── INKWELL_FULL_PRODUCT_ROADMAP.md ← Phase A–G product roadmap
├── PHASE_A_IMPLEMENTATION_PLAN.md
├── PHASE_B_IMPLEMENTATION_PLAN.md
├── PHASE_C_IMPLEMENTATION_PLAN.md
├── PHASE_D_IMPLEMENTATION_PLAN.md
├── PHASE_E_IMPLEMENTATION_PLAN.md
├── PHASE_F_G_IMPLEMENTATION_PLAN.md
│
├── client/                         ← Next.js 16 frontend (port 3000)
│   ├── package.json
│   ├── next.config.mjs             ← API rewrites (/api/* → :5000), image remote patterns
│   ├── tailwind.config.js          ← Design tokens, typography plugin, darkMode: 'class'
│   ├── postcss.config.mjs
│   ├── jsconfig.json               ← Path alias: @/ → src/
│   ├── .env.example / .env.local
│   ├── public/
│   └── src/
│       ├── middleware.js           ← Subdomain rewrites (ada.inkwell.app → /@ada)
│       ├── app/                    ← App Router root
│       │   ├── layout.jsx          ← Root layout: fonts + ThemeProvider + AuthProvider + SocketProvider
│       │   ├── globals.css         ← Base CSS + Tailwind directives + dark mode CSS variables
│       │   ├── sitemap.js          ← Dynamic sitemap.xml route generator
│       │   ├── robots.js           ← Dynamic robots.txt route generator
│       │   ├── (auth)/             ← Route group: no Navbar
│       │   │   ├── layout.jsx      ← Centered logo header only
│       │   │   ├── login/page.jsx
│       │   │   ├── register/page.jsx
│       │   │   ├── forgot-password/page.jsx
│       │   │   └── reset-password/page.jsx
│       │   ├── (legal)/            ← Route group: legal pages
│       │   │   ├── layout.jsx
│       │   │   ├── terms/page.jsx
│       │   │   └── privacy/page.jsx
│       │   ├── (admin)/            ← Route group: admin panel
│       │   │   └── admin/
│       │   │       ├── layout.jsx  ← Admin sidebar + topbar
│       │   │       ├── page.jsx    ← Stats overview
│       │   │       ├── users/page.jsx
│       │   │       └── reports/page.jsx
│       │   └── (main)/             ← Route group: Navbar + Footer
│       │       ├── layout.jsx      ← Navbar + VerificationBanner + main + Footer wrapper
│       │       ├── page.jsx        ← Home feed (Latest & For You tabs)
│       │       ├── [username]/page.jsx    ← Profile (/@username)
│       │       ├── bookmarks/page.jsx
│       │       ├── dashboard/page.jsx     ← Writer analytics dashboard
│       │       ├── edit/[slug]/page.jsx
│       │       ├── new-story/page.jsx
│       │       ├── notifications/page.jsx ← Notifications inbox
│       │       ├── p/[slug]/page.jsx      ← Server Component: dynamic metadata + JSON-LD
│       │       │   └── StoryPageClient.jsx ← Client interactivity wrapper + HighlightLayer + RelatedPosts
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
│       │   │   ├── Navbar.jsx            ← Sticky header, search, avatar menu, notification bell
│       │   │   ├── ThemeToggle.jsx       ← Sun/moon dark mode toggle
│       │   │   ├── Footer.jsx
│       │   │   ├── Logo.jsx
│       │   │   ├── MobileDrawer.jsx      ← Hamburger nav overlay
│       │   │   ├── VerificationBanner.jsx← Unverified email alert banner
│       │   │   └── RequireAuth.jsx       ← Auth gate wrapper
│       │   ├── membership/
│       │   │   ├── SubscribeModal.jsx    ← Razorpay test-mode checkout modal
│       │   │   └── WriterLedgerCard.jsx  ← Writer payout ledger display card
│       │   ├── post/
│       │   │   ├── PostCard.jsx          ← Feed card
│       │   │   ├── PostList.jsx          ← Infinite-scroll list
│       │   │   ├── ClapButton.jsx        ← Multi-clap + optimistic update
│       │   │   ├── BookmarkButton.jsx    ← Toggle bookmark
│       │   │   ├── CommentSection.jsx    ← Threaded comments list + form
│       │   │   ├── TrendingTags.jsx      ← Sidebar 7-day tag cloud
│       │   │   ├── ForYouFeed.jsx        ← Personalized feed tab with disclosure
│       │   │   ├── RelatedPosts.jsx      ← Story page same-tag related posts
│       │   │   ├── AddToListModal.jsx    ← Save to reading list popup
│       │   │   ├── HighlightLayer.jsx    ← Selection listener & highlight underlays
│       │   │   └── HighlightPopover.jsx  ← Floating annotation note editor
│       │   ├── profile/
│       │   │   └── FollowButton.jsx      ← Toggle follow/unfollow
│       │   └── ui/
│       │       ├── Avatar.jsx            ← Image + initials fallback
│       │       ├── Button.jsx            ← Variants: default, secondary, ghost, danger
│       │       ├── Input.jsx             ← Styled form input
│       │       └── Skeleton.jsx          ← Loading placeholder
│       ├── context/
│       │   ├── AuthContext.jsx           ← Global auth state + actions
│       │   ├── ThemeContext.jsx          ← Dark mode theme state + cookie sync
│       │   └── SocketContext.jsx         ← Socket.IO client + notification state
│       ├── hooks/
│       │   ├── useInfiniteScroll.js      ← IntersectionObserver sentinel
│       │   └── useHighlights.js          ← Highlight CRUD and DOM locator hook
│       └── lib/
│           ├── api.js                    ← Fetch wrapper + token refresh
│           ├── diff.js                   ← LCS word diff for revision comparison
│           └── utils.js                  ← formatDate, formatCount, cx, initials
│
├── e2e/                            ← Playwright E2E suite
│   ├── playwright.config.js        ← Base URL, HTML reporter, headless config
│   ├── fixtures/
│   │   └── auth.fixture.js         ← Test user authentication fixture
│   └── specs/                      ← Specs: auth, publish, engage, moderation, membership, highlight, analytics, darkmode, oauth
│
└── server/                         ← Express API (port 5000)
    ├── package.json
    ├── nodemon.json                 ← Watch: src/**/*.js
    ├── .env.example / .env
    ├── uploads/                     ← Local image storage (gitignored)
    ├── test/                        ← Vitest test suite
    │   ├── setup/                   ← db.js (isolated DB), socketTestServer.js
    │   ├── unit/                    ← entitlement, slugify, readTime, highlightLocate, ledger, diff
    │   └── integration/             ← cascade, payout-ledger, analytics, darkmode, highlight, moderation, oauth
    └── src/
        ├── server.js                ← Bootstrap: DB connect → HTTP listen → initSocket()
        ├── app.js                   ← Express app: CORS, body parsers, passport, routes
        ├── config/
        │   ├── env.js               ← Validated env object (all vars with typed defaults)
        │   ├── db.js                ← Mongoose connect
        │   ├── passport.js          ← Google + GitHub OAuth strategies (Passport.js)
        │   └── socket.js            ← Socket.IO init, cookie auth handshake, notification emit
        ├── models/
        │   ├── User.js              ← Schema + googleId/githubId, themePreference, membershipStatus
        │   ├── Post.js              ← Schema + seo, indexable, locked, scheduledAt, visibleQuery
        │   ├── Comment.js           ← Threaded comments schema
        │   ├── Notification.js      ← Real-time notification schema
        │   ├── Publication.js       ← Publication schema
        │   ├── PublicationMember.js ← Publication membership role schema
        │   ├── ReadingList.js       ← Reading list schema
        │   ├── Follow.js            ← Attributed follow history schema
        │   ├── Report.js            ← Moderation report schema
        │   ├── AuditLog.js          ← Moderation action log schema
        │   ├── PostRevision.js      ← Edit snapshot revision schema
        │   ├── ReadEvent.js         ← Active foreground read time telemetry
        │   ├── MembershipPayment.js ← Razorpay subscription payment audit record
        │   ├── PayoutLedgerEntry.js ← Engagement-weighted writer payout entry
        │   ├── WebhookEvent.js      ← Webhook idempotency deduplication record
        │   └── Highlight.js         ← Text highlight/annotation schema
        ├── controllers/
        │   ├── auth.controller.js   ← register, login, logout, refresh, me, OAuth callback
        │   ├── post.controller.js   ← CRUD + sitemap-data, clap, bookmark, trendingTags, related, revisions, toggleTagFollow
        │   ├── user.controller.js   ← profile, updateMe, uploadAvatar, follow, bookmarks, export, delete (18-step), subdomain
        │   ├── comment.controller.js← list, add, delete (threaded soft-delete)
        │   ├── notification.controller.js ← getNotifications, markAsRead, markAllAsRead
        │   ├── publication.controller.js  ← Publication management, submissions queue, review
        │   ├── readingList.controller.js  ← Reading list CRUD & post management
        │   ├── recommendation.controller.js ← Personalized recommendation scoring pipeline
        │   ├── admin.controller.js  ← Admin stats, reports queue, user role/ban/unban, unhide
        │   ├── membership.controller.js ← Razorpay subscribe, verify, cancel, test-sign, webhook handler
        │   ├── ledger.controller.js ← Writer payout ledger entries
        │   ├── telemetry.controller.js ← Read event recording
        │   ├── report.controller.js ← Create content moderation report
        │   ├── analytics.controller.js ← Aggregate writer analytics
        │   └── highlight.controller.js ← Highlight CRUD & paywall guard
        ├── routes/
        │   ├── auth.routes.js       ← POST register/login/logout/refresh, GET me, OAuth routes
        │   ├── post.routes.js       ← Post CRUD, clap, bookmark, revisions, tag follow, related
        │   ├── user.routes.js       ← Profile, updateMe, avatar, follow, export, subdomain, delete
        │   ├── comment.routes.js    ← DELETE /comments/:id
        │   ├── publication.routes.js← Publication CRUD, members, submissions
        │   ├── readingList.routes.js← Reading list CRUD & post management
        │   ├── notification.routes.js ← GET, mark-read, mark-all-read
        │   ├── admin.routes.js      ← Admin-only stats, reports, user management
        │   ├── report.routes.js     ← POST /reports
        │   ├── membership.routes.js ← subscribe, verify, cancel, test-sign, webhook
        │   ├── ledger.routes.js     ← GET /writer/payout-ledger
        │   ├── telemetry.routes.js  ← POST /telemetry/read-event
        │   ├── upload.routes.js     ← POST /uploads/image (multipart)
        │   ├── writer.routes.js     ← GET /writer/analytics
        │   ├── highlight.routes.js  ← Highlight CRUD
        │   └── feed.routes.js       ← RSS feeds (global, author, tag)
        ├── middlewares/
        │   ├── auth.middleware.js   ← requireAuth / optionalAuth / requireAdmin
        │   ├── error.middleware.js  ← notFound + centralized errorHandler
        │   ├── rateLimiter.js       ← authLimiter (50/15m), forgotPasswordLimiter, generalLimiter (1000/15m)
        │   ├── upload.middleware.js ← Multer: disk storage, 5MB limit, image-only
        │   └── validate.js          ← express-validator result handler (422 on failure)
        ├── utils/
        │   ├── jwt.js               ← sign/verify tokens + set/clear httpOnly cookie helpers
        │   ├── apiResponse.js       ← sendSuccess() + ApiError class
        │   ├── asyncHandler.js      ← try/catch wrapper for async controllers
        │   ├── slugify.js           ← baseSlug() + makeSlug() (unique 8-char hex suffix)
        │   ├── sanitize.js          ← sanitize-html: strips XSS from editor HTML
        │   ├── readTime.js          ← estimateReadTime() at 200 WPM
        │   ├── rss.js               ← RSS feed builder utilizing 'feed' library
        │   ├── exportAccount.js     ← ZIP stream export using 'archiver' + 'turndown'
        │   ├── notify.js            ← Email notification dispatcher + Socket.IO push
        │   ├── emailTemplates.js    ← Transactional HTML email templates
        │   ├── email.js             ← Email send via Resend → Mailtrap → console fallback
        │   ├── entitlement.js       ← canReadFull(post, viewer) paywall check helper
        │   ├── unsubscribeToken.js  ← HMAC CAN-SPAM unsubscribe token sign/verify
        │   └── sanitize.js          ← sanitize-html wrapper
        ├── validators/
        │   ├── auth.validator.js    ← registerRules, loginRules, forgotPasswordRules, resetPasswordRules
        │   ├── post.validator.js    ← createPostRules, updatePostRules, commentRules
        │   └── user.validator.js    ← updateSubdomainRules
        └── scripts/
            ├── seed.js              ← Main orchestrator: calls seed-data, seed-content, seed-moderation
            ├── seed-data.js         ← 120 users, 500 posts, 800 follows, 1200 comments
            ├── seed-content.js      ← Reading lists, publications, membership payments, read events
            ├── seed-moderation.js   ← Reports, audit logs, moderation data
            ├── check_scheduled_posts.js ← Auto-publishes scheduled draft posts (cron runner)
            ├── promote_admin.js     ← Promote a user account to admin role
            ├── send-weekly-digest.js← Weekly digest email manual trigger
            ├── reset_export_limit.js← Reset exportRequestedAt for all users (dev helper)
            ├── backfill_follows.js  ← Backfill Follow model records from User.followers/following arrays
            ├── run_evidence_verification.js ← 10-suite E2E verification
            ├── verify_four_open_items.js ← Targeted verification for specific open items
            ├── test_seo_spec.js     ← Model schema verification script
            ├── test_phase_b.js      ← Phase B automated integration test suite
            ├── test_phase_c.js      ← Phase C automated integration test suite
            ├── test_phase_d.js      ← Phase D automated integration test suite
            └── test_phase_e.js      ← Phase E automated integration test suite
```s       ← canReadFull(post, viewer) paywall check helper
        │   ├── unsubscribeToken.js  ← HMAC CAN-SPAM unsubscribe token sign/verify
        │   └── sanitize.js          ← sanitize-html wrapper
        ├── validators/
        │   ├── auth.validator.js    ← registerRules, loginRules, forgotPasswordRules, resetPasswordRules
        │   ├── post.validator.js    ← createPostRules, updatePostRules, commentRules
        │   └── user.validator.js    ← updateSubdomainRules
        └── scripts/
            ├── seed.js              ← Main orchestrator: calls seed-data, seed-content, seed-moderation
            ├── seed-data.js         ← 120 users, 500 posts, 800 follows, 1200 comments
            ├── seed-content.js      ← Reading lists, publications, membership payments, read events
            ├── seed-moderation.js   ← Reports, audit logs, moderation data
            ├── check_scheduled_posts.js ← Auto-publishes scheduled draft posts (cron runner)
            ├── promote_admin.js     ← Promote a user account to admin role
            ├── send-weekly-digest.js← Weekly digest email manual trigger
            ├── reset_export_limit.js← Reset exportRequestedAt for all users (dev helper)
            ├── backfill_follows.js  ← Backfill Follow model records from User.followers/following arrays
            ├── run_evidence_verification.js ← 10-suite E2E verification
            ├── verify_four_open_items.js ← Targeted verification for specific open items
            ├── test_seo_spec.js     ← Model schema verification script
            ├── test_phase_b.js      ← Phase B automated integration test suite
            ├── test_phase_c.js      ← Phase C automated integration test suite
            ├── test_phase_d.js      ← Phase D automated integration test suite
            └── test_phase_e.js      ← Phase E automated integration test suite
```

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BROWSER (User)                                      │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │              Next.js 16 Client  (localhost:3000)                      │  │
│  │                                                                       │  │
│  │  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────────┐    │  │
│  │  │  AuthContext │  │  SocketContext   │  │  Route Pages         │    │  │
│  │  │  (React ctx) │  │  (Socket.IO)     │  │  (App Router)        │    │  │
│  │  │  user state  │  │  live notifs     │  │  sitemap.js          │    │  │
│  │  │  login/logout│  │  unread badge    │  │  robots.js           │    │  │
│  │  └──────┬───────┘  └────────┬─────────┘  └──────────┬───────────┘    │  │
│  │         │                   │                        │                │  │
│  │         └───────────────────┼────────────────────────┘                │  │
│  │                             │                                         │  │
│  │                    lib/api.js (apiFetch)                              │  │
│  │         fetch() with credentials + auto token refresh                 │  │
│  └─────────────────────────────┬─────────────────────────────────────────┘  │
│                                │  httpOnly cookies                          │
│              HTTP/JSON + WS    │  (accessToken, refreshToken)               │
└────────────────────────────────┼────────────────────────────────────────────┘
                                 │
                    ┌────────────▼──────────────────┐
                    │   Express API (localhost:5000)  │
                    │                                │
                    │  CORS ← CLIENT_URL patterns    │
                    │  Rate limiters                 │
                    │  Cookie parser                 │
                    │  Body parser (JSON 1MB)        │
                    │  Passport.js (OAuth)           │
                    │                                │
                    │  Socket.IO Server              │
                    │  ├── Cookie auth handshake     │
                    │  ├── user:<id> personal rooms  │
                    │  └── emitNotificationToUser()  │
                    │                                │
                    │  /api/auth/*   authLimiter     │
                    │  /api/posts/*                  │
                    │  /api/publications/*           │
                    │  /api/lists/*                  │
                    │  /api/users/*                  │
                    │  /api/admin/*                  │
                    │  /api/reports/*                │
                    │  /api/comments/*               │
                    │  /api/notifications/*          │
                    │  /api/membership/*             │
                    │  /api/telemetry/*              │
                    │  /api/writer/*                 │
                    │  /api/feed/*                   │
                    │  /api/uploads/*                │
                    │  /api/webhooks/*               │
                    │  /uploads/*    static          │
                    │                                │
                    │  ┌─────────────────────────┐   │
                    │  │  Middleware Chain        │   │
                    │  │  requireAuth            │   │
                    │  │  optionalAuth           │   │
                    │  │  requireAdmin           │   │
                    │  │  validate               │   │
                    │  └─────────────────────────┘   │
                    │                                │
                    │  Controllers → Models          │
                    └────────────┬───────────────────┘
                                 │
                    ┌────────────▼──────────────────┐
                    │           MongoDB              │
                    │    Database: inkwell           │
                    │                                │
                    │  ┌─────────┐  ┌─────────────┐  │
                    │  │  User   │  │    Post     │  │
                    │  └─────────┘  └─────────────┘  │
                    │  ┌─────────┐  ┌─────────────┐  │
                    │  │ Comment │  │ Notification│  │
                    │  └─────────┘  └─────────────┘  │
                    │  ┌─────────┐  ┌─────────────┐  │
                    │  │ Follow  │  │ Publication │  │
                    │  └─────────┘  └─────────────┘  │
                    │  ┌─────────┐  ┌─────────────┐  │
                    │  │ReadList │  │  ReadEvent  │  │
                    │  └─────────┘  └─────────────┘  │
                    │  ┌─────────┐  ┌─────────────┐  │
                    │  │ Report  │  │  AuditLog   │  │
                    │  └─────────┘  └─────────────┘  │
                    │  ┌─────────────────────────┐    │
                    │  │ MembershipPayment       │    │
                    │  │ PayoutLedgerEntry       │    │
                    │  │ WebhookEvent            │    │
                    │  │ PostRevision            │    │
                    │  └─────────────────────────┘    │
                    └────────────────────────────────┘
```

---

*Next document: [03 Server Architecture (Backend)](03_server_backend_architecture.md)*
