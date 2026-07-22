# 🖋️ Inkwell — Project Blueprint

> **Version:** 1.6.0 · **Stack:** Next.js 15 + Express + MongoDB · **Package Manager:** pnpm (v11)
> A Medium-inspired publishing platform — read, write, and share stories. Optimized for SEO, subdomains, and data export portability.

---

> [!NOTE]
> The Project Blueprint has been modularized into focused documents located in [`docs/blueprint/`](docs/blueprint/README.md). Nothing has been omitted — every schema, endpoint, data flow, security control, and workflow rule is fully preserved across the modular suite below.

---

## Blueprint Modules Table of Contents

1. **[01 Overview & Technology Stack](docs/blueprint/01_overview_and_stack.md)**
   - Project mission, core values, branding tokens, and complete tech stack breakdown (Backend, Frontend, Tooling).

2. **[02 Repository Layout & Architecture Diagram](docs/blueprint/02_repository_layout_and_architecture.md)**
   - Monorepo directory tree structure and end-to-end client-server-database ASCII architecture diagram.

3. **[03 Server Architecture (Backend)](docs/blueprint/03_server_backend_architecture.md)**
   - Express server entry points, env configuration, database schemas (`User`, `Post`, `Notification`, `Publication`, `PublicationMember`, `ReadingList`, `ReadEvent`, `MembershipPayment`, `PayoutLedgerEntry`, `WebhookEvent`, `Comment`, `Follow`, `Report`, `AuditLog`, `PostRevision`), middleware chain, controllers, utility modules, validator rules, and test scripts.

4. **[04 Client Architecture (Frontend)](docs/blueprint/04_client_frontend_architecture.md)**
   - Next.js 15 App Router layout tree, complete route pages table, component library breakdown, `AuthContext` & `SocketContext` state management, `lib/api.js` client wrapper, custom hooks, and Tailwind design system tokens.

5. **[05 Data Flows & Subdomain Routing](docs/blueprint/05_data_flows_and_subdomains.md)**
   - Sequence diagrams and flowcharts for authentication, subdomain rewrites, home feed reading, story publishing, debounced multi-clapping, publication submission reviews, reading lists, and Razorpay test subscriptions.

6. **[06 API Reference](docs/blueprint/06_api_reference.md)**
   - Standardized API envelope specifications and exhaustive endpoint tables for Auth, OAuth, Users, Notifications, Posts & Comments & Recommendations, Publications & Submissions, Reading Lists, Membership & Payout Ledger, Post Revisions, Reports, Admin Tools, Feeds, and Uploads.

7. **[07 Security Model & Processing Pipelines](docs/blueprint/07_security_and_pipelines.md)**
   - Threat & mitigation matrix (XSS, JWT in httpOnly cookies, rate limiting, email gates, 15-step account deletion cascade) and step-by-step file upload, sovereign account export ZIP, and Razorpay test webhook pipelines.

8. **[08 Environment Variables & Developer Workflow](docs/blueprint/08_env_vars_and_workflow.md)**
   - Environment variables reference (`server/.env`, `client/.env.local`), root and package scripts, server utility scripts, local development ports, and demo user credentials.

9. **[09 Feature Status & Roadmap Tracking](docs/blueprint/09_feature_status_and_roadmap.md)**
   - Feature status matrix tracking MVP, Phase A, Phase B, Phase C, Phase D, and Phase E completed features alongside planned Phases F through G.

---

*Blueprint updated: 2026-07-22 — Synchronized with Phase E completion & modular documentation architecture. v1.6.0.*
