# Inkwell Blueprint — 04: Client Architecture (Frontend)

> Part of the [Inkwell Project Blueprint](README.md) suite.

---

## 1. Next.js App Router Layout Tree

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
    ├── /edit/[slug]         # EditPage
    ├── /new-story           # NewStoryPage
    ├── /p/[slug]            # StoryPage (Server Component)
    │   └── StoryPageClient  # Client Interactivity Wrapper + RelatedPosts
    ├── /pub/[slug]          # Publication Profile Page
    │   └── dashboard/       # Publication Member Dashboard
    ├── /lists               # Personal Reading Lists Management
    │   └── [slug]           # Single Reading List View
    ├── /notifications       # Notifications Inbox Page
    ├── /search              # SearchPage
    ├── /settings            # SettingsPage (profile + email prefs + account deletion)
    └── /tag/[tag]           # TagPage
```

---

## 2. Route Pages

| Route | Component | Key Features |
|---|---|---|
| `/` | HomePage | Two-tab feed (Latest & For You) + `<TrendingTags>` 7-day sidebar |
| `/login` | LoginPage | Email/password form → `AuthContext.login()` |
| `/register` | RegisterPage | Name/username/email/password → `AuthContext.register()` |
| `/forgot-password` | ForgotPasswordPage | Email input → POST `/api/auth/forgot-password` |
| `/reset-password` | ResetPasswordPage | Reads `?token=` → POST new password to `/api/auth/reset-password` |
| `/@[username]` | ProfilePage | User bio, follow button, author's stories. Custom subdomain mapping resolves here. |
| `/p/[slug]` | StoryPage | Server Component. Feeds metadata, embeds JSON-LD schema, renders `<StoryPageClient>`. |
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
| `/terms` | TermsPage | Terms of Service — static, real drafted content |
| `/privacy` | PrivacyPage | Privacy Policy — covers data practices, processors, export/deletion |
| `/admin` | AdminStatsPage | Real-time platform stats overview |
| `/admin/users` | AdminUsersPage | User role toggles (user/admin) & ban/unban controls |
| `/admin/reports` | AdminReportsPage | Moderation reports review queue with auto-priority tags |

---

## 3. Component Library

### `components/editor/`
- **`StoryComposer.jsx`**: Full story creation/editing shell. Manages title, subtitle, contentHtml, coverImage, tags, status, slug. Handles image upload via `POST /api/uploads/image`.
- **`StoryEditor.jsx`**: Tiptap WYSIWYG core with StarterKit, Image, Link, Placeholder. Sticky formatting toolbar. Syncs content.

### `components/layout/`
- **`Navbar.jsx`**: Sticky top navigation (search bar, Write button, Avatar dropdown menu).
- **`MobileDrawer.jsx`**: Slide-in nav overlay for mobile breakpoints.
- **`Footer.jsx`**: Minimal branding footer.
- **`Logo.jsx`**: SVG Inkwell wordmark.
- **`RequireAuth.jsx`**: Client-side auth gate; redirects unauthenticated users to `/login`.
- **`VerificationBanner.jsx`**: Dismissible alert prompt shown when `emailVerified === false`, with a "Resend verification email" button.

### `components/post/`
- **`PostCard.jsx`**: Feed card displaying author avatar, title, subtitle, tags, read time, claps, cover image, publication badge.
- **`PostList.jsx`**: Infinite-scrolling list of `<PostCard>` items using `useInfiniteScroll`.
- **`ForYouFeed.jsx`**: Personalized feed tab displaying interest-scored recommendations with an in-product "Why these stories?" disclosure card.
- **`ClapButton.jsx`**: Multi-clap button with optimistic updates, 500ms debounce batching, and 50-clap per user cap.
- **`BookmarkButton.jsx`**: Toggle bookmark state with optimistic feedback.
- **`CommentSection.jsx`**: Threaded comments list with 5-depth nesting clamp, reply form, and soft-delete placeholder branch.
- **`TrendingTags.jsx`**: Sidebar tag cloud displaying top tags calculated over a 7-day recency window.
- **`RelatedPosts.jsx`**: Renders up to 3 same-tag related stories on the story reader page.
- **`AddToListModal.jsx`**: Modal dialog enabling users to save stories to existing or new reading lists.

### `components/profile/`
- **`FollowButton.jsx`**: Toggle follow/unfollow with real-time count.

### `components/ui/`
- **`Avatar.jsx`**: Round image with initials fallback.
- **`Button.jsx`**: Styled buttons (`default`, `secondary`, `ghost`, `danger`).
- **`Input.jsx`**: Form input with label + error text.
- **`Skeleton.jsx`**: Animated loading placeholder.

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

---

## 5. API Client (`lib/api.js`)

**Core function: `apiFetch(path, options)`**
- Always sends `credentials: 'include'` for cross-origin cookies.
- Automatically sets `Content-Type: application/json`.
- On 401: silently attempts `POST /api/auth/refresh` once (singleton promise prevents stampedes).
  - If refresh succeeds → retries original request.
  - If refresh fails → throws 401 error.
- Returns `data` field of success envelope.

---

## 6. Design System (Tailwind)

- **Colors:** Primary Accent Indigo (`#4f46e5`), Body Ink (`#242424`), Ink Soft (`#6b6b6b`), Ink Faint (`#a3a3a3`).
- **Typography:** `font-sans` (Inter), `font-serif` (Source Serif 4).
- **Max widths:** `max-w-reading` (680px for article body), `max-w-feed` (728px for post list feed).
- **Animations:** `animate-clap` (0.3s pulse scale on clap).

---

*Next document: [05 Data Flows & Subdomain Routing](05_data_flows_and_subdomains.md)*
