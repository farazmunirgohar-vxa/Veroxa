# Real Auth Implementation Readiness Checklist

> **Docs only.** Nothing in this checklist is wired up. The Veroxa frontend
> still uses placeholder auth and read-only Supabase access for the Client
> Portal demo. Real authentication is not implemented.

## Current state

- `/login` is **demo role routing** plus a future sign-in UI shell. The
  password field is decorative and never submitted anywhere.
- `RequireRole` uses `usePlaceholderAuth`, which always returns
  unauthenticated. Every future real route renders the "Protected Route
  Preview" card.
- Future real routes under `/client`, `/team`, `/operator`, `/owner` are
  **protected preview shells only** — no session check, no redirect, no
  real content.
- **No Supabase Auth is connected.** No `signInWithPassword`,
  `signInWithOtp`, `getSession`, `onAuthStateChange`, or `signOut` calls
  exist anywhere in the frontend.
- **No real sessions, cookies, `localStorage` tokens, or JWTs exist.**
- The Supabase frontend client uses the **anon key only**, scoped to
  read-only Client Portal demo data.

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
