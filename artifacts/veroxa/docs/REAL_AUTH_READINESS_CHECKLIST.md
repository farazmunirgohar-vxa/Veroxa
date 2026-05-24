# Real Auth Implementation Readiness Checklist

> **Status:** Real auth is **wired but inactive by default.** The
> Real Auth V1 session-layer pass added `useRealAuth`, the unified
> `useAuth` wrapper, the `AUTH_MODE` toggle, a gated
> `signInWithPassword` path on `/login`, and the `/auth-status`
> diagnostics page. While `AUTH_MODE === "placeholder"` (current
> setting), none of the real-auth code paths execute and the Veroxa
> frontend continues to use placeholder auth + read-only Supabase
> access for the Client Portal demo. Activation is a manual
> decision — every gate below must still be ticked first.

> **Update from the Real Auth Manual Prep Pack:**
>
> Five new docs now define the manual Supabase preparation that must
> happen before `AUTH_MODE` can be flipped to `"real"`:
>
> - [`MANUAL_SUPABASE_AUTH_SETUP_GUIDE.md`](./MANUAL_SUPABASE_AUTH_SETUP_GUIDE.md)
>   — manual Supabase steps for the project owner.
> - [`AUTH_TEST_USER_MATRIX.md`](./AUTH_TEST_USER_MATRIX.md) —
>   per-role test users + expected access scope.
> - [`AUTH_QA_CHECKLIST.md`](./AUTH_QA_CHECKLIST.md) — pre-flip,
>   post-flip, regression, and security checks.
> - [`AUTH_ROLLBACK_PLAN.md`](./AUTH_ROLLBACK_PLAN.md) — safe
>   rollback procedure.
> - [`AUTH_MODE_SWITCH_PLAN.md`](./AUTH_MODE_SWITCH_PLAN.md) —
>   one-line flip prompt scope contract.
>
> No code changes in this pass. `AUTH_MODE` remains `"placeholder"`.

> **Update from the Real Auth V1 session-layer pass:**
>
> - `useRealAuth` hook created (`src/lib/auth/useRealAuth.ts`) —
>   reads `supabase.auth.getSession()`, subscribes to
>   `onAuthStateChange`, joins `user_profiles`. **Inactive today.**
> - `useAuth` wrapper created (`src/lib/auth/useAuth.ts`) — selects
>   placeholder vs real based on `AUTH_MODE`.
> - `AUTH_MODE` toggle exists (`src/lib/auth/authMode.ts`) and is
>   **locked to `"placeholder"`**.
> - `/login` sign-in form is gated and inactive in placeholder mode.
>   In real mode it would call `signInWithPassword` only — no
>   redirect, no user creation, no writes.
> - **No users created yet.** `user_profiles` must be reviewed and
>   applied manually before `AUTH_MODE` is flipped to `"real"`.
> - `/auth-status` developer diagnostics page available — never
>   renders tokens or raw session.

> **Update from the Real MVP Readiness / Pre-Auth Architecture pass:**
>
> - `src/lib/auth/authContract.ts` and the route registries
>   (`src/lib/realRoutes.ts`, `src/lib/demoRoutes.ts`) now prepare
>   the codebase for real auth — the real auth hook will be a
>   drop-in swap behind the same `AuthState` shape.
> - Demo visibility corrected: `/demo/client/*` may stay public
>   as a sales preview; `/demo/team/*`, `/demo/operator/*`, and
>   `/demo/owner/*` should be internal-protected later
>   (see [`INTERNAL_DEMO_PROTECTION_PLAN.md`](./INTERNAL_DEMO_PROTECTION_PLAN.md)
>   and [`ROUTE_VISIBILITY_STRATEGY.md`](./ROUTE_VISIBILITY_STRATEGY.md)).
> - *(Historical note from the pre-auth pass — superseded by the
>   Real Auth V1 session-layer pass below: real auth is now wired
>   but inactive while `AUTH_MODE === "placeholder"`.)*

## Current state

- `/login` is **demo role routing** plus a real-but-gated sign-in
  shell. The submit handler branches on `AUTH_MODE`
  (`src/lib/auth/authMode.ts`):
  - `"placeholder"` (today): `preventDefault`, shows
    "Real authentication is not connected yet." — **no network
    call, no Supabase Auth API call.**
  - `"real"` (later, manual flip only): calls
    `supabase.auth.signInWithPassword` and shows
    "Signed in. Redirect will be enabled after role routing is
    approved." — **no redirect, no user creation, no writes,
    no manual token storage.**
- `RequireRole` reads the unified `useAuth()` wrapper
  (`src/lib/auth/useAuth.ts`), which currently returns
  `usePlaceholderAuth` (always unauthenticated) because
  `AUTH_MODE === "placeholder"`. Every future real route still
  renders the "Protected Route Preview" card today.
