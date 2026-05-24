# Auth QA Checklist

> Three checklists used around the `AUTH_MODE` flip. Run the
> **"Before switching"** list before the dedicated switch prompt is
> issued, the **"After switching"** list immediately after, and the
> **regression + security** lists in both passes.

## Before switching `AUTH_MODE` to `"real"`

- [ ] `useRealAuth` exists at `src/lib/auth/useRealAuth.ts`.
- [ ] `useAuth` wrapper exists at `src/lib/auth/useAuth.ts`.
- [ ] `AUTH_MODE` in `src/lib/auth/authMode.ts` is currently
      `"placeholder"`.
- [ ] `RequireRole` (`src/components/auth/RequireRole.tsx`) reads
      `useAuth()`, not `usePlaceholderAuth()` directly.
- [ ] `authContract.ROLE_HOME_PATH` matches the
      [`AUTH_TEST_USER_MATRIX.md`](./AUTH_TEST_USER_MATRIX.md) "Expected
      home path" column.
- [ ] `user_profiles` table is applied manually in the dev Supabase
      project (per
      [`MANUAL_SUPABASE_AUTH_SETUP_GUIDE.md`](./MANUAL_SUPABASE_AUTH_SETUP_GUIDE.md)).
- [ ] All four test users are created manually in Supabase Auth.
- [ ] All four `user_profiles` rows are inserted manually (correct
      `user_id`, `role`, `client_id` where applicable, `is_active`).
- [ ] **No service role key** is anywhere in the frontend code or
      build env.
- [ ] No write operations (`insert` / `update` / `delete` /
      `upsert`) exist in the frontend.
- [ ] Demo routes (`/demo/*`) are still public — no protection
      added.
- [ ] Dev anon read policies are still intentionally present (they
      back the Client Portal demo).
- [ ] Session-persistence decision for `src/lib/supabase/client.ts`
      has been made — either accept current `persistSession: false`
      or change it. See
      [`REAL_AUTH_READINESS_CHECKLIST.md`](./REAL_AUTH_READINESS_CHECKLIST.md)
      → "Session persistence — activation decision".

## After switching `AUTH_MODE` to `"real"` (later)

- [ ] Unauthenticated visit to `/client/dashboard` shows the
      protected / unauthenticated state — no crash.
- [ ] Sign in with `owner@veroxa.test` succeeds via `/login`.
- [ ] Sign in with `operator@veroxa.test` succeeds via `/login`.
- [ ] Sign in with `team@veroxa.test` succeeds via `/login`.
- [ ] Sign in with `client@veroxa.test` succeeds via `/login`.
- [ ] `/auth-status` reflects the signed-in user but **never**
      displays access tokens, refresh tokens, or the raw Supabase
      session.
- [ ] `role` shown on `/auth-status` matches the value in
      `user_profiles`.
- [ ] `clientId` appears on `/auth-status` for the `client` user
      only — `—` for owner / operator / team.
- [ ] Signing in as a user whose `user_profiles` row is missing or
      has an invalid role does **not** crash the app — falls back to
      unauthenticated with `console.warn` only.
- [ ] Sign-out (if/when implemented) returns the user to
      unauthenticated state cleanly.
- [ ] Demo routes still work for everyone (signed in or not).

## Regression checks (run both before and after the flip)

- [ ] `/demo/client/dashboard` still works with the Client Portal
      read-only Supabase + static fallback.
- [ ] `/demo/client/media` still works.
- [ ] `/demo/team/tasks` still works during development.
- [ ] `/login` demo role cards still route to `/demo/*` correctly.
- [ ] Client Portal read-only Supabase demo data still renders.
- [ ] No new write functions were introduced anywhere in the
      frontend.

## Security checks (always run)

- [ ] No service role key anywhere in the frontend.
- [ ] No access / refresh token rendered in any page (including
      `/auth-status`).
- [ ] No tokens logged via `console.log` / `console.warn` /
      `console.error`.
- [ ] No custom `localStorage` token handling — Supabase Auth
      handles storage internally.
- [ ] No cookies set or read manually for auth.
- [ ] No frontend code creates Supabase Auth users.
