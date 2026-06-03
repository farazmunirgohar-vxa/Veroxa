# Auth Rollback Plan

> What to do if real auth misbehaves after `AUTH_MODE` is flipped to
> `"real"`. The goal is **safe rollback**, not panic deletion.

## If real auth breaks

Run these steps in order. Stop as soon as the app is back to a
known-good state.

1. **Flip `AUTH_MODE` back to `"placeholder"`** in
   `src/lib/auth/authMode.ts`. This single change re-routes
   `useAuth()` to `usePlaceholderAuth`, disables the gated
   `signInWithPassword` path on `/login`, and returns every future
   real route to the protected-preview shell.
2. **Confirm `/demo/*` still works.** Open
   `/demo/client/dashboard`; deprecated/legacy `/demo/team/tasks` is not active,
   `/demo/operator/overview`, `/demo/owner/dashboard`. None should
   regress because demo routes were never gated.
3. **Confirm future real routes show the protected preview again.**
   Visit `/client/dashboard`, `/team/tasks`, `/operator/overview`,
   `/owner/dashboard` while signed out — each should render the
   `RequireRole` preview card.
4. **Do not delete the test users** in Supabase Auth unless you
   intend to recreate them — they are cheap to keep, and deleting
   them loses the IDs that `user_profiles.user_id` points at.
5. **Do not drop the auth tables** (`user_profiles`,
   `team_client_assignments`) unless removal is explicitly planned
   in a separate doc. They are inert without `AUTH_MODE === "real"`.
6. **Check the browser console** for warnings from `useRealAuth`
   (e.g. `[useRealAuth] Failed to read user_profiles`,
   `No matching user_profiles row or invalid role`). These narrow
   the problem to "table missing", "row missing", "wrong role
   value", or "Supabase env missing".
7. **Review the `user_profiles` lookup in `useRealAuth.ts`.** The
   hook joins `select("user_id, role, client_id, display_name")
   .eq("user_id", session.user.id).maybeSingle()`. If a profile is
   missing or `role` is not one of `client | team | operator |
   owner`, the hook returns unauthenticated by design.
8. **Confirm Vercel environment variables / local env.** `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` must be present. **No service role
   key.**
9. **Confirm `user_profiles.user_id` values match `auth.users.id`
   exactly.** A common manual-setup mistake is pasting an email
   instead of the UUID, or a UUID from a deleted user.

## Rollback principles

- **Never panic-delete database tables.** Real client data has not
  landed yet; auth tables are inert until `AUTH_MODE === "real"`.
- **Keep demo route access stable.** `/demo/*` must not regress
  during rollback — it is the customer-facing demo surface.
- **Keep anon read policies in dev** until production RLS
  replacement is approved per
  `PRODUCTION_RLS_FINALIZATION_CHECKLIST.md`. Removing them mid-
  rollback will silently break the Client Portal demo.
- **Do not expose the service role key** in the frontend to "fix"
  an auth issue. There is no auth issue that justifies it.
- **Do not bypass RLS with frontend code.** RLS lives in Supabase;
  the frontend uses the anon key only.

## After rollback

- Capture what failed in `BUILD_STATUS.md` as a dated note (e.g.
  "Real auth flip rolled back on YYYY-MM-DD — root cause: …").
- Update
  [`AUTH_QA_CHECKLIST.md`](./AUTH_QA_CHECKLIST.md) with any new
  check that would have caught the regression.
- Only re-attempt the flip after the failing condition is
  reproducibly fixed in the dev Supabase project.
