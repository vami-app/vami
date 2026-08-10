# RMA Client Deliverables Checklist

Content and ops items **Radhey Metal Alloys LLP** must provide before we publish technical or trust claims publicly.

**How we use this document**

- Engineering ships the site with empty / draft / gated states until each item is verified.
- Empty product fields stay **hidden** on the public catalogue — never invent grades, ranges, or ISO badges.
- Prefer sending deliverables as: short email confirmation + files (PDF/JPG) + “Approved for publish: Yes/No”.

**Where things land in the product**

| Client area | Public page | Admin screen |
|-------------|-------------|--------------|
| Identity / contact | Footer, `/about`, `/contact` | **Admin → Settings** |
| Hero / About / Why RMA | `/`, `/about` | Copy approval → engineering / CMS |
| Products | `/products`, `/products/[category]/[slug]` | **Admin → Products** |
| Capabilities / Quality / Industries | `/capabilities`, `/quality`, `/industries` | **Admin → Page Content** |
| Certificates | `/certificates` | **Admin → Certificates** (`draft` until verified) |
| Downloads | `/resources` | **Admin → Resources** |
| RFQ | `/contact` | **Admin → Leads** |
| Legal | `/privacy`, `/terms`, `/disclaimer` | Copy approval → engineering |

---

## A. Business identity and domain (blocking for launch)

### 1. Company-owned production domain + DNS access

**Why:** Preview URLs (`*.vercel.app`) are fine for staging, not for customer-facing brand or SEO.

**Client steps**

1. Confirm the final hostname (e.g. `www.radheymetalalloysllp.com` or `radheymetalalloysllp.com`).
2. Provide registrar login **or** a DNS contact who can add records within 24–48h.
3. Approve apex vs `www` redirect (pick one canonical host).

**Example**

> Canonical host: `https://www.radheymetalalloysllp.com`  
> Registrar: GoDaddy / Cloudflare — contact: `it@…`  
> Redirect: `radheymetalalloysllp.com` → `www.…`

---

### 2. SSL on that domain

**Why:** Browsers and Google require HTTPS; Vercel issues certificates once DNS points correctly.

**Client steps**

1. After DNS is pointed at Vercel (or your host), confirm the padlock works on the live URL.
2. No separate SSL purchase needed on Vercel — just correct DNS.

**Example**

> “DNS A/CNAME added; `https://www.radheymetalalloysllp.com` loads with valid certificate.”

---

### 3. Final `NEXT_PUBLIC_SITE_URL` canonical URL

**Why:** Drives sitemap, robots, Open Graph, PWA, and absolute links. Wrong value = wrong share previews and SEO.

**Client steps**

1. Write the exact URL including `https://` and preferred host (`www` or apex).
2. Do **not** use the Vercel preview URL for production.

**Example**

```text
NEXT_PUBLIC_SITE_URL=https://www.radheymetalalloysllp.com
```

Staging / Preview may use:

```text
NEXT_PUBLIC_SITE_URL=https://vami-client-git-catalogblogwebsite-vami-org.vercel.app
```

---

### 4. Professional company-domain email + preferred RFQ `from` address

**Why:** Public contact and RFQ mail currently risk looking unprofessional if Gmail remains. Inbound notifications use Resend env vars.

**Client steps**

1. Create mailboxes on the company domain (Google Workspace / Microsoft 365 / host).
2. Provide:
- Public contact email → Admin **Settings → Contact email**
- RFQ inbox → env `LEADS_INBOX_EMAIL`
- Outbound From display → env `LEADS_FROM_EMAIL`
3. Approve deprecation of `radhemetalalloysllp@gmail.com` on `/contact` and `/privacy` once domain mail works.

**Example**

| Use | Value |
|-----|--------|
| Public contact | `info@radheymetalalloysllp.com` |
| RFQ inbox | `quotes@radheymetalalloysllp.com` |
| From header | `Radhey Metal Alloys LLP <noreply@radheymetalalloysllp.com>` |

Engineering then sets `RESEND_API_KEY`, `LEADS_INBOX_EMAIL`, `LEADS_FROM_EMAIL` (domain must be verified in Resend).

---

