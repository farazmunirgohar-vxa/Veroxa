# Veroxa — Build Status

**Date:** May 23, 2026
**Milestone:** Routed Portal Demo + Live Client Read Layer

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

- Real authentication (login, sessions, user accounts)
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

## Next recommended phase

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
