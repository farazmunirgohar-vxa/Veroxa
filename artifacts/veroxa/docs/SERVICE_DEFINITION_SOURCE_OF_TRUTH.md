# Veroxa Service Definition — Source of Truth

Last updated: 2026-05-27

This document defines what each Veroxa service actually covers, the order in
which services are built, and the operating priorities while Veroxa is still
serving its first 1–3 restaurant clients. Pricing values live in
[`PRICING_SOURCE_OF_TRUTH.md`](./PRICING_SOURCE_OF_TRUTH.md) and the runtime
file `src/data/pricing/veroxaPricing.ts`.

---

## Google Optimization — scope

**What it is:** Google-focused visibility for restaurants that need to be
found better on Google before committing to full content production.

**Included**

- Google Search Engine SEO
- Google Maps SEO
- Google Business Profile optimization
- Google reviews support

**Not included**

- Social media content (Facebook, Instagram, TikTok)
- Social posting
- Ads management
- Full Veroxa content workflow

---

## Complete Online Presence — scope

**What it is:** The core Veroxa system for restaurants that want a managed,
team-operated online presence across Google and the major social platforms.

**Included**

- Facebook management
- Instagram management
- TikTok management
- Google Optimization
- Content planning
- Caption / draft creation
- Posting support
- Restaurant media guidance
- Weekly updates
- Monthly reports
- Team-managed execution
- Veroxa Client Portal access
- Veroxa Team workflow execution

**Setup support**

If the restaurant does not already have a needed website, Facebook page,
Instagram account, TikTok account, or Google Business Profile, Veroxa will
help create/setup the required basic account/page/presence during onboarding.

This is **not** a custom website development package. Use wording like
"basic website/presence setup if needed", "basic account/page setup if
needed", or "setup support for required online presence".

---

## Ads Management — scope

**What it is:** Paid advertising management on top of Complete Online
Presence, or as a standalone service.

**Two options**

- **Ads Add-on** — paired with Complete Online Presence.
- **Ads Management Only** — standalone, without Complete Online Presence.

**Included (either option)**

- Ad campaign setup
- Audience and offer targeting
- Creative direction for ad-specific assets
- Campaign monitoring and optimization
- Monthly ad performance reporting

**Ad spend rule**

Ad spend is always separate and paid directly by the restaurant to the ad
platform. Veroxa manages the advertising system. The restaurant controls and
pays the actual ad budget.

---

## Founding Client Offer

- 50% off for the first year.
- Available only to early/founding restaurant partners.
- After the first year, standard pricing applies.
- Ad spend is always separate (founding offer does not subsidize ad spend).

---

## First-client operating flow

For the first 1–3 clients, Veroxa runs a deliberately small operating loop.
The Client Portal and Team Portal are the only portals operated end-to-end.
Owner and Operator portals are deferred until after the first 1–3 clients.

1. **Client uploads media** (Client Portal — Media page).
2. **Team reviews media** (Team Portal — Media Review): accept, request a
   better photo, or mark for reshoot.
3. **Team prepares content** (Team Portal — Content Review): draft → ready
   for review → scheduled.
4. **Client sees schedule, weekly updates, and monthly reports** (Client
   Portal — Calendar, Updates, Reports).
5. **Nothing posts without Veroxa team workflow.** No automatic posting, no
   AI publishing, no third-party API writes during this phase.

All workflow actions in this phase are local/demo only — no real database
writes, no uploads, no AI calls, no publishing API calls.

---

## Client Portal + Team Portal priority

For the current phase, build effort focuses on:

- **Client Portal:** dashboard, media intake, calendar, reports, updates,
  requests/action-needed.
- **Team Portal:** dashboard, work queue, media review, content review,
  alert center.
- **Shared workflow model:** see
  [`M009_M011_FIRST_CLIENT_OPERATING_FLOW.md`](./M009_M011_FIRST_CLIENT_OPERATING_FLOW.md).

---

