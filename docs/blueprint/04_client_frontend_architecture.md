# Inkwell Blueprint — 04: Client Architecture (Frontend)

> Part of the [Inkwell Project Blueprint](README.md) suite.

---

## 1. Next.js App Router Layout Tree

```
RootLayout (app/layout.jsx)
│   Fonts: Inter + Source Serif 4 via CSS variables
│   Wraps all children in <AuthProvider> + <SocketProvider>
│
├── AuthLayout ((auth)/layout.jsx)
│   Centered logo-only header; no Navbar/Footer
│   ├── /login               # Email/password + Google + GitHub OAuth buttons
│   ├── /register            # Name/username/email/password + OAuth buttons
│   ├── /forgot-password     # Request password-reset email
│   └── /reset-password      # Consume token → set new password
│
├── LegalLayout ((legal)/layout.jsx)
│   Logo-only header + Footer; no search/write nav
│   ├── /terms               # Terms of Service (static, real content)
│   └── /privacy             # Privacy Policy (static, real content)
│
├── AdminLayout ((admin)/layout.jsx)
│   Admin sidebar + topbar
│   ├── /admin               # Stats overview
│   ├── /admin/users         # User role & ban management
│   └── /admin/reports       # Moderation queue
│
└── MainLayout ((main)/layout.jsx)
    Navbar + VerificationBanner + <main> + Footer
    ├── /                    # HomePage (Latest & For You tabs)
    ├── /@[username]         # ProfilePage
    ├── /bookmarks           # BookmarksPage
    ├── /dashboard           # Writer Analytics Dashboard
    ├── /edit/[slug]         # EditPage
    ├── /new-story           # NewStoryPage (with scheduledAt scheduling)
    ├── /notifications       # NotificationsPage (real-time inbox)
    ├── /p/[slug]            # StoryPage (Server Component)
    │   └── StoryPageClient  # Client Interactivity Wrapper + HighlightLayer + RelatedPosts
    ├── /pub/[slug]          # Publication Profile Page
    │   └── dashboard/       # Publication Member Dashboard
    ├── /lists               # Personal Reading Lists Management
    │   └── [slug]           # Single Reading List View
    ├── /search              # SearchPage
    ├── /settings            # SettingsPage (profile + email prefs + account deletion)
    └── /tag/[tag]           # TagPage
```

---

## 2. Route Pages

| Route | Component | Key Features |
|---|---|---|
| `/` | HomePage | Two-tab feed (Latest & For You) + `<TrendingTags>` 7-day sidebar |
| `/dashboard` | DashboardPage | Writer Analytics Dashboard (30-day views/claps trends, story stats, follower growth) |
| `/login` | LoginPage | Email/password form → `AuthContext.login()`. Google & GitHub OAuth buttons redirect to `/api/auth/google` / `/api/auth/github`. |
| `/register` | RegisterPage | Name/username/email/password → `AuthContext.register()`. Google & GitHub OAuth buttons. |
| `/forgot-password` | ForgotPasswordPage | Email input → POST `/api/auth/forgot-password` |
| `/reset-password` | ResetPasswordPage | Reads `?token=` → POST new password to `/api/auth/reset-password` |
| `/@[username]` | ProfilePage | User bio, follow button, author's stories. Custom subdomain mapping resolves here. |
| `/p/[slug]` | StoryPage | Server Component. Feeds metadata, embeds JSON-LD schema, renders `<StoryPageClient>` with `<HighlightLayer>`. |
| `/pub/[slug]` | PublicationProfilePage | Publication header, public member list, approved story feed. |
| `/pub/[slug]/dashboard` | PublicationDashboardPage | Member submissions queue (approve/reject/changes note) + member roles management. |
| `/lists` | ReadingListsPage | Manage personal public & private reading lists + create list form. |
| `/lists/[slug]?username=` | SingleReadingListPage | Displays stories in list with dangling reference placeholders for hidden stories. |
| `/new-story` | NewStoryPage | `<StoryComposer mode="create">` |
| `/edit/[slug]` | EditPage | `<StoryComposer mode="edit">` (author-only guard) |
| `/settings` | SettingsPage | Profile edit + avatar upload + email prefs toggle + digest frequency + account deletion |
| `/bookmarks` | BookmarksPage | User's bookmarked posts via `GET /api/users/me/bookmarks` |
| `/search?q=` | SearchPage | Query `?q=` fed to `GET /api/posts?q=` |
| `/tag/[tag]` | TagPage | Filter feed by `GET /api/posts?tag=` |
| `/membership` | MembershipPage | Single-membership positioning landing page (*"One Membership. Access Every Writer."*), formula-fidelity pool breakdown, value pillars, `<SubscribeModal>` trigger |
| `/terms` | TermsPage | Terms of Service — static, real drafted content |
| `/privacy` | PrivacyPage | Privacy Policy — covers data practices, processors, export/deletion |
| `/admin` | AdminStatsPage | Real-time platform stats overview |
| `/admin/users` | AdminUsersPage | User role toggles (user/admin) & ban/unban controls |
| `/admin/reports` | AdminReportsPage | Moderation reports review queue with auto-priority tags |

