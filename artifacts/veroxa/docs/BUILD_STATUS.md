# Veroxa — Build Status

> ⚠️ **READ THIS FIRST — current truth overrides everything below.**
> The two sections immediately following ("Current state" and
> "Current next-step ladder") are the **authoritative** statement
> of where the project is right now. Every other section in this
> file — including any "next phase" or "real auth flip" language —
> is a **dated historical changelog entry** that was true at the
> time of writing and may be superseded by the current-state
> summary. Do not follow older sections as current instructions.
> In particular, **do not act on any historical "AUTH_MODE flip"
> notes** until the human dev-test gate (M001–M006) is cleared.

---

## Current state (stabilization pass: 2026-05-27)

**Status:** demo / placeholder phase. Portal polish and hard stabilization complete.
Pricing corrected to locked values, demo fixture data sanitized (no real restaurant
names, addresses, emails, or domains remain), route/nav audit documented.
Portal remains fully disconnected — no backend, no auth, no real publishing.

Next milestone: Portal Connect Planning (requires M001–M006 dev-test gate).

- **AUTH_MODE is `"placeholder"`.** Verified in
  `src/lib/auth/authMode.ts`. Real Supabase Auth code exists in the
  codebase (`getSession`, `onAuthStateChange`, `user_profiles`
  lookup, gated `signInWithPassword`) but is **inactive** while
  `AUTH_MODE !== "real"`. Do not flip it.
- **SQL is draft / dev-test only.** All SQL lives under
  `artifacts/veroxa/docs/sql_drafts/`. **No file** under
  `supabase/migrations/`. Nothing has been promoted to a real
  migration set.
- **M001–M006 applied and seeded on the dev Supabase project.**
  Human operator has executed every dev-test package against the
  dev project, applied the M003 notifications status guard + team-
  scope correction, the M004 post-slot reset guard + posts/post_slots
  staff-scope correction, the M005 reports staff-scope correction
  (baked into apply), and manually seeded fixture data across all
  17 tables. Full database count check passed. See
  [`docs/DEV_SUPABASE_EXECUTION_CHECKPOINT.md`](./DEV_SUPABASE_EXECUTION_CHECKPOINT.md)
  for the per-migration status table, seed counts, corrections, and
  guards. **This is dev-only.** No SQL has been promoted to
  `supabase/migrations/` and the Replit app is still not connected
  to Supabase.
- **The portal remains fixture / demo-first.** The Client Portal
  has read-only Supabase queries scaffolded behind
  `useClientPortalData`, but the demo path uses fixtures and
  falls back to fixtures automatically when env vars are missing
  or a query fails. The Team, Operator, and Owner portals use
  fixtures exclusively. The portal is **not** connected to a real
  production database.
- **No real backend behavior is active.** No real AI provider is
  wired (`ai_agents.is_enabled=true` is inert), no publishing
  integration is wired, no real uploads or Supabase Storage buckets
  are wired, no Google Business Profile integration is wired, no
  real database writes happen anywhere in the app. Anything that
  looks like activation in older sections is documentation /
  scaffolding, not runtime behavior.
- **Demo gate `veroxa-preview` remains in place.** Locked pricing,
  the four-role model (Client / Team / Operator / Owner), the
  four-shell portal model, and the nav routing all remain unchanged.

### Current safety / status references

Read these before proposing any auth, SQL, or backend work:

- [`PORTAL_QUERY_SAFETY_PLAN.md`](./PORTAL_QUERY_SAFETY_PLAN.md) —
  what the portal is allowed to read, scoped grep sweeps, latest
  audit pass.
- [`PORTAL_QUERY_SAFETY_CHECKLIST.md`](./PORTAL_QUERY_SAFETY_CHECKLIST.md)
  — exact grep commands that must pass before any portal query
  change.
- [`CLIENT_HEALTH_ENGINE_CONTRACT.md`](./CLIENT_HEALTH_ENGINE_CONTRACT.md)
  — authoritative outputs of `ClientHealthEngine` and the latest
  drift audit per page.
- [`CLIENT_HEALTH_SURFACE_MAP.md`](./CLIENT_HEALTH_SURFACE_MAP.md)
  — per-page inventory of every surface that renders health-derived
  content.
- [`sql_drafts/dev_test/README.md`](./sql_drafts/dev_test/README.md)
  — master M001–M006 dev-test execution order with all correction
  subfiles inserted in the correct position.

---

## Current next-step ladder

Follow this order. Do not skip steps.

1. **Stay in demo / placeholder mode.** `AUTH_MODE` remains
   `"placeholder"`. No SQL promotion, no real Supabase connection,
   no real provider wiring.
2. **M001–M006 dev execution: DONE.** The dev Supabase project has
   M001–M006 applied, all corrections + guards in place, and
   fixture data seeded. See
   [`docs/DEV_SUPABASE_EXECUTION_CHECKPOINT.md`](./DEV_SUPABASE_EXECUTION_CHECKPOINT.md).
3. **Next phase: Portal Connect Planning** — design a read-only
   repository layer that hides Supabase behind typed query
   functions and routes all client portal reads through
   `client_portal_*` views (which must be added in the portal-
   connect pass; they do not yet exist in the dev DB). **This is
   planning, not implementation.** The placeholder guard in
   `useClientPortalData` stays active throughout.
4. **Do NOT** start production-auth work, do NOT flip `AUTH_MODE`,
   do NOT create files under `supabase/migrations/`, and do NOT
   connect the portal to Supabase until a real-auth readiness
   checklist is written and signed off.
5. **Separately and in parallel**, safe demo-only work may
   continue: fixture coherence, health-engine consolidation,
   docs/status cleanup, route registry audits, and demo-only UI
   polish that does not alter routing / nav / the four-shell
   model. See "Allowed next prompt themes" below.

---

## Allowed next prompt themes

These themes are safe to work on **before** the human dev-test
gate clears. They do not touch runtime backend behavior, auth,
SQL promotion, routing, or pricing.

- **Docs / status cleanup** — index updates, drift audits,
  changelog stabilization, contract documents.