### 5. Registered office + manufacturing address, phones, WhatsApp, contact persons

**Why:** Shown on `/about`, `/contact`, footer; stored in **Admin → Settings**.

**Client steps**

1. Fill each Settings field (or send a table we enter for you):

| Settings field | What to send |
|----------------|--------------|
| `siteName` | Legal name (default: Radhey Metal Alloys LLP) |
| `tagline` | One-line positioning |
| `address` | Registered office |
| `manufacturingAddress` | Plant address if different |
| `contactEmail` | Public email |
| `contactPhone` | Primary phone |
| `contactPhones[]` | Extra lines |
| `contactPersons[]` | Names / roles for RFQ |
| `whatsappNumber` | E.164 style preferred |

**Example**

```text
siteName: Radhey Metal Alloys LLP
address: [Registered office, Kalol / Gujarat — full line with PIN]
manufacturingAddress: [Plant gate address if different]
contactPhone: +91-XXXXXXXXXX
whatsappNumber: +91-XXXXXXXXXX
contactPersons: Sales — Name; Quality — Name
```

---

### 6. Google Maps place confirmation

**Why:** About / contact map embeds. Settings fields: `mapsQuery`, `mapsEmbedUrl`.

**Client steps**

1. Open Google Maps → find the correct business pin.
2. Share either:
- Place name + address for `mapsQuery`, **or**
- “Embed a map” iframe `src` URL for `mapsEmbedUrl`.
3. Confirm the pin is the manufacturing / office location customers should visit.

**Example**

```text
mapsQuery: Radhey Metal Alloys LLP, Kalol, Gujarat
mapsEmbedUrl: https://www.google.com/maps/embed?pb=...
```

---

### 7. Favicon + OG / social share image (1200×630)

**Why:** Browser tab icon + WhatsApp / LinkedIn / Facebook link previews. Settings: `faviconUrl`, `ogImageUrl`.

**Client steps**

1. Provide **favicon**: square PNG/SVG/ICO (ideally 32×32 and 180×180 apple-touch).
2. Provide **OG image**: exactly **1200×630** JPG/PNG, no critical text in the outer 10% (safe area).
3. Include company name + simple product visual (sheet / casting) — avoid tiny logos only.

**Example filenames**

```text
favicon.png
og-rma-2026.jpg   (1200×630, <300 KB preferred)
```

---

### 8. LinkedIn URL (only if an active company page exists)

**Why:** Settings `linkedIn`. Empty / dead links hurt trust — we omit icons when blank.

**Client steps**

1. Confirm company page is live and public.
2. Send the full URL, or write **“Omit LinkedIn”**.

**Example**

```text
https://www.linkedin.com/company/radhey-metal-alloys-llp/
```

or

```text
Omit LinkedIn until page is ready.
```

---

## B. Brand and positioning copy

### 9. Approve positioning line

**Working line (needs sign-off):** precision non-ferrous manufacturer & custom casting partner.

**Client steps**

1. Approve as-is, or rewrite in one sentence.
2. Confirm metals in scope (e.g. copper, brass, phosphor bronze, aluminium — matching RFQ category options).

**Example approval**

> “Approved: Radhey Metal Alloys LLP is a precision non-ferrous sheet, plate, circle & custom casting partner for industrial buyers.”

---

### 10. Approve hero title, supporting sentence, CTAs

**Where:** Home `/` — brand-first hero + primary CTA to Request Quote (`/contact`).

**Client steps**

1. Approve **headline** (short; does not overpower brand name).
2. Approve **one supporting sentence**.
3. Approve CTA labels (e.g. “Request Quote”, “View Products”).

**Example**

```text
Brand: Radhey Metal Alloys LLP
Headline: Non-ferrous sheet, plate & casting — built to your drawing
Support: Copper, brass, phosphor bronze and aluminium for industrial OEMs.
CTA primary: Request Quote → /contact
CTA secondary: Explore products → /products
```

---

### 11. Approve About factual rewrite

**Where:** `/about` (+ Settings addresses/phones).

**Client steps**

1. Review current About draft for factual errors (location, entity name, capabilities).
2. Strike any claim you cannot prove (ISO, capacity, “serving 500+ clients”, etc.).
3. Return a redlined Word/Google Doc or bullet corrections.

