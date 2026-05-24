# Draft — Next Prompt: Real Supabase Auth V1

> **This file is a draft of the next prompt.** It is **not** an
> instruction to execute now. Real Supabase Auth will only ship
> after explicit manual approval from the project owner.

## Title

**Real Supabase Auth V1 — session read only, no writes.**

## Hard warnings to keep in the eventual prompt

- **Do not apply SQL** unless the user explicitly says so in that
  prompt.
- **Do not create users automatically.** Existing users must be
  provisioned by the owner.
- **Do not add writes.** No `INSERT` / `UPDATE` / `DELETE` /
  `UPSERT`.
- **Do not protect `/demo/client/*`.** The client demo remains a
  public sales surface.
- **Do not protect internal demo routes yet.** Protection lands
  separately per
  [`INTERNAL_DEMO_PROTECTION_PLAN.md`](./INTERNAL_DEMO_PROTECTION_PLAN.md).
- **Do not remove anon read policies yet.** That lands when real
  client data is about to enter Supabase, per
  [`PRODUCTION_RLS_FINALIZATION_CHECKLIST.md`](./PRODUCTION_RLS_FINALIZATION_CHECKLIST.md).
- **Do not expose the service role key.** Frontend uses only
  `VITE_SUPABASE_ANON_KEY`.

## Scope of the future prompt

- Install / confirm the Supabase auth client (only if it isn't
  already part of the existing Supabase package).
- Create a real auth hook (`useRealAuth` or replace
  `usePlaceholderAuth`'s body) using `getSession` +
  `onAuthStateChange`.
- Read the authenticated user's row from `user_profiles` to resolve
  `role`, `clientId`, `displayName`.
- Return the **same `AuthState`** defined in
  [`src/lib/auth/authContract.ts`](../src/lib/auth/authContract.ts).
- Keep every `RequireRole` call site **unchanged** — the only thing
  swapping is the hook implementation.
- The existing `/login` form may begin calling
  `signInWithPassword` **only in this future phase**.
- **Still no writes, no uploads, no Supabase Storage.**

## Out of scope for that future prompt

- Real onboarding write surface (separate prompt, gated by
  [`FIRST_WRITE_SURFACE_PLAN.md`](./FIRST_WRITE_SURFACE_PLAN.md)).
- Real media uploads.
- AI agent wiring.
- GBP / publishing integrations.
- Removing anon `SELECT` from dev Supabase.

## Pre-flight before running that prompt

Confirm every checked item in
[`PRE_AUTH_TECHNICAL_CHECKLIST.md`](./PRE_AUTH_TECHNICAL_CHECKLIST.md)
is still true, plus the unchecked ones become checked:

- `user_profiles` SQL draft reviewed.
- `team_client_assignments` SQL draft reviewed.
- Production RLS finalization checklist reviewed.

**Only then propose Real Auth V1.**
