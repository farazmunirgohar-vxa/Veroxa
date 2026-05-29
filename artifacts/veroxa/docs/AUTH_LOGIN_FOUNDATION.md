# Veroxa — Real Client/Team Login Foundation

**Date:** 2026-05-29
**Status:** Placeholder mode active. Real Supabase auth wired but inactive.
`AUTH_MODE === "placeholder"` in `src/lib/auth/authMode.ts`.

---

## 1. Auth files reviewed

| File | Purpose | Status |
|---|---|---|
| `src/lib/auth/authMode.ts` | Single toggle: `"placeholder"` or `"real"` | `"placeholder"` — locked |
| `src/lib/auth/authContract.ts` | Role types, session shape, `ROLE_HOME_PATH`, `DEMO_ROLE_HOME_PATH` | Clean, updated |
| `src/lib/auth/types.ts` | Backward-compat re-exports of `authContract` types | Clean |
| `src/lib/auth/devCredentials.ts` | Temp dev login matcher for placeholder mode | Client + Team only; operator/owner return `/login` |
| `src/lib/auth/useAuth.ts` | Unified hook — selects placeholder vs real on `AUTH_MODE` | Clean |
| `src/lib/auth/usePlaceholderAuth.ts` | Always returns `unauthenticated`. No network. No Supabase. | Active today |
| `src/lib/auth/useRealAuth.ts` | Full Supabase session reader — `getSession` + `onAuthStateChange` + `user_profiles` join | Wired, **inactive** |
| `src/components/auth/InternalDemoGuard.tsx` | Protects `/team/*` routes | Placeholder: passes team through. Real: enforces session + role. |
| `src/components/auth/RequireRole.tsx` | Placeholder card for future real protected routes | Not used in App.tsx today |
| `src/components/auth/RouteGuard.tsx` | Generic role guard (future use) | Not wired into App.tsx |
| `src/pages/login.tsx` | Two-mode login: dev credentials (placeholder) / Supabase (real) | Clean, no dev credentials exposed in UI |

---

## 2. Current placeholder behavior

```
AUTH_MODE = "placeholder"
```

**Public flow:**
- Website visitor → any public page
- "Demo Preview" in nav/CTAs → `/demo/client/dashboard` (public, no login)

**Login flow (placeholder):**
1. User enters email + password on `/login`
2. `validateDevCredentials()` checks against `devCredentials.ts` (no network)
3. Match → route to `/client/dashboard` or `/team/dashboard`
4. No match → show "Invalid development credentials."
5. Operator/owner credentials removed — returns `/login`

**Dev credentials (placeholder mode only, never shown in UI):**
- `faraz@client.com` / `farazclient` → `/client/dashboard`
- `faraz@team.com` / `farazteam` → `/team/dashboard`

**Route protection:**
- `/client/*` — **public, no guard** (demo preview accessible without login)
- `/team/*` — behind `InternalDemoGuard(role="team")` — placeholder mode passes through
- `/demo/client/dashboard` — public alias for client portal preview
- `/demo` — developer hub (not the public Demo Preview landing)
- Operator/owner — parked, no routes

**No real sessions, tokens, cookies, JWTs, or Supabase Auth calls fire today.**

---

## 3. Future real auth behavior (when `AUTH_MODE` flips to `"real"`)

**Login flow (real):**
1. `supabase.auth.signInWithPassword({ email, password })`
2. `getSession()` → read `user_id`
3. `from("user_profiles").select("role").eq("user_id", userId)`
4. Validate role with `isVeroxaRole()`
5. Redirect to `getRoleHomePath(role)`:
   - `client` → `/client/dashboard`
   - `team` → `/team/dashboard`
   - `operator` → `/operator/overview` *(parked — no route yet)*
   - `owner` → `/owner/dashboard` *(parked — no route yet)*

**Session persistence:** Supabase client has `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true` — sessions survive reloads, tokens auto-refresh via Supabase internals. No manual token storage.

**Route protection (real mode):**
- `/client/*` — still public until real client scoping is built
- `/team/*` — `InternalDemoGuard` enforces Supabase session with `team` role
- Wrong-role redirect → `getRoleHomePath(currentRole)` (correct portal for that role)

**No service-role key.** Only `VITE_SUPABASE_ANON_KEY` is used in the frontend.
**No writes.** `useRealAuth` is SELECT-only from `user_profiles`.

---

## 4. Role routing contract

