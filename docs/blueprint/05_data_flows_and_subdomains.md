# Inkwell Blueprint — 05: Data Flows & Subdomain Routing

> Part of the [Inkwell Project Blueprint](README.md) suite.

---

## 1. Authentication & Subdomain Flow

```
┌──────────────┐              ┌─────────────┐              ┌─────────────┐
│    Browser   │              │  Express API │              │  MongoDB    │
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

Subdomain routing in Next.js (`client/src/middleware.js`) inspects incoming hostname headers (e.g. `ada.inkwell.app`). If a subdomain is detected, it rewrites the request internally to `/@ada`, loading the user's profile seamlessly.

---

## 2. End-to-End Data Flows

### Reading the Home Feed

```
HomePage
  └── <PostList> mounts
       │
       ├── apiFetch('GET /api/posts?limit=10')
       │    └── Express: optionalAuth → listPosts controller
       │         ├── filter: Post.visibleQuery()
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

### Clapping (Debounced Batching)

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

### Publication Submission & Review Flow

```
Author submits draft/published story
  └── POST /api/posts/:slug/submit { publicationSlug }
       └── Server: verify membership → set submissionStatus: 'pending'

Editor opens /pub/:slug/dashboard
  ├── Views Submissions Review Queue
  ├── Selects Action: Approve | Reject | Request Changes
  └── PATCH /api/publications/:pubSlug/submissions/:postId { action, reviewNote }
       └── Server: verify editor/owner role → update submissionStatus
            ├── 'approved' → story appears on /pub/:slug profile page
            └── 'rejected' / 'changes_requested' → note stored, author notified
```

### Reading List Management

```
User clicks "+ List" on story page
  ├── <AddToListModal> opens
  ├── GET /api/lists/mine
  └── Clicks "Save" on list
       └── POST /api/lists/:id/posts { postId }
            └── Server: verify owner & Post.visibleQuery() gate
                 ├── If post is draft or hidden → error 400
                 └── If valid → push post ref to list.posts
```

---

*Next document: [06 API Reference](06_api_reference.md)*
