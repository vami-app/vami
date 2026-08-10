# Radhey Metal Alloys LLP

Next.js 16 App Router site + admin CMS for catalogue, blog, RFQ leads, certificates, and resources.

## Quick start

```bash
npm install
cp .env.example .env.local
# Start MongoDB, then:
npm run dev
```

## Key docs

- [`CLIENT_DELIVERABLES.md`](CLIENT_DELIVERABLES.md) — what RMA must provide before publishing claims
- [`docs/CONTENT_PUBLISH_RUNBOOK.md`](docs/CONTENT_PUBLISH_RUNBOOK.md) — publish gates & ops checklist

## Architecture

- `app/(public)/` — public pages (single RFQ at `/contact`)
- `app/admin/` — existing admin panel (products, blog, leads, certificates, resources, content)
- `services/` — domain services; `modules/` — thin re-exports + Zod schemas
- `models/` — Mongoose models

## RFQ / email

Set optional `RESEND_API_KEY`, `LEADS_INBOX_EMAIL`, `LEADS_FROM_EMAIL`. Leads always persist to Mongo even if email is not configured.

## Analytics

Set `NEXT_PUBLIC_GA_ID`. GA loads only after cookie consent = `accepted`.
