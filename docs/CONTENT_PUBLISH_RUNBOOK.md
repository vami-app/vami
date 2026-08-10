# Content publish runbook

## Rule

Never publish technical specs, certificates, accreditation claims, or capacity numbers until RMA verifies them against `CLIENT_DELIVERABLES.md`.

## Admin publish checklist

1. **Products** — Fill structured technical fields only with verified data. Leave blank otherwise (public UI omits empty fields). Set status `published` only when marketing + any shown specs are approved.
2. **Certificates** — Upload real PDF, set `verifiedAt`, then `published`. Unverified documents stay `draft` and never appear publicly.
3. **Resources** — Same gate: draft until file + title approved.
4. **Page content** (Capabilities / Quality / Industries / Why RMA) — Publish section only after copy sign-off.
5. **Site settings** — Update company email/domain before replacing Gmail on the public site.

## Ops before production launch

1. Point DNS to host; set `NEXT_PUBLIC_SITE_URL`
2. Configure Resend domain + set `RESEND_API_KEY`, `LEADS_FROM_EMAIL`, `LEADS_INBOX_EMAIL`
3. Create GA4 property; set `NEXT_PUBLIC_GA_ID`
4. Verify Search Console + submit sitemap (`/sitemap.xml`)
5. Smoke-test RFQ: submit form → lead in `/admin/leads` → inbox email

## Wording

Distinguish “NABL laboratory report” (third-party report) from “NABL accredited” (requires certificate). Prefer the former unless accreditation is proven.
