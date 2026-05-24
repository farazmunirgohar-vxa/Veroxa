# Veroxa Safety Audit Checklist

This is the living list of what the Veroxa frontend is and is **not**
allowed to do today, and what must be true **before** real auth or real
uploads ship.

If any of the "forbidden" items below appears in the codebase, treat it as
a regression and stop.

## Currently forbidden in the codebase

- ❌ No Supabase Auth calls (`signIn`, `signInWithPassword`,
  `signInWithOtp`, `getSession`, `onAuthStateChange`, `signOut`, etc.).
- ❌ No real sessions / JWTs / cookies / `localStorage` tokens.
- ❌ No service role key in the frontend (anon key only, scoped to
  read-only Client Portal data).
- ❌ No `INSERT` / `UPDATE` / `DELETE` / `UPSERT` Supabase calls in any
  page, hook, or lib.
- ❌ No `fetch` / `FormData` / upload flow.
- ❌ No Supabase Storage uploads, no buckets configured.
- ❌ No AI API calls (OpenAI, Anthropic, Gemini, OpenRouter, etc.).
- ❌ No publishing integrations (Instagram, Facebook, TikTok, etc.).
- ❌ No Google Business Profile writes.
- ❌ No real credentials, OAuth client secrets, or third-party API keys
  committed.

## Currently allowed in the codebase

- ✅ Anon read-only Supabase `SELECT` for the Client Portal demo
  (`/demo/client/*`), with a static fallback if Supabase is unreachable.
- ✅ Static demo data for Team / Operator / Owner portals.
- ✅ Local React component state for `/demo/client/onboarding` and
  `/demo/client/media` (form fields, selected file names — never
  uploaded).
- ✅ Draft SQL and planning docs under `docs/database/auth-draft/`,
  `docs/database/write-draft/`, `docs/database/onboarding-draft/`, and
  `docs/database/media-draft/` — **none applied**.
- ✅ Future-route placeholder shells under `/client/*`, `/team/*`,
  `/operator/*`, `/owner/*` that always render the `RequireRole`
  "Protected Route Preview" card (no real session check, no redirect).

## Before real auth ships

- [ ] Confirm the current dev Supabase anon SELECT policies are **not**
      reused as production policies.
- [ ] Apply `auth-draft/001_user_profiles_draft.sql` only after review.
- [ ] Decide and apply the final production SELECT RLS
      (`auth-draft/002_production_rls_policy_draft.sql`), including the
      client-scoped team policies via `team_client_assignments`.
- [ ] Create test users manually in the Supabase dashboard (no
      auto-signup from the frontend).
- [ ] Test role isolation: a `client` cannot see another client's rows;
      a `team` user cannot see unassigned clients' rows; etc.
- [ ] Confirm the **service role key never enters the frontend bundle**
      (only used server-side, if at all).
- [ ] Replace `usePlaceholderAuth` with the real session hook before any
      `/client/*`, `/team/*`, `/operator/*`, or `/owner/*` route is told
      to render content.

## Before real writes ship

- [ ] `audit_logs` table applied (see
      `docs/database/write-draft/002_audit_log_draft.sql`).
- [ ] Every write goes through a server-side function that also writes
      the matching `audit_logs` row.
- [ ] Priority 1 write surfaces (status flips, mark-as-read) reviewed
      and approved first.
- [ ] Priority 2 / 3 write surfaces only after Priority 1 is stable.
- [ ] Priority 4 (publishing, GBP writes, AI generation, automated
      scheduling, billing) is **explicitly excluded** from the first
      write phase.

## Before real uploads ship

- [ ] Storage bucket `veroxa-client-media` created **private**.
- [ ] Storage policies reviewed and applied per
      `docs/database/media-draft/001_media_storage_plan.md`.
- [ ] File type validation enforced on the server (MIME allow-list).
- [ ] File size validation enforced on the server (per-kind limits).
- [ ] Server-issued, short-lived signed URLs for reads — no public
      bucket, no long-lived URLs persisted.
- [ ] `audit_logs` row written on every upload.
- [ ] Malware / content moderation strategy considered before real
      production traffic.

## Cross-cutting

- [ ] `docs/BUILD_STATUS.md` reflects current state.
- [ ] `docs/AUTH_ARCHITECTURE_PLAN.md` reflects the latest auth /
      placeholder decisions.
- [ ] `docs/FIRST_WRITE_SURFACE_PLAN.md` reflects current write priorities
      and what is still demo-only.
- [ ] `src/lib/supabase/README.md` reflects current frontend Supabase
      access (read-only) and links to all draft directories.
