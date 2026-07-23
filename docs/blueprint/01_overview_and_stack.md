# Inkwell Blueprint — 01: Overview & Technology Stack

> Part of the [Inkwell Project Blueprint](README.md) suite.
> **Version:** 1.8.0 · **Stack:** Next.js 16 + Express + MongoDB · **Package Manager:** pnpm (v11)

---

## 1. Project Overview

**Inkwell** is a full-stack, Medium-inspired content publishing platform. Writers can create richly formatted stories using a WYSIWYG Tiptap editor. Every story is indexable by search engines from day one with canonical links and schema-rich metadata. Users retain true ownership of their content with full profile, JSON, and Markdown-rendered file exports. Real-time notifications are delivered via Socket.IO. OAuth login is supported through Google and GitHub via Passport.js.

| Attribute       | Value                                          |
|-----------------|------------------------------------------------|
| Project name    | `inkwell`                                      |
| Accent color    | Deep Indigo (`#4f46e5` — distinct from Medium) |
| Auth strategy   | JWT in httpOnly cookies (access + refresh) + Google/GitHub OAuth |
| Real-time       | Socket.IO (authenticated personal notification rooms) |
| Storage         | Local disk (MVP); upgrade path: Cloudinary     |
| Database        | MongoDB (local or Atlas free M0)               |
| Deployment      | Run locally; cloud-ready via env swap          |

---

## 2. Technology Stack

### Backend

| Layer            | Technology                | Version   | Purpose                                   |
|------------------|---------------------------|-----------|-------------------------------------------|
| Runtime          | Node.js                   | v20+      | JavaScript runtime                        |
| Framework        | Express                   | 4.21.x    | HTTP server & routing                     |
| Database         | MongoDB + Mongoose        | 8.9.x     | Document DB + ODM                         |
| Auth             | jsonwebtoken              | 9.0.x     | JWT signing & verification                |
| OAuth            | passport + passport-google-oauth20 + passport-github2 | 0.7.x / 2.0.x / 0.1.x | Google & GitHub OAuth strategies |
| Real-time        | socket.io                 | 4.8.x     | WebSocket notification server             |
| Password hashing | bcryptjs                  | 2.4.x     | Bcrypt (cost 12)                          |
| Cookies          | cookie-parser             | 1.4.x     | Parse incoming cookies                    |
| CORS             | cors                      | 2.8.x     | Cross-origin allow with credentials       |
| Validation       | express-validator         | 7.2.x     | Request body validation rules             |
| Rate limiting    | express-rate-limit        | 7.4.x     | IP-based throttle                         |
| File uploads     | multer                    | 1.4.x     | Multipart form-data handler               |
| HTML sanitize    | sanitize-html             | 2.14.x    | Strip XSS from Tiptap output              |
| RSS Syndication  | feed                      | 6.0.x     | Construct standard RSS 2.0 feeds          |
| Markdown Convert | turndown                  | 7.2.x     | HTML to Markdown converter                |
| ZIP compression  | archiver                  | 8.0.x     | ZIP streaming library                     |
| Environment      | dotenv                    | 16.4.x    | Load .env file                            |
| Dev server       | nodemon                   | 3.1.x     | Auto-restart on file change               |

### Frontend

| Layer         | Technology                 | Version   | Purpose                                   |
|---------------|----------------------------|-----------|-------------------------------------------|
| Framework     | Next.js (App Router)       | 16.2.x    | SSR/CSR routing, image optimization       |
| UI Library    | React                      | 19.0.x    | Component model                           |
| Styling       | Tailwind CSS               | 3.4.x     | Utility-first CSS                         |
| Typography    | @tailwindcss/typography    | 0.5.x     | Prose styles for article content          |
| Rich editor   | Tiptap + extensions        | 2.10.x    | ProseMirror-based WYSIWYG                 |
| Real-time     | socket.io-client           | 4.8.x     | WebSocket notification client             |
| Fonts         | Google Fonts via next/font | —         | Inter (sans), Source Serif 4 (serif)      |

### Tooling

| Tool          | Purpose                                              |
|---------------|------------------------------------------------------|
| pnpm          | Monorepo package manager with workspaces             |
| concurrently  | Run client + server in parallel with one command     |
| Git           | Version control                                      |

---

*Next document: [02 Repository Layout & Architecture Diagram](02_repository_layout_and_architecture.md)*
