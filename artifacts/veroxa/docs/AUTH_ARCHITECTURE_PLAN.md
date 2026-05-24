# Veroxa — Auth Architecture Plan

**Date:** May 23, 2026
**Status:** Planning only — no real auth implemented.

This document captures the intended architecture for real authentication in Veroxa. None of it is implemented yet. The current `/login` page is a **demo role router**, not a real sign-in.

---

## 1. Current status

- `/login` is **demo-only** — it shows four role cards that route to the corresponding `/demo/*` portal.
- **No real authentication** has been implemented.
- **No real sessions** (no JWT, no cookies, no localStorage tokens).
- **No passwords** are collected, validated, or stored.
- **No Supabase Auth** has been wired in (the Supabase client uses the anon key only for read access).
- **No protected production routes** exist.
- No user table, no role table, no invite flow, no password reset.

---

## 2. Demo vs Real structure

We are building **Demo Veroxa** and **Real Veroxa** side by side.

| Path | Purpose | Auth |
|---|---|---|
| `/` | Public marketing landing page | None |
| `/demo` | Demo hub — choose a role | None |
| `/demo/client/*` | Client Portal demo (read-only Supabase + static fallback) | None |
| `/demo/team/*` | Team Portal demo (static) | None |
| `/demo/operator/*` | Operator Portal demo (static) | None |
| `/demo/owner/*` | Owner Portal demo (static) | None |
| `/login` | Demo access shell (current) → future real sign-in (later) | None today |
| `/client/*` | **Future** real Client Portal | Will require auth |
| `/team/*` | **Future** real Team Portal | Will require auth |
| `/operator/*` | **Future** real Operator Portal | Will require auth |
| `/owner/*` | **Future** real Owner Portal | Will require auth |

The `/demo/*` namespace will **remain** as the public sales / testing / screenshot surface even after real auth ships. Real authenticated routes will be built in parallel under role-named root paths.

---

## 3. Future roles

Four canonical roles, each scoped to one of the future authenticated portal namespaces:

- **Client** — a restaurant owner. Sees only their own client data.
- **Team** — a Veroxa content team member. Sees assigned work across clients.
- **Operator** — Veroxa operations. Sees agency-wide oversight (alerts, failed posts, report approvals).
- **Owner** — Veroxa agency leadership. Sees global business metrics (revenue, health, critical alerts).

Additional roles (e.g. admin, billing, read-only viewer) are out of scope for the first auth phase.

---

## 4. Future auth model recommendation

**Provider:** Supabase Auth is the recommended provider — it pairs cleanly with the existing Supabase Postgres + RLS layer and avoids a second identity store.

**Profile table:** A `user_profiles` table will map `auth.users.id → role → tenant scope`:

```text
user_profiles
  user_id          uuid  references auth.users(id)  primary key
  role             enum  ('client', 'team', 'operator', 'owner')
  client_id        uuid  nullable  -- set for role='client'
  team_member_id   uuid  nullable  -- set for role='team'
  display_name     text
  created_at       timestamptz
```

**Access boundaries:**

- **Client users** can only read rows where `client_id = their client_id`.
- **Team users** are assigned to one or more clients via `team_client_assignments` (V1 = client-scoped, not resource-scoped). A team user can see all work rows (tasks, drafts, scheduled posts, reports) for any client they are actively assigned to. Per-post / per-draft / per-report assignment is V2. See §8.
- **Operator users** can see operational oversight rows across all clients (alerts, failed posts, report approvals) but not agency revenue.
- **Owner users** can see global business-level dashboards (MRR, growth, critical alerts, full client health).

**Login routing:** After successful sign-in, look up `user_profiles.role` and redirect to `/<role>/<default-tab>` (e.g. `/client/dashboard`, `/team/tasks`).

---

## 5. Future RLS strategy

The current dev RLS read policies (in `docs/database/rls-draft/001_dev_read_policies.sql`) allow the **anon** role to `SELECT` so the read-only Client Portal demo can work without sign-in. This is **temporary** and **dev-only**.

Production RLS must:

1. **Drop anon read access** on all business tables.
2. **Require `auth.uid()`** on every policy — no anonymous read in production.
3. **Scope by tenant** via `user_profiles` lookups, e.g.
   ```sql
   USING (
     client_id = (SELECT client_id FROM user_profiles WHERE user_id = auth.uid())
   )
   ```