**Example correction**

> Remove “ISO 9001 certified” until certificate PDF is supplied.  
> Keep “Based in Kalol, Gujarat” if address in Settings is confirmed.

---

### 12. Approve Why RMA bullets (only substantiated claims)

**Where:** Home / CMS key `why_rma` in **Admin → Page Content**.

**Client steps**

1. List 3–5 bullets that are true today.
2. Reject fluff (“best in India”, “world-class”) unless evidence exists.

**Example**

```text
- In-house non-ferrous rolling / cutting for sheets, plates & circles
- Custom casting support from drawing to sample
- Material test documentation available on request (MTC / lab report)
```

---

### 13. Any numbers (years, capacity, clients) only if verifiable

**Client steps**

1. For each number on the site, send source (invoice count, year of incorporation, machine nameplate).
2. If unsure → leave blank; we will not invent stats.

**Example**

```text
Years in operation: 12 (incorporation certificate attached)
Monthly capacity: [DO NOT PUBLISH — not verified]
```

---

## C. Product technical data (blocking for catalogue publish)

Per product / published SKU in **Admin → Products**. Public URL pattern: `/products/[category]/[slug]`.

**Rule:** Do not publish grades/ranges until verified. Empty fields stay hidden (`grades`, ranges, temper, etc.).

### 14. Grades

**Field:** `grades[]` (comma-separated in admin form).

**Example:** `Cu-ETP, Cu-DHP` or `AA1050, AA1100`

### 15. Thickness range

**Field:** `thicknessRange`  
**Example:** `0.5 mm – 6 mm`

### 16. Width range

**Field:** `widthRange`  
**Example:** `Up to 1250 mm`

### 17. Length range

**Field:** `lengthRange`  
**Example:** `Cut to length / up to 3000 mm`

### 18. Temper

**Field:** `temper`  
**Example:** `O / H14 / H16` or `Soft / Half-hard`

### 19. Surface finish

**Field:** `surfaceFinish`  
**Example:** `Mill finish` / `Bright` / `As cast`

### 20. Standards

**Field:** `standards[]`  
**Example:** `ASTM B152, IS 191`

### 21. Applications

**Field:** `applications[]`  
**Example:** `Heat exchangers, electrical busbars, decorative hardware`

### 22. Available forms

**Field:** `availableForms[]`  
**Example:** `Sheets, Plates, Circles`  
(Align with RFQ form factors: Sheets, Plates, Circles, Ingots, Custom Castings.)

### 23. Quality docs wording + real photos + preferred slug

| Need | Field / action | Example |
|------|----------------|---------|
| Docs offered | `qualityDocs[]` | `MTC, Dimensional report` — not “NABL accredited” unless certified |
| Photos | `images[]` | Real product photos; no stock of unrelated mills |
| URL slug | `slug` | `copper-etp-sheets` (lowercase, hyphenated) |
| Status | `status` | Keep `draft` until 14–23 signed off; then `published` |

**Per-SKU pack to send**

```text
Name: Copper ETP Sheets
Category: Copper
Slug: copper-etp-sheets
Grades: Cu-ETP
Thickness: 0.5–3 mm
… (other fields)
Photos: 3 JPGs attached
Publish: Yes / No
```

---

## D. Manufacturing capabilities (blocking for Capabilities content)

**Where:** Public `/capabilities` ← **Admin → Page Content → key `capabilities`**  
Fields: `title`, `subtitle`, `body`, `sections[]` (`title`, `description`, `imageUrl`), `status`.

### 24. Confirm real process steps

**Client steps**

1. List actual process steps only (no aspirational future lines).
2. We map each step to a CMS **section**.

**Example sections**

```text
1. Melting & alloying
2. Casting / rolling
3. Cutting & circle blanking
4. Inspection & packing
```

### 25. Machinery notes and publishable tolerances

**Client steps**

1. Name machines you are willing to publish (optional).
2. Give tolerances only if shop can meet them consistently.

**Example**

```text
Thickness tolerance: ±0.05 mm (up to 2 mm thick) — confirm before publish
Do not publish: “±0.01 mm” (not guaranteed)
```

