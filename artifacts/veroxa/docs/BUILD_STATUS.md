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

## Next recommended phase

**Client Onboarding Data Model Draft + Media Storage Planning — docs/SQL draft only.**

Specifically:

- Draft (do not apply) the `onboarding_items.answer_payload` shape (JSON schema) plus per-section keys, mapped to what the `/demo/client/onboarding` form already collects
- Draft (do not apply) the `media_assets` metadata table (filename, MIME type, size, uploaded_by, status, review tags, client_id) and a planning doc for the eventual Supabase Storage bucket layout, RLS, and signed-URL strategy
- Keep `/login`, all `/demo/*` routes, the future sign-in form shell, the `<RequireRole>` placeholders, the auth-draft + write-draft SQL files, and the existing Client/Team/Operator/Owner portal pages untouched and unapplied
- Do **not** wire real Supabase Auth sessions, real writes, real uploads, AI, or publishing in that phase

---

## Build commands

- `pnpm --filter @workspace/veroxa run typecheck` — typecheck (last run: passing)
- `pnpm --filter @workspace/veroxa run build` — production build (needs workflow-provided `PORT` / `BASE_PATH`; typecheck is the canonical local verification)
- App workflow: `artifacts/veroxa: web` — running