---

## 3. Component Library

### `components/editor/`
- **`StoryComposer.jsx`**: Full story creation/editing shell. Manages title, subtitle, contentHtml, coverImage, tags, status, slug, `aiAssisted` status. Handles image upload via `POST /api/uploads/image`.
- **`StoryEditor.jsx`**: Tiptap WYSIWYG core with StarterKit, Image, Link, Placeholder. Sticky formatting toolbar. Syncs content.
- **`RevisionHistoryModal.jsx`**: Version control snapshot viewer with LCS diff slideover and restore actions.

### `components/layout/`
- **`Navbar.jsx`**: Sticky top navigation (search bar, Write button, notification bell badge from `SocketContext`, ThemeToggle, Avatar dropdown menu).
- **`ThemeToggle.jsx`**: Sun/moon icon toggle button managing dark mode preference.
- **`MobileDrawer.jsx`**: Slide-in nav overlay for mobile breakpoints.
- **`Footer.jsx`**: Minimal branding footer.
- **`Logo.jsx`**: SVG Inkwell wordmark.
- **`RequireAuth.jsx`**: Client-side auth gate; redirects unauthenticated users to `/login`.
- **`VerificationBanner.jsx`**: Dismissible alert prompt shown when `emailVerified === false`, with a "Resend verification email" button.

### `components/membership/`
- **`SubscribeModal.jsx`**: Razorpay test-mode checkout modal. Calls `POST /api/membership/subscribe` for session ID, then `POST /api/membership/verify` after user completes test payment overlay.
- **`WriterLedgerCard.jsx`**: Displays a writer's engagement-weighted payout ledger entries from `GET /api/writer/payout-ledger` with formula breakdown.
- **`DisputeModal.jsx`**: Allows writers to submit due process appeal disputes on held payouts within a 14-day window.
- **`MeteredReadBanner.jsx`**: Displays remaining monthly locked story free reads counter (3 free reads/month quota).

### `components/post/`
- **`PostCard.jsx`**: Feed card displaying author avatar, title, subtitle, tags, read time, claps, cover image, publication badge, and `<AIDisclosureBadge>`.
- **`PostList.jsx`**: Responsive Reflow grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`) of `<PostCard>` items using `useInfiniteScroll`.
- **`ForYouFeed.jsx`**: Personalized feed tab displaying interest-scored recommendations with an in-product "Why these stories?" disclosure card.
- **`ClapButton.jsx`**: Multi-clap button with optimistic updates, 500ms debounce batching, and 50-clap per user cap.
- **`BookmarkButton.jsx`**: Toggle bookmark state with optimistic feedback.
- **`CommentSection.jsx`**: Threaded comments list with 5-depth nesting clamp, reply form, phone depth-flattening past level 3 with context chip, soft-delete branch, and 44px minimum touch targets.
- **`TrendingTags.jsx`**: Repositioning sidebar/horizontal tag cloud displaying top tags calculated over a 7-day recency window.
- **`RelatedPosts.jsx`**: Renders up to 3 same-tag related stories on the story reader page in a responsive grid.
- **`AddToListModal.jsx`**: Modal dialog enabling users to save stories to existing or new reading lists.
- **`HighlightLayer.jsx`**: Selection listener wrapping article body to render colored highlight underlays and trigger floating note popover.
- **`HighlightPopover.jsx`**: Floating popover for adding/editing private highlight notes.
- **`AIDisclosureBadge.jsx`**: Renders explicit AI authorship disclosure badges (`AI-Assisted`, `AI Co-Written`).

### `components/profile/`
- **`FollowButton.jsx`**: Toggle follow/unfollow with real-time count.
- **`SovereignExportCard.jsx`**: Renders account data export controls including `followers.json` and `posts` markdown ZIP.

---

## 4. Design System (Tailwind)

- **6-Token Decision-Zone Breakpoint Scale:**
  - `xs`: `0px` — Small phones
  - `sm`: `480px` — Standard phones & phablets
  - `md`: `768px` — Tablets & small laptops
  - `lg`: `1024px` — Laptops
  - `xl`: `1280px` — Desktops
  - `2xl`: `1536px` — Ultra-wide viewports
- **Layout Adaptation Patterns:** Reflow (`PostList`, `RelatedPosts`), Reposition (`TrendingTags`, Navbar search), Reveal-Conceal (`PublicationDashboardPage`), Replace (`MobileDrawer`, `CommentSection` depth flattening).
- **Colors:** Primary Accent Indigo (`#4f46e5`), Body Ink (`#242424`), Ink Soft (`#6b6b6b`), Ink Faint (`#a3a3a3`).
- **Typography:** `font-sans` (Inter), `font-serif` (Source Serif 4).
- **Touch Targets:** 44px minimum touch target size across all mobile interactive controls.