### 26. Factory / process photos (or approve placeholders)

**Client steps**

1. Supply photos for each capability section `imageUrl`, **or**
2. Explicitly approve temporary placeholders until a shoot (item I).

**Example**

> “Use placeholders on `/capabilities` until April factory shoot; do not use competitor photos.”

---

## E. Quality and certificates (blocking for trust)

**Where:** `/quality` (CMS key `quality`) + `/certificates` (Admin → Certificates).  
Certificates: `title`, `description`, `issuedBy`, `fileUrl`, `status` (`draft`|`published`). Only **published** appear publicly.

### 27. Exact test list performed

**Client steps**

1. List tests you actually run or routinely buy from labs.
2. These drive Quality page copy and RFQ checkboxes (`needsTC`, `needsNabl`, `needsUT` on `/contact`).

**Example**

```text
- Chemical composition
- Hardness
- Dimensional check
- Ultrasonic testing — on request only
```

### 28. NABL wording: “laboratory report” vs “accredited”

**Client steps**

1. If you receive **third-party NABL lab reports** → we may say customers can request a **NABL laboratory report**.
2. If you claim **NABL accredited** (your lab) → attach accreditation certificate or we will **not** publish that phrase.

**Example safe line**

> “Material test certificates and third-party laboratory reports available on request.”

### 29. Actual certificate / sample MTC / lab report PDFs

**Client steps**

1. Upload via **Admin → Certificates** (or send PDFs).
2. Fill `title`, `issuedBy`, keep `status: draft` until reviewed.
3. Set `published` only after verification.

**Example**

```text
Title: Sample MTC — Copper ETP Sheet
Issued by: [Lab / internal QC]
File: mtc-sample-copper-etp.pdf
Status: draft → published after QC head signs off
```

### 30. Confirm removal of any unverified cert cards

**Client steps**

1. Review `/certificates` on staging.
2. Reply: “Remove all unpublished / placeholder cards” or list titles to delete.

**Example**

> “Delete any ISO/AS9100 tiles — we do not hold those. Keep only Sample MTC draft until approved.”

---

## F. Industries

**Where:** `/industries` ← **Admin → Page Content → key `industries`**.

### 31. Verified industries served

**Example**

```text
Electrical & power
Heat transfer / HVAC
Hardware & fittings
General engineering
(Omit aerospace until we have proof of supply)
```

### 32. Short honest application blurbs

Per industry section: 1–2 sentences, no fake case studies.

**Example**

```text
Electrical: Busbars and conductive sheet cut to drawing for panel builders.
```

### 33. Optional SEO landing priorities

**Where:** Optional `/applications/[slug]` landings.

**Example**

```text
Priority landings: copper-busbar-sheets, aluminium-circles-cookware-oem
Skip for now: export-africa
```

---

## G. RFQ operations

**Where:** Public form `/contact` → Mongo leads → **Admin → Leads**. Email optional via Resend.

### 34. Inbox email for RFQ notifications

Same as §4 — `LEADS_INBOX_EMAIL`.

**Example:** `quotes@radheymetalalloysllp.com`

### 35. Lead handlers + response SLA copy

**Client steps**

1. Name who owns **Admin → Leads** daily.
2. Approve a public SLA line (if any) for Contact page.

**Example**

```text
Owner: Sales desk (Name, phone)
SLA: We respond to RFQs within 1 business day (Mon–Sat).
```

### 36. Required vs optional RFQ field confirmation

**Current form (must confirm or request changes):**

| Field | Required today? |
|-------|-----------------|
| Company (`company`) | Yes |
| Email (`email`) | Yes |
| Phone (`phone`) | Yes |
| Contact person (`name`) | No |
| Country | No |
| Product / category / grade / form / qty / dimensions / standard / delivery | No |
| Attachments (max 5) | No |
| needsTC / needsNabl / needsUT | No |

**Client steps:** Reply “Keep as-is” or list fields to make mandatory.

### 37. Drawing file types + max size policy

**Client steps**

1. Confirm allowed types (e.g. PDF, DXF, DWG, STEP, JPG, PNG).
2. Confirm max size per file (engineering will enforce in upload API).

**Example**