| Role | Placeholder login | Real login | Real route guard |
|---|---|---|---|
| `client` | `/client/dashboard` | `/client/dashboard` | Public for now; add `RequireRole` when client scoping is built |
| `team` | `/team/dashboard` | `/team/dashboard` | `InternalDemoGuard(role="team")` — already active |
| `operator` | `/login` (parked) | `/operator/overview` (parked) | Not built yet |
| `owner` | `/login` (parked) | `/owner/dashboard` (parked) | Not built yet |

**Role label convention:** Client, Team, Operator, Owner. Not "Admin", not "Execution", not "Super Admin".

---

## 5. What remains unsafe / not yet live

- **Client route protection** — `/client/*` is currently public. Real client scoping (one client can only see their own data, not `demo-a`) requires:
  - Confirmed `clientId` from `user_profiles`
  - Supabase RLS policies on all client-facing tables
  - `RequireRole` + `clientId` check on every `/client/*` route
- **RLS not finalized** — production RLS policies must be reviewed before any real client data lands. Current read policies are demo-only.
- **No test users** — `user_profiles` table has not been applied to Supabase; no test accounts exist.
- **Operator/Owner portals** — parked, no routes, no pages.
- **No sign-out** — no sign-out button exists anywhere. Supabase sessions persist until they expire.
- **No password reset** — no reset flow exists.
- **No invite flow** — no user registration from the frontend.

---

## 6. Auth readiness checklist (before flipping `AUTH_MODE` to `"real"`)

See `docs/AUTH_MODE_SWITCH_PLAN.md` for the gating contract.

**Supabase setup (manual):**
- [ ] `user_profiles` table applied (`database/auth-draft/001_auth_user_profiles.sql` reviewed)
- [ ] `team_client_assignments` table applied
- [ ] Test users created manually in Supabase Auth dashboard:
  - 1× `client` role user (with `client_id = "demo-a"` or real client)
  - 1× `team` role user
- [ ] `user_profiles` rows inserted for each test user
- [ ] Production SELECT RLS finalized (`PRODUCTION_RLS_FINALIZATION_CHECKLIST.md`)
- [ ] Dev/demo anon read policies confirmed temporary (not reused for production data)

**Code gates (already satisfied):**
- [x] `useRealAuth` wired and ready
- [x] `useAuth` unified wrapper active
- [x] `InternalDemoGuard` enforces real session in real mode
- [x] Login `signInWithPassword` path wired
- [x] `ROLE_HOME_PATH` centralized in `authContract.ts`
- [x] No service-role key in frontend
- [x] No writes in frontend
- [x] Operator/owner credentials removed from `devCredentials.ts`
- [x] `/demo/client/dashboard` remains public — demo preview is safe

**Hard stops:**
- If any service-role key appears in the frontend bundle → **stop**
- If real auth is activated before production RLS is applied → **stop**
- If client routes are locked before client-scoped queries are built → **stop**

---

## 7. Next step after this foundation pass

The single immediate next step before real auth can go live is:

> **Supabase Auth setup** — apply `user_profiles`, create test users,
> insert `user_profiles` rows. Then flip `AUTH_MODE` to `"real"` in a
> one-line prompt (see `AUTH_MODE_SWITCH_PLAN.md`).

After that, in order:
1. Build a sign-out button (team portal first)
2. Add `clientId`-scoped queries to `/client/*` routes
3. Apply RLS and remove demo anon read access
4. Add `RequireRole` guard to `/client/*`
5. Build operator/owner portals (separate phase)

---

## 8. Cross-references

- `src/lib/auth/authMode.ts` — the one-line toggle
- `src/lib/auth/authContract.ts` — role types + home paths
- `src/lib/auth/useRealAuth.ts` — full Supabase hook (inactive)
- `src/lib/supabase/client.ts` — anon key only, session persistence on
- `docs/AUTH_MODE_SWITCH_PLAN.md` — gating contract for the flip
- `docs/MANUAL_SUPABASE_AUTH_SETUP_GUIDE.md` — manual Supabase prep steps
- `docs/AUTH_TEST_USER_MATRIX.md` — per-role test user plan
- `docs/AUTH_QA_CHECKLIST.md` — pre/post-flip QA
- `docs/AUTH_ROLLBACK_PLAN.md` — how to revert
- `docs/REAL_AUTH_READINESS_CHECKLIST.md` — original readiness checklist
- `docs/PRE_AUTH_TECHNICAL_CHECKLIST.md` — technical pre-auth gates
