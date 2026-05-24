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

## Next recommended phase

**First Write Surface Planning — approvals / read flags / actions, draft only** (see `AUTH_ARCHITECTURE_PLAN.md` §10).

Specifically:

- Identify the smallest write surface needed to make the first real workflow useful (likely: notification read flags, draft approvals, post-slot status updates)
- Draft (do not apply) the first `INSERT` / `UPDATE` / `DELETE` RLS policies for those rows, scoped by role and tenant
- Identify which writes must go through a server-side function with the service role key vs which can safely run client-side under RLS
- Keep `/demo/*`, the demo `/login` role cards, the future sign-in form shell, the `<RequireRole>` placeholders, and the auth-draft SQL files untouched and unapplied
- Do **not** wire real Supabase Auth sessions, real writes, real uploads, AI, or publishing in that phase

---

## Build commands

- `pnpm --filter @workspace/veroxa run typecheck` — typecheck (last run: passing)
- `pnpm --filter @workspace/veroxa run build` — production build (needs workflow-provided `PORT` / `BASE_PATH`; typecheck is the canonical local verification)
- App workflow: `artifacts/veroxa: web` — running