4. **Differentiate read vs write** policies. Demo phase has no write paths; real phase must add explicit `INSERT`/`UPDATE`/`DELETE` policies per role per table.
5. **Never expose the service role key to the frontend.** All privileged operations go through a server-side function (Postgres function, Edge Function, or backend API), never the browser client.

---

## 6. Future protected route strategy

**Demo namespace:**

- `/demo/*` stays public forever. No auth gates, no redirects. Used for sales, screenshots, and walkthroughs.

**Real namespace:**

- `/client/*`, `/team/*`, `/operator/*`, `/owner/*` will all sit behind an auth guard:
  - Unauthenticated request → redirect to `/login`.
  - Authenticated but wrong role → redirect to the user's own `/<role>/<default>` or show a 403 page.
- The guard reads the current Supabase session and the user's `user_profiles.role`.
- The session check should happen at a single route boundary (e.g. a `<RequireRole role="client">` wrapper) so individual page components remain dumb about auth.

**Login page:**

- `/login` will absorb a real form (email + password, or magic link, or OAuth) when real auth ships.
- The demo role-card layout we have today will move to `/demo` or get a "Continue as demo" subsection on `/login`.

---

## 7. What NOT to build yet

Explicitly out of scope for this phase and the next:

- Real login (email/password, magic link, OAuth flows)
- Password reset
- Invite flow / team onboarding
- User management UI (admin-side CRUD on users / roles)
- Production RLS policies
- Write permissions of any kind (insert / update / delete)
- Media uploads
- Approval actions (claim task, approve draft, sign off report)
- Publishing integrations (Instagram, Facebook, TikTok, Google Business Profile)
- AI integrations (real caption generation, real media QA, real brand-voice analysis)
- Automation, queues, schedulers, webhooks
- Email / notification delivery
- Billing / subscription management
- Multi-tenant org switching

---

## 8. Auth Data Model Draft

