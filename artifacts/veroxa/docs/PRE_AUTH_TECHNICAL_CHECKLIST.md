# Pre-Auth Technical Checklist

> **Run through every item in this checklist before proposing the
> Real Auth V1 prompt.** Anything unchecked means real auth is not
> ready to wire.

## Before the Real Auth V1 prompt

- [x] `src/lib/auth/authContract.ts` exists and exports
      `VeroxaRole`, `AuthStatus`, `VeroxaSession`, `AuthState`,
      `ROLE_HOME_PATH`, `getRoleHomePath`, `isVeroxaRole`.
- [x] `usePlaceholderAuth` returns the exact `AuthState` shape so
      its future replacement (`useRealAuth`) is a drop-in swap.
- [x] `RequireRole` uses one auth hook (`usePlaceholderAuth`) and
      one role-home-path source (`getRoleHomePath`).
- [x] Future real routes (`/client/*`, `/team/*`, `/operator/*`,
      `/owner/*`) all flow through `RequireRole` via
      `RealRoutePlaceholder`.
- [x] Demo client routes (`/demo/client/*`) remain public preview.
- [x] Internal demo routes (`/demo/team/*`, `/demo/operator/*`,
      `/demo/owner/*`) are documented as **protect-later** in
      [`ROUTE_VISIBILITY_STRATEGY.md`](./ROUTE_VISIBILITY_STRATEGY.md)
      and [`src/lib/demoRoutes.ts`](../src/lib/demoRoutes.ts)
      (`internal_demo_protect_later`).
- [x] Role home paths are centralized in `ROLE_HOME_PATH`.
- [x] Route architecture documented in
      [`ROUTE_ARCHITECTURE.md`](./ROUTE_ARCHITECTURE.md).
- [ ] `user_profiles` draft reviewed
      ([`database/auth-draft/001_auth_user_profiles.sql`](./database/auth-draft/001_auth_user_profiles.sql)).
- [ ] `team_client_assignments` draft reviewed.
- [ ] Production RLS finalization checklist reviewed
      ([`PRODUCTION_RLS_FINALIZATION_CHECKLIST.md`](./PRODUCTION_RLS_FINALIZATION_CHECKLIST.md)).
- [x] **Service role key is NOT in the frontend.** Only
      `VITE_SUPABASE_ANON_KEY` is referenced.
- [x] Client Portal read-only Supabase layer (`useClientPortalData`)
      still works — no behavior change in this pass.
- [x] **No writes exist** — no `INSERT` / `UPDATE` / `DELETE` /
      `UPSERT` calls anywhere in the frontend.
- [x] **No uploads exist** — no `fetch` / `FormData` / Supabase
      Storage SDK usage.

## Manual decision required before

- [ ] Applying any auth SQL.
- [ ] Wiring Supabase Auth (`signInWithPassword`, `getSession`,
      `onAuthStateChange`).
- [ ] Creating real users.
- [ ] Removing anon `SELECT` policies from the dev Supabase
      project.
- [ ] Building the first real client dashboard
      (`/client/dashboard`).

## Cross-references

- [`REAL_MVP_READINESS_PLAN.md`](./REAL_MVP_READINESS_PLAN.md) — the
  end-to-end MVP sequence.
- [`AUTH_ARCHITECTURE_PLAN.md`](./AUTH_ARCHITECTURE_PLAN.md) — the
  auth design.
- [`REAL_AUTH_READINESS_CHECKLIST.md`](./REAL_AUTH_READINESS_CHECKLIST.md)
  — readiness before real auth ships.
- [`NEXT_PROMPT_REAL_AUTH_V1_DRAFT.md`](./NEXT_PROMPT_REAL_AUTH_V1_DRAFT.md)
  — the draft of the next prompt.
