# 🖋️ Inkwell — Project Blueprint

> **Version:** 2.3.0 · **Stack:** Next.js 16 + Express + MongoDB · **Package Manager:** pnpm (v11)
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
   - Domain-modularized Express server architecture (`server/src/modules/`), 16 extracted domain models, Repository Pattern (`IPostRepository`, `MongoPostRepository`, `PostService`), middleware chain, controllers, utility modules, validator rules, and test scripts.

4. **[04 Client Architecture (Frontend)](docs/blueprint/04_client_frontend_architecture.md)**
   - Next.js 16 App Router layout tree, complete route pages table (including `/membership`), component library breakdown, feature-folder architecture (`client/src/features/`), state management, client wrappers, custom hooks, 6-token breakpoint scale (`xs` to `2xl`), layout pattern adaptation, 9-factor responsive design system, and adaptive network loading.

5. **[05 Data Flows & Subdomain Routing](docs/blueprint/05_data_flows_and_subdomains.md)**
   - Sequence diagrams and flowcharts for authentication, subdomain rewrites, home feed reading, story publishing, debounced multi-clapping, publication submission reviews, reading lists, and Razorpay test subscriptions.

6. **[06 API Reference](docs/blueprint/06_api_reference.md)**
   - Standardized API envelope specifications and exhaustive endpoint tables for Auth, OAuth, Users, Notifications, Posts & Comments & Recommendations, Tag Autocomplete (`GET /api/posts/tags/autocomplete`), Publications & Submissions, Reading Lists, Membership & Payout Ledger, Highlights, Post Revisions, Reports, Admin Tools, Feeds, and Uploads.

7. **[07 Security Model & Processing Pipelines](docs/blueprint/07_security_and_pipelines.md)**
   - Threat & mitigation matrix (XSS, JWT in httpOnly cookies, rate limiting, email gates, 18-step account deletion cascade) and step-by-step file upload, sovereign account export ZIP, and Razorpay test webhook pipelines.

8. **[08 Environment Variables & Developer Workflow](docs/blueprint/08_env_vars_and_workflow.md)**
   - Environment variables reference (`server/.env`, `client/.env.local`), root and package scripts, server utility scripts, local development ports, and demo user credentials.

9. **[09 Feature Status & Roadmap Tracking](docs/blueprint/09_feature_status_and_roadmap.md)**
   - Feature status matrix tracking MVP through 100% Completed Scaling & Improvement Blueprint (Phases A through K).

---

*Blueprint updated: 2026-07-27 — Synchronized with 100% Full Scaling Blueprint Execution. v2.3.0.*