- **Fixture coherence** — aligning demo fixtures so the same
  client / period reads identically across all four shells.
- **Health-engine consolidation** — migrating non-engine
  consumers onto `ClientHealthEngine` while preserving the
  canonical vocabulary (`Healthy | Caution | Urgent | Broken`).
- **Demo-only UI polish** — typography, spacing, micro-interactions,
  empty-state copy. **Must not alter** routing, navigation, the
  four-shell model, the demo gate, or pricing.
- **Route registry audits** — read-only inventory of registered
  routes and their portal mapping. No route additions, renames,
  or removals.

## Forbidden next prompt themes

Do **not** propose, plan, or implement any of these in the
current phase. Stop and ask before any deviation.

- **`AUTH_MODE` flip** to `"real"`.
- **Supabase connection** — wiring the portal (or anything else)
  to a real Supabase project, real env vars, or real RLS reads.
- **SQL promotion** — moving any file from
  `docs/sql_drafts/` to `supabase/migrations/`.
- **Real writes / uploads / storage** — Supabase Storage buckets,
  signed-URL uploads, real INSERT / UPDATE / DELETE from the app.
- **Real AI provider** — OpenAI, Anthropic, Gemini, OpenRouter,
  or any other provider; including via Replit AI Integrations.
- **Publishing or Google integrations** — Instagram, Facebook,
  TikTok, Google Business Profile, YouTube, scheduling APIs.
- **Pricing changes** — locked values (GPS 49700, COP 12mo 99700,
  COP 6mo 109700, COP 3mo 119700, COP no-contract 149700) are
  fixed.
- **Role model changes** — roles are exactly Client / Team /
  Operator / Owner.
- **Nav / routing changes** — no new routes, no rename, no
  removal, no shell restructuring.

---