A first pass of the real-auth schema and production RLS direction now lives, in draft form only, under [`database/auth-draft/`](./database/auth-draft/). Nothing in that directory has been applied — current /demo/* behaviour is unchanged.

**`user_profiles` table — purpose:**
One row per Supabase Auth user. Maps `auth.users.id` to a Veroxa role and, when applicable, a tenant scope (`client_id`). It is the single source of truth that every production RLS policy will join against.

**`veroxa_user_role` enum:**
Four values — `client`, `team`, `operator`, `owner`. Additional roles (admin, billing, viewer) are explicitly out of scope for V1.

**Role / `client_id` rules in V1:**
- `client` role **requires** `client_id` (enforced by a CHECK constraint).
- `team`, `operator`, and `owner` **do not** have a `client_id` — they are unscoped at the profile level.

**Production RLS direction:**
- Every production policy will require `auth.uid()` — no anonymous access in production.
- Tenant scoping joins `user_profiles` via helper functions (`current_user_role()`, `current_user_client_id()`) sketched in the draft.
- `client` role reads only rows where `row.client_id = their user_profiles.client_id`.
- `operator` / `owner` read across all clients (SELECT only at this layer).
- The temporary dev anon read policies in `database/rls-draft/001_dev_read_policies.sql` must be dropped before production.
- Service role key never reaches the frontend.

**Team Assignment Model — V1 Decision:**

V1 uses **client-scoped** team assignments via a dedicated `team_client_assignments` table.

- **Table:** `team_client_assignments(id, team_user_id → user_profiles, client_id → clients, assignment_role, is_active, created_at, updated_at)` with `UNIQUE (team_user_id, client_id)` and a CHECK on `assignment_role` (`content_team` / `reviewer` / `scheduler` / `reporting_support`).
- A team user can be assigned to **multiple clients**; the team portal will union work rows across all active assignments.
- **Team RLS direction:** for every client-scoped table, team users may `SELECT` rows where `row.client_id` is in their active `team_client_assignments`. For the `clients` table itself, team users may `SELECT` only client rows whose `id` is in their assignments.
- **Why this over resource-level (per-post / per-draft / per-report) in V1:** matches how the agency actually delegates work (per-client ownership), reuses an identical SELECT pattern on every client-scoped table, avoids back-filling assignment rows at go-live, and supports the first real execution workflow without overcomplicating permissions.
- **V2** may add resource-level assignments for individual posts, drafts, reports, or tasks — layered on top of V1 without breaking it.
- **Draft SQL** lives in `database/auth-draft/003_team_assignment_schema_draft.sql` (not applied). The team SELECT policy examples on `clients` and `client_platforms` are sketched in `002_production_rls_policy_draft.sql`. A draft `current_team_client_ids()` SECURITY DEFINER helper is also included.
- **Today:** `/team/*` is static demo-only; nothing in this section is wired or applied.

**Draft SQL files (do not run):**
- `database/auth-draft/001_auth_user_profiles.sql` — enum, table, constraint, indexes, `updated_at` trigger, `ENABLE ROW LEVEL SECURITY`.
- `database/auth-draft/002_production_rls_policy_draft.sql` — SELECT-only policy direction across business tables, with team policies sketched as client-scoped via `team_client_assignments`.
- `database/auth-draft/003_team_assignment_schema_draft.sql` — V1 team assignment table, indexes, `updated_at` trigger, draft `current_team_client_ids()` helper, RLS enabled.
- `database/auth-draft/README.md` — the rationale and sequencing for the directory.

---

## 9. Login Form + Guard Shell Status

The login form UI shell and the `<RequireRole>` guard shell now exist in the app — UI only, no real auth.

**`/login`:**
- Still shows the four demo role cards (Client / Team / Operator / Owner) routing to `/demo/*`.
- Now also shows a polished **Future Sign In** form below the demo cards: Email + Password inputs and a "Sign In — Coming Soon" button.
- The form **does not authenticate.** Submit calls `preventDefault()` and reveals a small notice: *"Real authentication is not connected yet."* No Supabase Auth call, no network, no cookies, no localStorage.

**Placeholder auth layer (`src/lib/auth/`):**
- `types.ts` — `VeroxaRole`, `PlaceholderSession`, `AuthStatus`. Types only, no Supabase imports.
- `usePlaceholderAuth.ts` — always returns `{ status: "unauthenticated", session: null, isDemoOnly: true }`. No network, no storage. When real auth ships, only this hook's implementation changes; call sites stay the same.

**`<RequireRole>` (`src/components/auth/RequireRole.tsx`):**
- Reads `usePlaceholderAuth()`. Since status is always `unauthenticated`, it renders a polished **"Protected Route Preview"** card with role-specific copy, a Back-to-Login button, and an Open-Demo-Hub button.
- Does **not** auto-redirect.
- Is **not** used anywhere on `/demo/*`.

**First future real route placeholders:**
- `/client/dashboard` → `<RequireRole role="client">`
- `/team/tasks` → `<RequireRole role="team">`
- `/operator/overview` → `<RequireRole role="operator">`
- `/owner/dashboard` → `<RequireRole role="owner">`

Each renders only the protected-route preview card from `<RequireRole>`. None call Supabase.

**What is still NOT in place:**
- No Supabase Auth has been wired (no `signIn`, `signInWithPassword`, `signInWithOtp`, `getSession`, `onAuthStateChange`, `signOut`).
- No sessions, cookies, localStorage tokens, or JWT.
- No real users, no writes, no validation of real credentials.
- The `user_profiles` table and production RLS policies remain draft-only in `database/auth-draft/` and are not applied.

---

## 10. Recommended next phase

**First Write Surface Planning — approvals / read flags / actions, draft only.**

Specifically:

1. Identify the smallest write surface needed to make the first real workflow useful (likely: notification read flags, draft approvals, post-slot status updates).
2. Draft (do not apply) the first `INSERT` / `UPDATE` / `DELETE` RLS policies for those rows, scoped by role (client / team / operator / owner) and tenant (`client_id` / `team_client_assignments`).
3. Identify which writes must go through a server-side function with the service role key vs which can safely run client-side under RLS.
4. Keep `/demo/*`, the demo `/login` role cards, the future sign-in form shell, the `<RequireRole>` placeholders, and the auth-draft SQL files untouched and unapplied.

Only after that planning phase is approved should we wire actual Supabase Auth sessions, real sign-in, apply the auth-draft migrations, and replace the `<RequireRole>` placeholder pages with real authenticated portal trees.