- Future real routes under `/client`, `/team`, `/operator`,
  `/owner` are **protected preview shells only** — no session
  check is exercised today, no redirect, no real content.
- **The Supabase Auth wiring exists but is inactive.**
  `useRealAuth` (`src/lib/auth/useRealAuth.ts`) calls
  `getSession` / `onAuthStateChange` / `from("user_profiles")`
  only when `AUTH_MODE === "real"`. While locked to
  `"placeholder"`, none of these calls ever fire.
- **No real sessions, cookies, `localStorage` tokens, or JWTs
  are produced today.** The shared Supabase client is configured
  with `persistSession: false` and `autoRefreshToken: false`;
  see the "Session persistence" note below for the activation
  decision required before flipping `AUTH_MODE`.
- `/auth-status` developer diagnostics page is available and
  renders only safe fields (`AUTH_MODE`, `status`, `isDemoOnly`,
  `role`, `clientId`, `userId`, `email`, `displayName`). **Never
  renders access tokens, refresh tokens, or the raw Supabase
  session.**
- The Supabase frontend client uses the **anon key only**, scoped
  to read-only Client Portal demo data.

## Session persistence — decision made (dev testing)

- **Decision made (May 24, 2026):** The shared Supabase client
  (`src/lib/supabase/client.ts`) now uses
  `{ persistSession: true, autoRefreshToken: true,
  detectSessionInUrl: true }`. Sessions survive page reloads,
  tokens auto-refresh via Supabase's built-in mechanism, and no
  tokens are stored or displayed manually.
- This change was made to support dev auth testing so that a
  successful `/login` remains readable on `/auth-status` after a
  reload.
- Supabase manages session storage internally via `localStorage`.
  No custom token storage was added.
- This decision is recorded in `BUILD_STATUS.md`.

## Before implementing real auth

- [ ] Review `docs/database/auth-draft/` SQL files end to end.
- [ ] Confirm `user_profiles` schema (id, user_id FK to `auth.users`,
      role enum, created_at).
- [ ] Confirm `team_client_assignments` schema (team_user_id,
      client_id, created_at).
- [ ] Confirm production SELECT RLS policy direction matches
      `docs/PRODUCTION_RLS_FINALIZATION_CHECKLIST.md`.
- [ ] Confirm the dev anon read policies currently used by the Client
      Portal demo are **temporary** and not reused in production.
- [ ] Decide **manual user creation** in the Supabase dashboard vs an
      **invite-only flow**. No self-signup from the frontend.
- [ ] Decide the **first test users**:
  - one `client` user
  - one `team` user
  - one `operator` user
  - one `owner` user
- [ ] Confirm route mapping after sign-in:
  - `client`   → `/client/dashboard`
  - `team`     → `/team/tasks`
  - `operator` → `/operator/overview`
  - `owner`    → `/owner/dashboard`
- [ ] Confirm wrong-role behavior on a protected route:
  - redirect to the user's correct role dashboard, **or**
  - show a 403 "not your portal" card.
- [ ] Confirm the **service role key never reaches the frontend**.

## Implementation sequence

1. Apply `user_profiles` and `team_client_assignments` migrations only
   after review.
2. Create test users **manually** in the Supabase dashboard.
3. Insert `user_profiles` rows **manually** for each test user (assign
   role + `client_id` where applicable).
4. Replace `usePlaceholderAuth` with a real Supabase session hook
   (`getSession` + `onAuthStateChange` + `user_profiles` lookup).
5. Wire `RequireRole` to the real session — keep call sites identical.
6. Add protected-route redirects (login redirects to the role's
   dashboard; wrong-role hits the 403/redirect path).
7. Build the **first real `/client/dashboard`** as a read-only page
   reusing the same Supabase queries as the demo, but scoped to the
   authenticated `client_id`.
8. **Remove the production anon read access** before any real client
   data lands.

## Hard stop conditions

- If any **service role key** appears in the frontend bundle, **stop**.
- If real auth is wired **before** production RLS is reviewed and
  applied, **stop**.
- If any **write path** appears before `audit_logs` is in place,
  **stop**.
- If a `/demo/*` route accidentally gets put behind `RequireRole`,
  **stop**.

## Cross-references

- `docs/AUTH_ARCHITECTURE_PLAN.md`
- `docs/PRODUCTION_RLS_FINALIZATION_CHECKLIST.md`
- `docs/FIRST_WRITE_SURFACE_PLAN.md`
- `docs/SAFETY_AUDIT_CHECKLIST.md`
- `docs/database/auth-draft/` (all drafts)
