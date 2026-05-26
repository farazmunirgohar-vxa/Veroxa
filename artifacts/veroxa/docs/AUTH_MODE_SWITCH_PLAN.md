# Auth Mode Switch Plan

> Defines exactly what the future small "flip `AUTH_MODE` to real"
> prompt will and will not do. **That prompt is not this one.** This
> document is the contract that prompt must honor.

## Current value

```ts
// src/lib/auth/authMode.ts
export const AUTH_MODE: AuthMode = "placeholder";
```

## Future switch

Change one line:

```ts
export const AUTH_MODE: AuthMode = "real";
```

That is the entirety of the code change for the flip prompt. Any
additional behavior (sign-out button, post-login redirect, 403 vs
redirect on wrong role) lands in **separate** follow-up prompts.

## Before the switch (prerequisites)

- [ ] Manual Supabase Auth setup complete per
      [`MANUAL_SUPABASE_AUTH_SETUP_GUIDE.md`](./MANUAL_SUPABASE_AUTH_SETUP_GUIDE.md).
- [ ] `user_profiles` table applied to the dev Supabase project.
- [ ] Four test users created in Supabase Auth (owner, operator,
      team, client) per
      [`AUTH_TEST_USER_MATRIX.md`](./AUTH_TEST_USER_MATRIX.md).
- [ ] Four matching `user_profiles` rows inserted.
- [ ] Wrong-role behavior decision (403 vs redirect) locked.
- [ ] Session-persistence decision (`persistSession` /
      `autoRefreshToken` on the shared Supabase client) locked. See
      [`REAL_AUTH_READINESS_CHECKLIST.md`](./REAL_AUTH_READINESS_CHECKLIST.md)
      → "Session persistence — activation decision".
- [ ] [`AUTH_QA_CHECKLIST.md`](./AUTH_QA_CHECKLIST.md) "Before
      switching" section fully ticked.
- [ ] [`AUTH_ROLLBACK_PLAN.md`](./AUTH_ROLLBACK_PLAN.md) reviewed
      and the owner knows how to flip back.

## During the switch — explicit scope

The switch prompt may:

- [x] Change `AUTH_MODE` from `"placeholder"` to `"real"`.

The switch prompt **must not**:

- [ ] Refactor any unrelated file.
- [ ] Add writes (`insert` / `update` / `delete` / `upsert`).
- [ ] Add uploads or Supabase Storage.
- [ ] Add publishing, AI, automation, or Google integrations.
- [ ] Remove dev anon read policies.
- [ ] Protect any `/demo/*` route.
- [ ] Add a sign-out button (separate prompt).
- [ ] Add a post-login redirect (separate prompt).
- [ ] Change the shared Supabase client's `persistSession` /
      `autoRefreshToken` config without explicit approval in the
      prompt body.

## After the switch

- [ ] Visit `/auth-status` signed out — confirm `AUTH_MODE: real`,
      `status: unauthenticated`, `isDemoOnly: false`. No tokens
      shown.
- [ ] Sign in via `/login` with each test user; verify
      `/auth-status` reflects the correct `role` and (for the client
      user) `clientId`.
- [ ] Visit a future real route (e.g. `/client/dashboard`) while
      signed in as the matching role — confirm `RequireRole` allows
      it; while signed in as the wrong role — confirm the behavior
      matches the locked-in wrong-role decision.
- [ ] Re-run the regression checks in
      [`AUTH_QA_CHECKLIST.md`](./AUTH_QA_CHECKLIST.md) — `/demo/*`
      must still work identically.

## Important

**Switching `AUTH_MODE` is a separate small prompt, not part of any
larger prep, refactor, or feature work.** Bundling it with anything
else makes rollback noisy and review hard. Keep the diff to one
line.

---

## Demo internal access gate (placeholder mode)

**Added:** Team, Operator, and Owner demo portals now require a
demo-only access code when `AUTH_MODE === "placeholder"`.

- Access code: `veroxa-preview` (demo only — not a real credential)
- Granted access is stored in `localStorage` under the key
  `veroxa_demo_internal_access`. Persists across refreshes until
  cleared.
- A "Clear demo access" button appears inside the portal for easy
  reset.
- Client Portal (`/demo/client/*`) remains fully public — no gate.
- This is NOT real authentication. It does not touch Supabase, does
  not call any API, and does not store passwords.
- When `AUTH_MODE` is switched to `"real"`, `InternalDemoGuard`
  ignores the localStorage key entirely and falls through to the
  real-auth path (Supabase session check, role match, wrong-role
  redirect).