## Owner / Operator portals — deferred

Owner and Operator portals are **deferred** until Veroxa has 1–3 active
clients on the Client + Team flow. Visible navigation, copy, and feature
expansion for those portals is intentionally minimal in this phase.

---

## Restaurant Upload Key — app-style intake (M012–M014)

Veroxa includes an **app-style upload flow** for restaurants, not just
a portal. The goal is to make daily content collection as low-friction
as possible for the first 1–3 real clients.

- Each restaurant is issued one **Restaurant Upload Key**.
- Any approved restaurant employee with that key can use `/upload` to
  submit photos / videos with a category, optional note, and priority
  hint. **No individual email/password is required** for daily content
  contributors during the first-client phase.
- The Team Portal receives these submissions in a dedicated **Upload
  Inbox** (`/demo/team/upload-inbox`), triaged before moving to the
  existing Media Review surface.
- Upload key access is **not** Team / Operator / Owner access. A key
  only unlocks the upload flow for that one restaurant — no access to
  pricing, internal notes, financials, analytics, or any other
  restaurant.
- Everything in this phase is local/demo only — no Supabase writes, no
  Storage uploads, no notifications, no AI scoring. See
  `M012_M014_RESTAURANT_UPLOAD_KEY_AND_TEAM_INBOX.md` for the future
  real-implementation plan (hashed keys, signed Storage URLs from an
  Edge Function, rotation/revocation, audit logs, rate limits).

---

## Things this phase explicitly does NOT include

- Real database writes (insert / update / delete / upsert).
- Real file uploads to Supabase Storage or any other storage.
- Real AI calls (OpenAI / Anthropic / Gemini / others).
- Real publishing to Facebook / Instagram / TikTok / Google APIs.
- Real payment integration (Stripe, PayPal, checkout, billing).
- Service-role Supabase keys in frontend code.
- Migrations under `supabase/migrations`.
- Custom website development as a deliverable.

## M015–M019 — Direction, Adaptive Intelligence, Local Upload Store

- **Client Direction Center** (`/demo/client/direction`) — clients
  guide focus / channel / urgency / note. No publishing power.
- **Team Direction Queue** (`/demo/team/direction-queue`,
  team-guarded) — interpretation and routing into work queue, Google
  actions, or ads planning. Local-only status updates.
- **Rule-Based Adaptive Intelligence**
  (`/demo/team/adaptive-intelligence`, team-guarded) — deterministic
  rules over direction + uploads + workflow + memory fixture.
  **No external AI provider.**
- **Weekly Strategy Snapshot** — top recommendations rendered on
  the Client Dashboard and the team intelligence page.
- **Shared Local Upload Store** —
  `src/lib/uploadKeys/localUploadStore.ts`, sessionStorage-backed,
  metadata only, no file blobs. Used by `/upload`, the Team Upload
  Inbox, and the client media page.
- Owner / Operator portals are **not** expanded.
- Pricing, AUTH_MODE, DATA_MODE, InternalDemoGuard, migration policy
  all unchanged.

## M020–M022 — Direction store cohesion + write boundary

- **Client Direction Center is directional input, not direct control.**
  Clients can flag focus, channel, urgency, and notes. They cannot
  publish, schedule, or launch ads.
- **Restaurant Upload Key is upload-only access.** It does not grant
  Client, Team, Owner, or Operator portal access, and cannot read
  other restaurants' data.
- **Team approves and executes.** All routing, content drafting,
  Google posts, and ads planning is mediated by the Team Portal.
- **Adaptive Intelligence is rule-based preview** (deterministic
  rules over fixture + session signals) until real AI is
  intentionally added in a later, separately scoped build.
- **Writes remain off.** See `src/lib/data/writeReadiness.ts`
  (`WRITES_ENABLED=false`) and
  `docs/M023_SUPABASE_WRITES_PLAN_UPLOADS_DIRECTION_REVIEW.md` for
  the plan to enable controlled dev writes behind an explicit flag.