```text
Allow: PDF, DXF, DWG, PNG, JPG
Max: 10 MB per file, max 5 files
```

### 38. WhatsApp Business number for CTA tracking

**Field:** Settings `whatsappNumber` (+ optional Click-to-WhatsApp CTAs).

**Example:** `+91-98XXXXXXXX` (Business API or wa.me link approved)

---

## H. Downloadable resources

**Where:** `/resources` ← **Admin → Resources**  
Types: `catalogue` | `tds` | `company_profile` | `other`  
Status: `draft` until approved, then `published`.

| # | Deliverable | `type` example | Example title |
|---|-------------|----------------|---------------|
| 39 | Product catalogue PDF | `catalogue` | RMA Non-Ferrous Catalogue 2026 |
| 40 | Casting capabilities PDF | `other` or `catalogue` | Custom Castings Overview |
| 41 | Grades / standards sheet | `other` | Grades & Standards Reference |
| 42 | Quality overview PDF | `other` | Quality & Inspection Overview |
| 43 | Company profile (8–12 pages) | `company_profile` | Radhey Metal Alloys LLP — Company Profile |
| 44 | TDS files | `tds` | TDS — Aluminium Circle 1050 |

**Client steps per file:** PDF + title + type + “Publish: Yes/No”.

---

## I. Photography and video

### 45. Factory shoot assets

Wide + process shots for `/`, `/about`, `/capabilities` sections.

### 46. Product close-ups

Per major SKU for Product `images[]` (sheet edge, circle stack, casting sample).

### 47. Optional 30–45s video

Settings / marketing: `youtubeVideoId` (YouTube ID only, e.g. `dQw4w9WgXcQ`).

### 48. Usage rights

Written confirmation we may use images on web, ads, and PDF profile.

**Example**

> “RMA grants perpetual non-exclusive licence to use attached photos/video on radheymetalalloysllp.com and company PDFs.”

---

## J. Analytics and SEO ops

### 49. GA4 Measurement ID (`G-…`)

**Env:** `NEXT_PUBLIC_GA_ID` — loads only after cookie consent = accepted.

**Example:** `G-XXXXXXXXXX`

### 50. Google Search Console access

Invite engineering/admin email as owner; after launch submit `https://<canonical>/sitemap.xml`.

### 51. Optional Maps Embed API key

**Env:** `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY` — only if you want API-keyed embeds instead of a static `mapsEmbedUrl`.

### 52. Keyword / market priorities

**Example**

```text
Primary: copper sheet manufacturer Gujarat, aluminium circles OEM, custom brass casting
Avoid bidding claims we cannot rank for yet
```

### 53. Country / region landing priorities (if any)

**Example**

```text
Phase 1: India domestic OEMs
Phase 2: Middle East export page — later
```

---

## K. Legal

Footer links already exist: `/privacy`, `/terms`, `/disclaimer`.

### 54. Privacy Policy approval

**Client steps**

1. Review `/privacy` (contact email/phones must match Settings).
2. Confirm data uses: RFQ storage, email notifications, analytics cookies.
3. Sign off or send counsel-redlined text.

### 55. Terms of use copy

**Status:** Placeholder until client/ counsel text is provided.

**Example ask:** Send final Terms PDF/DOCX for `/terms`.

### 56. Disclaimer copy

**Status:** Placeholder — especially important for metal grades, tolerances, and certificate claims.

**Example line to approve**

> “Specifications are indicative. Supply is subject to order confirmation and applicable test certificates.”

---

## What engineering owns (client need not provide)

- Architecture, Mongo schemas, admin CRUD, RFQ API, uploads, Cloudinary, JWT/auth  
- GA wiring (once ID is provided), sitemap, CSP, Vercel/deploy config  
- Empty / draft UI states and publish gates  

**We will not invent** filler grades, capacity numbers, or ISO / AS9100 badges.

---

## Suggested client reply format

```text
Item #: 29
Status: Provided / Approved / Deferred
Files: mtc-sample.pdf
Notes: Publish only after QC sign-off Friday
```

Or tick through sections A→K in email with attachments in one Drive/ZIP folder named `RMA-website-deliverables-YYYY-MM`.