---

## 4. State Management & Context

**`AuthContext.jsx`** — Single React context for global auth state:
```
AuthProvider
├── state: { user: AuthUser | null, loading: boolean }
├── refreshUser()  → GET /api/auth/me  (called on mount)
├── login(email, password)  → POST /api/auth/login
├── register(payload)       → POST /api/auth/register
├── logout()                → POST /api/auth/logout → user = null
└── setUser(u)              → update state
```

- Bootstraps on app load by calling `/api/auth/me`.
- `useAuth()` hook provides easy access.

**`ThemeContext.jsx`** — Dark mode theme state & cookie sync provider:
```
ThemeProvider (wraps RootLayout)
├── state: { theme: 'light' | 'dark' | 'system' }
├── setTheme(t) → syncs cookie + PATCH /api/users/me (if logged in)
└── useTheme() hook
```

**`SocketContext.jsx`** — Socket.IO client + notification state management:
```
SocketProvider (wraps children inside AuthProvider)
├── state: { socket, unreadCount, notifications }
├── Connects when user is authenticated (disconnects on logout)
├── Fetches initial notifications: GET /api/notifications?limit=10
├── Listens for 'notification' events → prepends to list, increments unreadCount
├── markAsRead(id)   → PATCH /api/notifications/:id/read
├── markAllAsRead()  → PATCH /api/notifications/read-all
└── refreshNotifications() → manual re-fetch
```

- `useSocket()` hook provides access to socket instance and notification state.
- Navbar consumes `unreadCount` to render the notification bell badge.

---

## 6. Utility Library (`lib/`)

**`lib/api.js`** — Core fetch wrapper:
- Always sends `credentials: 'include'` for cross-origin cookies.
- Automatically sets `Content-Type: application/json`.
- On 401: silently attempts `POST /api/auth/refresh` once (singleton `refreshPromise` prevents concurrent stampedes).
  - If refresh succeeds → retries original request.
  - If refresh fails → throws 401 error.
- Returns `data` field of success envelope.
- Exports: `apiFetch`, `api` (get/post/patch/del/upload shortcuts), `ApiError`, `resolveMedia`.

**`lib/diff.js`** — LCS word-level diff for post revision comparison:
- Used in the revision slideover panel to show word-level insertions and deletions between two `contentHtml` snapshots.

**`lib/utils.js`** — Shared helpers: `formatDate`, `formatCount`, `cx` (className merge), `initials`.

---

## 7. Design System (Tailwind)

- **Colors:** Primary Accent Indigo (`#4f46e5`), Body Ink (`#242424`), Ink Soft (`#6b6b6b`), Ink Faint (`#a3a3a3`).
- **Typography:** `font-sans` (Inter), `font-serif` (Source Serif 4).
- **Max widths:** `max-w-reading` (680px for article body), `max-w-feed` (728px for post list feed).
- **Animations:** `animate-clap` (0.3s pulse scale on clap).

---

*Next document: [05 Data Flows & Subdomain Routing](05_data_flows_and_subdomains.md)*