> **How to read this file (legacy header).** The current state of
> real auth is defined by the **Current state** section at the top
> of this file (2026-05-27). The earlier-dated header below ("Date:
> May 24, 2026 — Latest milestone: Real Auth Manual Prep Pack") is
> retained as a historical changelog entry. Earlier sections that
> say "Still no real auth" were true at the time of that pass and
> are superseded by the current-state summary. Do not edit those
> lines retroactively, and do not act on their "next phase"
> language.

---

# Historical changelog — entries below are dated history

**Date:** May 24, 2026
**Latest milestone:** Real Auth Manual Prep Pack (docs only)

> **How to read this file.** The current state of real auth is
> defined by the **most recent** sections at the bottom: "Real Auth V1
> Session Layer" and "Real Auth Manual Prep Pack". The canonical
> phrasing is: **real auth is wired but inactive while
> `AUTH_MODE === "placeholder"`**.
>
> Earlier sections below are kept as a **dated changelog**. Where
> they say "Still no real auth", that statement was true at the time
> of that pass and is now historical — superseded by the V1 session
> layer. Do not edit those lines retroactively.

---

## Client Portal

- Status: **routed pages live**
- Routes:
  - `/demo/client` → Dashboard (alias)
  - `/demo/client/dashboard`
  - `/demo/client/calendar`
  - `/demo/client/google`
  - `/demo/client/reports`
  - `/demo/client/updates`
- Data: **read-only Supabase via `useClientPortalData`** (8 parallel queries: client, platforms, media assets, posts, post slots, weekly reports, monthly reports, draft variants)
- Fallback: **static demo data** kicks in automatically if Supabase env vars are missing or any query fails
- No auth, no uploads, no writes, no AI, no publishing, no automation

## Team Portal

- Status: **routed pages live**
- Routes:
  - `/demo/team` → My Tasks (alias)
  - `/demo/team/tasks`
  - `/demo/team/media-review`
  - `/demo/team/ai-review`
  - `/demo/team/drafts`
  - `/demo/team/scheduling`
- Data: **static demo data only** (from `lib/demo-data`)
- No Supabase wiring, no auth, no uploads, no writes, no AI, no publishing

## Operator Portal

- Status: **routed pages live**
- Routes:
  - `/demo/operator` → Overview (alias)
  - `/demo/operator/overview`
  - `/demo/operator/alerts`
  - `/demo/operator/client-health`
  - `/demo/operator/failed-posts`
  - `/demo/operator/report-approvals`
- Data: **static demo data only**
- No Supabase wiring, no auth, no writes, no AI

## Owner Portal

- Status: **routed pages live**
- Routes:
  - `/demo/owner` → Dashboard (alias)
  - `/demo/owner/dashboard`
  - `/demo/owner/revenue`
  - `/demo/owner/client-health`
  - `/demo/owner/alerts`
  - `/demo/owner/settings` (placeholder "coming soon" card)
- Data: **static demo data only**
- No Supabase wiring, no auth, no writes, no AI

---

## Supabase

- **Dev database:** created manually in the Supabase dev project
- **Migrations:** applied manually from `docs/database/migrations-draft/`
- **Seeds:** applied manually from `docs/database/seeds-draft/` (including 007 draft variant wiring with trigger bypass)
- **RLS:** dev read policies applied from `docs/database/rls-draft/001_dev_read_policies.sql`
- **Client Portal read layer:** working — all 8 queries succeed when env vars are present
- **Secrets:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` expected as Replit Secrets; missing → graceful fallback to static demo
- **Service role key:** never used; anon key only

---

## Not built yet

> **Note (updated):** the lines below describe state at the time of
> the original "Routed Portal Demo" milestone and have **not been
> rewritten retroactively** (see the "How to read this file" banner
> at the top). For canonical current status, see "Real Auth V1
> Session Layer" and "Real Auth Manual Prep Pack" below. In short:
> real authentication code is **wired but inactive** while
> `AUTH_MODE === "placeholder"`.

- Real authentication (login, sessions, user accounts) — *now wired but inactive; activation gated on the manual prep pack + `AUTH_MODE` flip*
- Real user/account model
- Media uploads
- Team actions (claim task, mark complete, approve draft, etc.)
- Approval workflows (caption review, media review, monthly report sign-off)
- Publishing integrations (Instagram, Facebook, TikTok, etc.)
- AI integrations (caption generation, media review, brand voice — all current AI sections are simulated previews)
- Google Business Profile integration
- Production RLS policies
- Write paths of any kind (insert / update / delete / upsert)
- Webhooks, queues, schedulers
- Email / notification delivery
- Multi-tenant routing

---

## Demo access shell

- **Login UI shell** added at `/login` — polished role-card layout (Access Veroxa).
- **Demo role routing only.** No accounts, no passwords, no sessions, no Supabase Auth.
- Role cards route to the corresponding demo portal:
  - Client Portal → `/demo/client/dashboard`
  - Team Portal → `/demo/team/tasks`
  - Operator Portal → `/demo/operator/overview`
  - Owner Portal → `/demo/owner/dashboard`
- A "Portal Login" link was added to the Demo Hub, and a subtle "Login" link to the landing page nav.
- Architecture documented in [`AUTH_ARCHITECTURE_PLAN.md`](./AUTH_ARCHITECTURE_PLAN.md).

## Demo Veroxa vs Real Veroxa

We are building **Demo Veroxa** and **Real Veroxa** side by side:

- `/demo/*` remains the **preview, sales, and testing layer** — public forever, no auth.
- Future real authenticated routes will live under `/client/*`, `/team/*`, `/operator/*`, `/owner/*`.
- No real auth, real sessions, real writes, or production RLS exist today.

## Auth data model draft

- **Auth data model draft created** — `docs/database/auth-draft/001_auth_user_profiles.sql` defines the `veroxa_user_role` enum and `user_profiles` table (role/`client_id` CHECK, indexes, `updated_at` trigger, RLS enabled).
- **Production RLS draft created** — `docs/database/auth-draft/002_production_rls_policy_draft.sql` sketches SELECT-only policy direction for `clients`, `client_platforms`, `onboarding_items`, `media_assets`, `posts`, `post_slots`, `weekly_reports`, `monthly_reports`, `content_concepts`, `draft_sets`, `draft_variants`, and `notifications`. Team policies are now sketched as **client-scoped via `team_client_assignments`** (see below).
- **Team assignment schema draft created** — `docs/database/auth-draft/003_team_assignment_schema_draft.sql` defines `team_client_assignments` (team_user_id, client_id, assignment_role with CHECK, is_active, indexes, unique pair, `updated_at` trigger, draft `current_team_client_ids()` SECURITY DEFINER helper, RLS enabled). **V1 team assignment decision:** client-scoped (a team user is assigned to one or more clients and reads that client's work rows). Resource-level assignment is V2.
- **Still not applied.** Nothing in `auth-draft/` has been run against any Supabase project.
- **Still no real auth.** No Supabase Auth wired in the app, no real user accounts, no sessions, no passwords.
- **Still no Team/Operator/Owner Supabase wiring.** Those portals remain static demo-only.
- Temporary dev anon read policies in `docs/database/rls-draft/001_dev_read_policies.sql` remain the only RLS in effect on dev.
- See `AUTH_ARCHITECTURE_PLAN.md` §8 for the data model summary.

## Login form + guard shell

- **Future sign-in UI shell added** on `/login` — Email + Password fields and a "Sign In — Coming Soon" button below the existing demo role cards. Submit calls `preventDefault()` and shows *"Real authentication is not connected yet."* No Supabase Auth call, no network, no cookies, no localStorage.
- **Placeholder auth types added** — `src/lib/auth/types.ts` (`VeroxaRole`, `PlaceholderSession`, `AuthStatus`).
- **Placeholder auth hook added** — `src/lib/auth/usePlaceholderAuth.ts` always returns `{ status: "unauthenticated", session: null, isDemoOnly: true }`. No network, no storage.
- **`<RequireRole>` shell added** — `src/components/auth/RequireRole.tsx` renders a polished "Protected Route Preview" card with Back-to-Login and Open-Demo-Hub buttons. No redirects.
- **Future protected route placeholders added:**
  - `/client/dashboard` → `<RequireRole role="client">`
  - `/team/tasks` → `<RequireRole role="team">`
  - `/operator/overview` → `<RequireRole role="operator">`
  - `/owner/dashboard` → `<RequireRole role="owner">`
- **Still no real auth.** No Supabase Auth wired, no sessions, no cookies, no localStorage, no JWT, no writes, no real user accounts.
- See `AUTH_ARCHITECTURE_PLAN.md` §9 for details.

## First write surface plan

- **First write surface plan created** — `docs/FIRST_WRITE_SURFACE_PLAN.md` defines priorities, role × surface matrix, and hard exclusions (publishing, AI, uploads, Google integrations, billing are out of scope for the first write phase).
- **Write-draft SQL created** — `docs/database/write-draft/001_first_write_surface_draft.sql` covers per-table writable / immutable / scope commentary plus DRAFT-only policy sketches for `notifications`, `onboarding_items`, `content_concepts`, `draft_variants`, `posts`, `post_slots`, `weekly_reports`, `monthly_reports`.
- **Audit log draft created** — `docs/database/write-draft/002_audit_log_draft.sql` defines `audit_logs` (actor_user_id, actor_role, client_id, action, resource_type, resource_id, metadata jsonb, created_at), three indexes, append-only enforcement, draft SELECT policies (operator/owner read all, client reads own client_id + whitelisted actions only), and an explicit "no client-side INSERT" stance.
- **Still not applied.** Nothing in `write-draft/` has been run against any Supabase project.
- **Still no real writes.** The app today has zero `INSERT` / `UPDATE` / `DELETE` / `UPSERT` paths anywhere.
- **Still no real auth.** No Supabase Auth wired, no sessions, no cookies, no localStorage, no JWT.
- **Still no upload / publishing / AI / Google integrations.** All explicitly out of scope for the first write phase.
- See `AUTH_ARCHITECTURE_PLAN.md` §10 for details.

## Client Onboarding demo flow

- **Client Onboarding demo route added** at `/demo/client/onboarding` (`src/pages/client-onboarding.tsx`), registered in `App.tsx`.
- **Client Portal sidebar** now includes an **Onboarding** item (`ClipboardList` icon) in `src/lib/clientPortalNav.ts`. Existing items (Dashboard, Content Calendar, Google Visibility, Reports, Updates) are unchanged.
- **Six sections** rendered as cards: Restaurant Basics, Brand & Positioning, Menu & Offers, Content Preferences, Media Instructions, Google Visibility.
- **Demo form uses local component state only** (`useState`). No Supabase reads or writes, no API calls, no upload handling, no `localStorage`, no cookies. The Menu section has a visual "Upload menu (placeholder)" area that does not accept files.
- **Submit button** reads "Save Onboarding — Coming Soon"; `preventDefault()` on submit; displays "Demo only — onboarding is not saved yet."
- **Launch Readiness side card** computes Pending / In progress / Ready per section from local field state and shows an overall progress bar — entirely derived from local state.
- **No onboarding writes yet. No uploads yet. No Supabase mutation functions.** The Supabase read-only layer and `useClientPortalData` are untouched.

## Media Library demo flow

- **Media Library demo route added** at `/demo/client/media` (`src/pages/client-media.tsx`), registered in `App.tsx`.
- **Client Portal sidebar** now also includes a **Media Library** item (`Images` icon). All other nav items unchanged.
- **Sections:** Upload (drag-and-drop card with "Choose Files — Coming Soon" button), Upload Guidelines (food close-ups, kitchen/prep, staff/customer moments, menu/specials, avoid blurry/dark), Media Review Preview (static demo statuses: "Ready for editing", "Needs better lighting", "Good for Google post", "Use for weekend promo"), Content Supply Snapshot (available / used / needs review + library utilisation bar + low-content warning).
- **No real upload.** The hidden file input only reads file names / sizes / MIME types into local component state. **No `fetch`, no `FormData`, no Supabase Storage, no API call, no `localStorage`, no cookies.** Selected file list disappears on refresh.
- **Demo-only notice** rendered on the page: "Real media uploads will require authenticated client access, storage rules, production RLS, and upload validation."

## Onboarding data model + media storage drafts

- **Onboarding data model draft created** under `docs/database/onboarding-draft/` (`001_onboarding_answer_payload_draft.md`, `002_onboarding_items_extension_draft.sql`, `README.md`). Locks down the future `onboarding_items.answer_payload` shape against the six demo sections, with an example payload and validation notes. **No SQL applied.**
- **Media storage planning draft created** under `docs/database/media-draft/` (`001_media_storage_plan.md`, `002_media_assets_metadata_draft.sql`, `README.md`). Documents the future `veroxa-client-media` private bucket, path layout, allowed MIME types, size limits, upload flow, signed-URL strategy, and `media_assets` metadata extension. **No bucket created. No SQL applied.**
- **Onboarding / Media demo pages polished but still local-state-only.** Onboarding gained a "Reset demo form" button and a clearer pre-submit note. Media gained a "Future upload pipeline" preview card (Choose files → Validate → Upload to private storage → Create metadata → Notify team) and clearer picker copy ("Selected locally only — not uploaded"). Submit text and `preventDefault` behavior unchanged.
- **Future real route placeholders expanded** in `App.tsx`. The existing `RequireRole` shell now also serves: `/client/onboarding`, `/client/media`, `/client/calendar`, `/client/reports`, `/team/media-review`, `/team/drafts`, `/team/scheduling`, `/operator/alerts`, `/operator/report-approvals`, `/owner/revenue`, `/owner/client-health`. All render the "Protected Route Preview" card — **no real auth, no session check, no redirect, no real route content.**
- **Safety audit checklist created** at `docs/SAFETY_AUDIT_CHECKLIST.md` enumerating what is forbidden today and what must be true before real auth, real writes, and real uploads.
- **Still no real auth.** No Supabase Auth wired, no sessions, no cookies, no `localStorage` tokens, no JWT.
- **Still no writes.** No `INSERT` / `UPDATE` / `DELETE` / `UPSERT` functions anywhere.
- **Still no uploads / storage.** No `fetch`, no `FormData`, no Supabase Storage SDK calls, no bucket.
- **Still no AI / publishing / Google integrations.**

## Mega safe build — readiness docs + demo depth + launch plan

- **Team / Operator / Owner demo pages deepened.** Every Team, Operator, and Owner page now carries a shared `DemoOnlyBanner` card that calls out the page as static demo and describes which future workflow it illustrates. No real action is wired.
- **Owner Settings expanded.** Replaces the single "coming soon" card with four explicit sections (Brand settings, Team permissions, Billing settings, Integrations), each labelled "Coming soon". No settings are saved.
- **Client Portal demo polish.** Client pages were intentionally left untouched in this pass — Onboarding and Media already render their own page-specific "demo only" notices, and Dashboard / Calendar / Google / Reports / Updates already surface a live-vs-demo data badge via `useClientPortalData`. The read-only Supabase layer was not modified.
- **Workflow state machine plan added** — `docs/WORKFLOW_STATE_MACHINES.md` documents states, transitions, role gating, audit action names, and V1 / V2 / later targeting for Media Asset Review, Content Concept, Draft Variant, Post, Post Slot, Weekly Report, Monthly Report, and Onboarding Item.
- **AI agent architecture plan added** — `docs/AI_AGENT_ARCHITECTURE_PLAN.md` covers the V1 → V3 rollout, ten agent definitions with risk levels, and safety principles (no direct publishing, no direct GBP edits, human approval gates).
- **Google / SEO / GBP plan added** — `docs/GOOGLE_SEO_GBP_PLAN.md` covers future GBP tasks, local SEO scope, human-in-the-loop rules, what is **not** promised, and the manual-workflow-first integration sequence.
- **Social publishing plan added** — `docs/SOCIAL_PUBLISHING_PLAN.md` lays out the three publishing phases (manual → semi-automated → direct API), prerequisites, and the four hard rules (no auto-publish, no frontend tokens, failed posts visible to operator, all publishes auditable).
- **Production launch runbook added** — `docs/PRODUCTION_LAUNCH_RUNBOOK.md` is a Stage 0 → Stage 8 plan with rollback principles (keep demo separate, back up Supabase, test RLS per user, feature-flag real routes, never remove fallback until stable).
- **Real auth readiness checklist added** — `docs/REAL_AUTH_READINESS_CHECKLIST.md` with current state, before-implementing list, implementation sequence, and hard stop conditions.
- **Production RLS finalization checklist added** — `docs/PRODUCTION_RLS_FINALIZATION_CHECKLIST.md` with table list, pre-apply test matrix, and do-not-apply gating.
- **Client data mapping added** — `docs/CLIENT_DATA_MAPPING.md` maps every demo Onboarding / Media UI section to its future DB field and audit action.
- **Docs index added** — `docs/README.md` is now the entry point for all planning docs and draft database directories.
- **Still no real auth.** No Supabase Auth, no sessions, no cookies, no `localStorage` tokens, no JWT.
- **Still no writes / uploads / storage.** No `INSERT` / `UPDATE` / `DELETE` / `UPSERT`, no `fetch`, no `FormData`, no Supabase Storage SDK calls, no bucket.
- **Still no AI API.** Every "AI" surface is static / simulated.
- **Still no publishing or Google integration.**

## Restaurant Media Guidance Engine — demo

- **Static / rule-based guidance data added** in `src/lib/mediaGuidance.ts` covering 13 restaurant types (halal grill, bakery, donut shop, pizza, burger, coffee shop, fine dining, food truck, Mexican, Mediterranean, Asian, dessert shop, general restaurant). Each type carries `bestPhotoIdeas`, `avoid`, `weeklyCapturePlan`, `googleSpecificShots`, and `quickTips`.
- **`/demo/client/media` now recommends shots by restaurant type.** A new "Restaurant Media Guidance" card sits above the existing upload card with a restaurant-type selector (local state only) plus Recommended Shots, Google Business Profile Shots, What to Avoid, Weekly Capture Plan, and Quick Tips sections.
- **`/demo/client/onboarding` now explains that cuisine type will later power guidance** via a small helper note under the Cuisine field. No cross-page state is shared; nothing is saved.
- **`/demo/team/media-review` now shows a static Guidance Match preview** (Grill flame shot → matches halal grill, Family platter → good for weekend promo, Storefront → good for Google, blurry prep → needs better lighting).
- **New docs:** `docs/MEDIA_GUIDANCE_ENGINE_PLAN.md` and `docs/database/media-draft/003_media_guidance_profile_draft.md`.
- **Existing docs updated:** `docs/README.md`, `docs/AI_AGENT_ARCHITECTURE_PLAN.md`, `docs/CLIENT_DATA_MAPPING.md`, `docs/SAFETY_AUDIT_CHECKLIST.md`, `src/lib/supabase/README.md`.
- **Still no AI API.** All guidance is rule-based static data.
- **Still no uploads / writes / storage.** Upload card behavior is unchanged.

## Real MVP Readiness / Pre-Auth Architecture Pass

The project has shifted from demo expansion into real MVP readiness. This pass is **architecture + planning only** — no real auth, no writes, no uploads, no storage, no AI, no publishing, no Google integration.

- **Route visibility corrected.** `/demo/client/*` is documented as the public sales / client preview surface. `/demo/team/*`, `/demo/operator/*`, and `/demo/owner/*` are documented as **internal-protect-later** — public during development only. See [`docs/ROUTE_VISIBILITY_STRATEGY.md`](./ROUTE_VISIBILITY_STRATEGY.md).
- **Auth contract created.** `src/lib/auth/authContract.ts` is now the single source of truth for `VeroxaRole`, `AuthStatus`, `VeroxaSession`, `AuthState`, `ROLE_HOME_PATH`, `getRoleHomePath`, `isVeroxaRole`. `src/lib/auth/types.ts` re-exports these for backward compatibility.
- **Placeholder auth aligned with future real auth hook shape.** `usePlaceholderAuth` now returns the canonical `AuthState` from the contract, so the future `useRealAuth` is a drop-in swap.
- **`RequireRole` improved for future swap.** Optional `title` / `description` props, surfaces the role's `getRoleHomePath` value, adds `data-testid="protected-route-preview"`, `required-role`, `role-home-path`.
- **Generic real-route placeholder created.** `src/pages/real-route-placeholder.tsx` exports `RealRoutePlaceholder` and is now used by `real-client-placeholder.tsx`, `real-team-placeholder.tsx`, `real-operator-placeholder.tsx`, `real-owner-placeholder.tsx` — duplication removed.
- **Real route registry created.** `src/lib/realRoutes.ts` lists every future authenticated route with role, label, companion demo path, and description; exports `allRealRoutes`, `routesByRole`, `getDemoPathForRealRoute`.
- **Demo route registry created.** `src/lib/demoRoutes.ts` lists every demo route grouped by portal with explicit `visibility` (`public_sales_preview` vs `internal_demo_protect_later`).
- **Route architecture doc created** — [`docs/ROUTE_ARCHITECTURE.md`](./ROUTE_ARCHITECTURE.md).
- **Internal demo protection plan created** — [`docs/INTERNAL_DEMO_PROTECTION_PLAN.md`](./INTERNAL_DEMO_PROTECTION_PLAN.md).
- **Pre-auth technical checklist created** — [`docs/PRE_AUTH_TECHNICAL_CHECKLIST.md`](./PRE_AUTH_TECHNICAL_CHECKLIST.md).
- **Real MVP readiness plan created** — [`docs/REAL_MVP_READINESS_PLAN.md`](./REAL_MVP_READINESS_PLAN.md). Defines the 10-step MVP sequence and the MVP boundary.
- **Adaptive Improvement Engine plan created** — [`docs/ADAPTIVE_IMPROVEMENT_ENGINE_PLAN.md`](./ADAPTIVE_IMPROVEMENT_ENGINE_PLAN.md). Auto-recommend by default; human approval required for anything external, financial, or client-facing.
- **Customer Growth Priority doc created** — [`docs/CUSTOMER_GROWTH_PRIORITY.md`](./CUSTOMER_GROWTH_PRIORITY.md). Locks in that helping restaurants bring more customers is Veroxa's #1 priority and every feature must pass the customer-growth filter.
- **Real Auth V1 prompt draft created** — [`docs/NEXT_PROMPT_REAL_AUTH_V1_DRAFT.md`](./NEXT_PROMPT_REAL_AUTH_V1_DRAFT.md). Draft only — do not execute until manual approval.
- **Visibility correction:** `/demo/client/*` may remain public for sales preview. `/demo/team/*`, `/demo/operator/*`, and `/demo/owner/*` are public during development but should become internal-protected later.
- **Still no real auth.** Placeholder auth always returns unauthenticated.
- **Still no sessions / JWT / cookies / `localStorage` tokens.**
- **Still no writes / uploads / storage** — no `INSERT` / `UPDATE` / `DELETE` / `UPSERT`, no `fetch`, no `FormData`, no Supabase Storage.
- **Still no AI API, no publishing, no Google integration.**

## Real Auth V1 Session Layer — prepared but not active

The real Supabase session-reading layer is now wired into the codebase but **inactive** by default. `AUTH_MODE` is locked to `"placeholder"` and must be flipped manually after `user_profiles` and at least one test user are ready.

- **`src/lib/auth/useRealAuth.ts` created.** Reads `supabase.auth.getSession()`, subscribes to `onAuthStateChange`, joins `user_profiles` by `user_id`, returns the canonical `AuthState`. Gracefully falls back to `unauthenticated` if Supabase env vars are missing or the `user_profiles` table / row is absent — no crash, only `console.warn`.
- **`src/lib/auth/authMode.ts` created.** Exports `AUTH_MODE: "placeholder" | "real"`, locked to `"placeholder"`. Single switch.
- **`src/lib/auth/useAuth.ts` created.** Thin wrapper that selects `useRealAuth` when `AUTH_MODE === "real"`, otherwise `usePlaceholderAuth`. Branch is statically known per build.
- **`RequireRole` now reads `useAuth()`** instead of `usePlaceholderAuth()` directly. Behavior is **unchanged today** because `AUTH_MODE === "placeholder"`.
- **`/login` updated.** Demo role cards (Client / Team / Operator / Owner) routing to `/demo/*` is unchanged. The "Future Sign In" form is now gated by `AUTH_MODE`:
  - `"placeholder"` (today): `preventDefault`, shows "Real authentication is not connected yet." — **no network, no auth API call.**
  - `"real"` (later): calls `supabase.auth.signInWithPassword`, shows "Signed in. Redirect will be enabled after role routing is approved." on success — **no redirect, no user creation, no writes.**
- **`/auth-status` developer diagnostics page added** (`src/pages/auth-status.tsx`). Shows `AUTH_MODE`, `status`, `isDemoOnly`, `role`, `clientId`, `userId`, `email`, `displayName`. **Never** renders access tokens, refresh tokens, or the raw Supabase session.
- **No real users created.** No writes. No RLS changes. No SQL applied. **No demo routes protected.**
- **Existing read-only Client Portal Supabase layer untouched.** Demo behavior identical.

## Auth session persistence enabled (dev testing)

Supabase client (`src/lib/supabase/client.ts`) updated to
`{ persistSession: true, autoRefreshToken: true,
detectSessionInUrl: true }`. Sessions now survive page reloads
during dev testing. Tokens are managed internally by Supabase — no
manual token storage, no token display. No writes, no uploads, no
service role key, no route changes.

## AUTH_MODE switched to real (dev testing)

`AUTH_MODE` flipped to `"real"` in `src/lib/auth/authMode.ts`.
`useRealAuth` is now active. `/login` will attempt
`signInWithPassword` when credentials are submitted. `/auth-status`
shows `AUTH_MODE: real`. No redirects, no sign-out, no writes, no
demo route changes. Single-file change only.

## Real Auth Manual Prep Pack

Docs-only pass — **no code changes.** All five new files are
instructions for the project owner to follow manually in Supabase
before the dedicated `AUTH_MODE` flip prompt runs.

- [`MANUAL_SUPABASE_AUTH_SETUP_GUIDE.md`](./MANUAL_SUPABASE_AUTH_SETUP_GUIDE.md) — step-by-step manual Supabase setup.
- [`AUTH_TEST_USER_MATRIX.md`](./AUTH_TEST_USER_MATRIX.md) — what each test user should and should not see.
- [`AUTH_QA_CHECKLIST.md`](./AUTH_QA_CHECKLIST.md) — pre-flip, post-flip, regression, and security checks.
- [`AUTH_ROLLBACK_PLAN.md`](./AUTH_ROLLBACK_PLAN.md) — safe rollback procedure if real auth misbehaves.
- [`AUTH_MODE_SWITCH_PLAN.md`](./AUTH_MODE_SWITCH_PLAN.md) — explicit scope contract for the future one-line flip prompt.

Still true:

- `AUTH_MODE` remains `"placeholder"`.
- Real auth is not active.
- **No users created by code.** **No SQL applied by the app.** **No writes.** **No demo route protection changes.**

## Next recommended phase

**Manual Supabase preparation, outside Replit.** Do not run more
prompts in Replit until these are done by hand:

1. Review the draft SQL under `docs/database/auth-draft/`.
2. Apply `user_profiles` manually in the dev Supabase project — only if approved.
3. Create the four test users manually in Supabase Auth.
4. Insert four matching `user_profiles` rows manually.
5. Tick every box in [`AUTH_QA_CHECKLIST.md`](./AUTH_QA_CHECKLIST.md) → "Before switching".
6. Then run the dedicated small `AUTH_MODE` switch prompt per [`AUTH_MODE_SWITCH_PLAN.md`](./AUTH_MODE_SWITCH_PLAN.md).

## Earlier next phase note (superseded)

**Manual review: Real Auth V1 decision.** If approved, the next prompt should be small and only wire Supabase Auth read-only session handling per [`docs/NEXT_PROMPT_REAL_AUTH_V1_DRAFT.md`](./NEXT_PROMPT_REAL_AUTH_V1_DRAFT.md). Before that prompt runs, every item in [`docs/PRE_AUTH_TECHNICAL_CHECKLIST.md`](./PRE_AUTH_TECHNICAL_CHECKLIST.md) must be ticked.

Specifically:

- Audit `usePlaceholderAuth` for the swap site once real auth lands (shape return value to match a future real session hook), without changing today's behavior
- Confirm the future-route `/client|/team|/operator|/owner` placeholders all read role from a single source so a single hook swap activates them
- Inventory any `data-testid` attributes on the future placeholder card to keep regression tests stable across the swap
- Keep `/login`, all `/demo/*` routes, all `RequireRole` placeholders, and all draft SQL / storage / write-draft docs untouched and unapplied
- Do **not** wire real Supabase Auth, real writes, real uploads, AI, or publishing in that phase

---

## Build commands

- `pnpm --filter @workspace/veroxa run typecheck` — typecheck (last run: passing)
- `pnpm --filter @workspace/veroxa run build` — production build (needs workflow-provided `PORT` / `BASE_PATH`; typecheck is the canonical local verification)
- App workflow: `artifacts/veroxa: web` — running

## Authenticated Demo Routing V1

**Status: COMPLETE**

- Successful login now routes to the matching demo portal by role
  (`getDemoRoleHomePath` in `authContract.ts`).
- `/demo/client/*` remains fully public for sales preview.
- `/demo/team/*`, `/demo/operator/*`, `/demo/owner/*` are now
  protected by `InternalDemoGuard` (loading / login-required /
  wrong-role states).
- Login page: section title is now "Sign In" (was "Future Sign In"),
  badge is now "Active" (was "Planned"), client card shows
  "Public Preview", team/operator/owner cards show "Login Required".
- Public Demo Hub no longer lists Team/Operator/Owner portal cards.
  It shows the Client Portal preview and a note directing internal
  users to sign in.
- `/auth-status` has a safe "Sign Out" button (authenticated state
  only); calls `supabase.auth.signOut()` then redirects to `/login`.
- No writes, uploads, storage, service role, or AI API added.
- Real production routes (`/client/*`, `/team/*`, etc.) remain
  placeholder shells.

## Public Services + Pricing Page

**Status: COMPLETE**

- Landing page rewritten with 8 sections in order: Hero, Stats,
  What Veroxa Does, Services Included, Pricing Preview, Ads
  Management, Bundle Pricing, Client Portal Preview, and CTA.
- Exact pricing added: Complete Online Presence ($997–$1,497/mo),
  Ads Management (+$1,500 add-on or $2,000 ads-only), Bundle
  ($1,797–$2,297/mo).
- Ad spend separate disclaimer shown in Ads Management section.
- No-guarantees disclaimer in pricing section and footer.
- Hero CTAs: "Request Restaurant Audit" + "View Client Portal Preview".
- Client Portal Preview section links only to `/demo/client/dashboard`.
- Public pages do not expose Team/Operator/Owner demo portal links.
- Navigation links to Services, Pricing, and Preview anchors.
- `docs/PUBLIC_PRICING_AND_SERVICES.md` created as locked pricing
  source of truth.
- No writes, uploads, storage, auth, or database changes.

## Public Website Truthfulness Cleanup

**Status: COMPLETE**

- Removed unproven stats from landing page (340+ restaurants, 18,000+ posts,
  96% retention, +41% Google visibility lift).
- Replaced Stats Strip with four honest system-based trust signals:
  Restaurant-Focused System, Role-Based Portal, Google + Social Focus,
  Reporting Built In.
- Added honest early-stage positioning phrase in "What Veroxa Does" section.
- Pricing, services, CTAs, and Client Portal Preview link unchanged.
- No auth, database, upload, or storage changes.
- `PUBLIC_PRICING_AND_SERVICES.md` updated with Truthful Public Claims Rule.
- `CUSTOMER_GROWTH_PRIORITY.md` updated with truthfulness principles.

## Public Website Structure V1

**Status: COMPLETE**

- Public website separated into four pages: Home (`/`), Services
  (`/services`), Pricing (`/pricing`), and Demo experience (`/demo`).
- Homepage simplified to introduction only — no full pricing tables or
  full services list.
- Demo page positioned as the public client experience with only the
  Client Portal preview card and an internal-portals-require-login note.
- `/services` page created with full services breakdown and
  Ads Management section.
- `/pricing` page created with exact pricing (Complete Online Presence,
  Ads Management, Bundle), ad-spend disclaimer, and no-guarantees note.
- `PublicNav` and `PublicFooter` shared components created.
- Pricing numbers unchanged from last approved version.
- Truthfulness rules (no fake stats, no fake claims) preserved.
- No auth, database, upload, or storage changes.
- Internal demo guards unchanged.

## Public Copy Polish Pass

**Status: COMPLETE**

- Demo page typo ("media guidance guidance") confirmed already correct
  in current build — was resolved during the website structure pass.
- Verified zero internal demo links (/demo/team, /demo/operator,
  /demo/owner) on any public page (landing, demo-hub, services,
  pricing, PublicNav, PublicFooter).
- All public nav links confirmed correct: Home → /, Services →
  /services, Pricing → /pricing, Demo → /demo, Login → /login,
  Request Audit → mailto.
- Pricing numbers unchanged.
- Typecheck passed clean — zero errors.
- No auth, database, upload, or storage changes.

## Public Website QA + Copy Polish Pass

**Status: COMPLETE**

- Home / Demo / Services / Pricing structure reviewed — all pages
  remain separated by purpose and contain no cross-contamination.
- Demo page "What you can explore" bullet list added to the Client
  Portal preview card (Dashboard, Content Calendar, Google Visibility,
  Reports, Updates, Onboarding, Media Guidance).
- Pricing page "Which plan fits?" mini guide added below Complete
  Online Presence pricing cards.
- Demo page typo confirmed fixed ("media guidance", not doubled).
- Public link safety scan: zero internal demo links (/demo/team,
  /demo/operator, /demo/owner) found on any public page.
- Truthfulness scan: zero fake stats (340+, 18,000+, 96%, +41%) or
  guaranteed-result claims found on any public page.
- PublicNav and PublicFooter links verified correct.
- Authenticated demo routing preserved — login redirects, role guards,
  wrong-role card, sign-out all unchanged.
- Pricing numbers unchanged.
- No auth, database, upload, or storage changes.
- Typecheck: zero errors.

## True Stabilization Build Pass V1.1

**Status: COMPLETE — May 25, 2026**

Stabilization-only pass. No new features, no design changes, no real
auth activation.

- **`AUTH_MODE` flipped back to `"placeholder"`** in
  `src/lib/auth/authMode.ts`. Real Supabase auth code remains wired
  but inactive; `InternalDemoGuard` short-circuits to render demo
  children directly when `AUTH_MODE === "placeholder"`. No Supabase
  network calls from the auth layer.
- **Canonical demo role home paths confirmed** in
  `src/lib/auth/authContract.ts` (`DEMO_ROLE_HOME_PATH`):
  client → `/demo/client/dashboard`,
  team → `/demo/team/dashboard`,
  operator → `/demo/operator/operator-os`,
  owner → `/demo/owner/executive-dashboard`.
  Login role cards in `src/pages/login.tsx` point to the same
  destinations.
- **Operator sidebar: Priority Board → System Status.**
  `src/lib/operatorPortalNav.ts` swaps the 7th nav item for "System
  Status" (`ShieldCheck` icon, `href: /demo/operator/system-status`).
  Priority Board remains routed at `/demo/operator/priority-board`
  but is hidden from nav.
- **New operator-wrapped System Status page** at
  `/demo/operator/system-status`
  (`src/pages/operator-system-status.tsx`). Renders the same
  `demoSystemStatus` fixture as `/demo/internal/system-status` but
  inside the operator `PortalLayout` so it carries the operator
  sidebar. The original `/demo/internal/system-status` diagnostics
  route is preserved as an internal-only surface.
- **Operator / owner shells confirmed wrapped in `PortalLayout`.**
  `operator-os.tsx`, `operator-media-library.tsx`, and `owner-os.tsx`
  already render their content inside `PortalLayout` with their
  respective nav items. No further wrapping needed.
- **`demoRoutes.ts` rewritten** with a richer five-value visibility
  taxonomy: `visible_nav | hidden_from_nav | legacy_demo |
  internal_demo | future_protected`. The client, team, operator,
  owner, internal, and future-protected entries are tagged with
  their current visibility intent. A future light parity script can
  compare this registry against `App.tsx` to catch drift.
- **Pricing labels cleanup.** `docs/PUBLIC_PRICING_AND_SERVICES.md`
  corrected: the "Growth system" tier label was corrected for both
  Complete Online Presence plans and Bundle plans. Locked monthly
  prices unchanged ($997 / $1,097 / $1,197 / $1,497 plans; $1,797 /
  $1,897 / $1,997 / $2,297 bundles; ads add-on +$1,500, ads-only
  $2,000). `src/pages/pricing.tsx` corrected in stabilization pass.
- **Docs synced.** This entry + `ROUTE_ARCHITECTURE.md` updated to
  document the new operator System Status route, the sidebar swap,
  and the expanded `DemoVisibility` taxonomy.
- **Still no real auth, real writes, real uploads, real AI, real
  publishing, or real Google integration.** Supabase remains
  inactive at runtime via `AUTH_MODE === "placeholder"`.
- **Typecheck:** zero errors.

---

## Changelog entry — Dev Supabase M001–M006 execution checkpoint (2026-05-27)

- **Dev Supabase: M001–M006 applied and seeded.** Human operator
  executed each dev-test package against the dev Supabase project,
  in order. Applied M003 notification-status guard (`01b`) and
  team-scope correction (`01c`); M004 post-slot reset guard (`01b`)
  and posts/post_slots staff-scope correction (`01c`); M005 reports
  staff-scope correction (baked into `01_apply_m005`). Manually
  seeded fixture data across all 17 tables (clients 2,
  team_client_assignments 1, client_platforms 3, onboarding_items 3,
  client_requests 2, media_assets 3, notifications 4,
  client_health_snapshots 2, activity_logs 3, posts 4, post_slots 4,
  weekly_reports 3, monthly_reports 3, ai_agents 2,
  content_concepts 2, draft_sets 2, draft_variants 3). Full database
  count check passed.
- **Portal still placeholder / disconnected.** `AUTH_MODE` remains
  `"placeholder"`. `useClientPortalData` continues to short-circuit
  to fixtures. The Replit app is **not** connected to the dev
  Supabase project; the dev DB work is purely a backend execution
  checkpoint, not a portal activation.
- **Next phase: Portal Connect Plan, not production auth.** Design
  a read-only repository layer behind typed query functions and
  plan the `client_portal_*` views (deferred to the portal-connect
  pass). Do not flip `AUTH_MODE`, do not connect the portal, do not
  promote SQL to `supabase/migrations/`, and do not wire any real
  AI / publishing / payment providers until a real-auth readiness
  checklist is written and signed off.
- **New doc:** [`docs/DEV_SUPABASE_EXECUTION_CHECKPOINT.md`](./DEV_SUPABASE_EXECUTION_CHECKPOINT.md)
  — per-migration status table, manual cleanup notes, seed counts,
  corrections + guards, and the explicit next-phase guidance.
- **No source code changed.** This pass is documentation-only.
  Invariants unchanged: AUTH_MODE=`"placeholder"`, no
  `supabase/migrations/`, portal disconnected, no real AI /
  publishing / payments, locked pricing
  (49700 / 99700 / 109700 / 119700 / 149700), four roles
  (Client / Team / Operator / Owner), no nav / four-shell changes.
- **Typecheck:** PASS.
