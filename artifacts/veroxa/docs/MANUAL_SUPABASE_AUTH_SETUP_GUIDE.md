# Manual Supabase Auth Setup Guide

> **Audience:** the Veroxa project owner. This guide is run **by hand
> in the Supabase dashboard**, outside Replit, before `AUTH_MODE` can
> be safely flipped to `"real"`. Nothing in Replit applies SQL,
> creates users, or activates auth on your behalf.

## Current state (snapshot)

- `useRealAuth` exists at `src/lib/auth/useRealAuth.ts` and is fully
  wired (`getSession` + `onAuthStateChange` + `user_profiles` lookup)
  but **inactive** today.
- `AUTH_MODE` (`src/lib/auth/authMode.ts`) is **locked to
  `"placeholder"`**.
- `/login` real sign-in path is gated behind `AUTH_MODE === "real"`
  and never fires today.
- `RequireRole` reads the unified `useAuth()` wrapper
  (`src/lib/auth/useAuth.ts`), which currently returns
  `usePlaceholderAuth` (always unauthenticated).
- **No real auth is active. No users have been created by code. No
  SQL has been applied by the app.**

## Manual Supabase steps

Run these in order. Do **not** skip steps. Do **not** apply
production RLS unless explicitly approved separately.

### 1. Confirm the Supabase project

- [ ] You are signed into the **dev** Supabase project — not
      production.
- [ ] `VITE_SUPABASE_URL` exists in Replit Secrets and points at the
      dev project.
- [ ] `VITE_SUPABASE_ANON_KEY` exists in Replit Secrets and is the
      anon key (NOT the service role key).
- [ ] **No service role key** is present in the frontend or in
      Replit Secrets accessible to the frontend build.

### 2. Review draft SQL before applying anything

Read these end-to-end first. Do not paste them yet.

- `docs/database/auth-draft/001_auth_user_profiles.sql`
- `docs/database/auth-draft/003_team_assignment_schema_draft.sql`
- `docs/database/auth-draft/002_production_rls_policy_draft.sql`

### 3. Apply only after manual approval

- [ ] Apply `user_profiles` (`001_auth_user_profiles.sql`) to the
      dev Supabase project via the Supabase SQL editor.
- [ ] Apply `team_client_assignments`
      (`003_team_assignment_schema_draft.sql`) **only if** you plan
      to exercise the team-test flow in this round.
- [ ] **Do NOT apply** `002_production_rls_policy_draft.sql` unless
      it has been separately approved. Anon read policies must stay
      in place for the Client Portal demo until production cutover.

### 4. Create test users manually in the Supabase Auth dashboard

Recommended placeholder emails (substitute real / safe test emails
as you prefer — these are examples only):

- `owner@veroxa.test`
- `operator@veroxa.test`
- `team@veroxa.test`
- `client@veroxa.test`

Use Supabase Dashboard → Authentication → Users → "Add user". Use
strong, unique passwords. Save them in a password manager — do not
paste them into Replit chat.

### 5. Add matching `user_profiles` rows manually

For **each** test user, insert one row into `user_profiles` via the
Supabase SQL editor or Table editor:

| Column      | Owner            | Operator         | Team             | Client                       |
| ----------- | ---------------- | ---------------- | ---------------- | ---------------------------- |
| `user_id`   | Supabase auth id | Supabase auth id | Supabase auth id | Supabase auth id             |
| `email`     | owner email      | operator email   | team email       | client email                 |
| `role`      | `owner`          | `operator`       | `team`           | `client`                     |
| `client_id` | `NULL`           | `NULL`           | `NULL`           | the test client's `id`       |
| `is_active` | `true`           | `true`           | `true`           | `true`                       |

- [ ] All four rows inserted.
- [ ] `user_id` values match `auth.users.id` exactly.
- [ ] `role` values match the `veroxa_user_role` enum spelling.

### 6. Confirm client test data

- [ ] At least one client row exists in the `clients` table that
      the Client Portal demo already reads from.
- [ ] The `client` test user's `user_profiles.client_id` points at
      that client's `id`.
- [ ] That client has enough rows in `platforms` / `media_assets` /
      `posts` / etc. that the Client Portal renders something
      recognisable after sign-in.

### 7. Do not remove anon read policies yet

The current Client Portal demo still depends on the **dev anon read
policies**. Removing them now will break `/demo/client/*`. Anon read
removal is a **separate, later** step — driven by
`docs/PRODUCTION_RLS_FINALIZATION_CHECKLIST.md` — that happens only
just before real production client data lands.

## After this guide is done

Move on to:

1. [`AUTH_TEST_USER_MATRIX.md`](./AUTH_TEST_USER_MATRIX.md) — what
   each test user should and should not see.
2. [`AUTH_QA_CHECKLIST.md`](./AUTH_QA_CHECKLIST.md) — pre-flip and
   post-flip QA.
3. [`AUTH_ROLLBACK_PLAN.md`](./AUTH_ROLLBACK_PLAN.md) — how to fall
   back safely if anything misbehaves.
4. [`AUTH_MODE_SWITCH_PLAN.md`](./AUTH_MODE_SWITCH_PLAN.md) — the
   small dedicated prompt that flips `AUTH_MODE` to `"real"`.

Until every box above is ticked, **`AUTH_MODE` must stay
`"placeholder"`**.
