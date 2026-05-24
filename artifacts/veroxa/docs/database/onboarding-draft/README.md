# `onboarding-draft/`

Planning-only directory for the **future** client-onboarding write surface.

## Status

- **No SQL in this directory is applied.** Nothing in here runs against any
  Supabase environment.
- `/demo/client/onboarding` (`src/pages/client-onboarding.tsx`) uses **local
  component state only** — no Supabase reads or writes, no API calls, no
  uploads, no `localStorage`, no cookies. Submit shows
  "Demo only — onboarding is not saved yet."
- The Supabase frontend access layer remains anon read-only for the Client
  Portal demo only.

## What's in here

| File | Purpose |
| --- | --- |
| `001_onboarding_answer_payload_draft.md` | Locks down the JSON shape of `onboarding_items.answer_payload` against the six demo sections. |
| `002_onboarding_items_extension_draft.sql` | Draft ALTER + CHECK + RLS direction for the future onboarding write surface. **Commented; do not apply.** |

## Prerequisites before any of this ships

In order:

1. Real Supabase Auth wired (`signInWithPassword` / session listener).
2. `user_profiles` + `veroxa_user_role` enum applied (see `auth-draft/`).
3. `team_client_assignments` applied (see `auth-draft/`).
4. Production SELECT RLS reviewed and applied (see `auth-draft/`).
5. `audit_logs` table applied (see `write-draft/002_audit_log_draft.sql`).
6. First write surfaces — Priority 1 / 2 — proven safe (see
   `docs/FIRST_WRITE_SURFACE_PLAN.md`).

Only **after** those steps should onboarding saves be considered.

## Priority

Onboarding answer saves are **Priority 3 — client-facing writes** in
`docs/FIRST_WRITE_SURFACE_PLAN.md`. They introduce the client role as a
writer and must land **after** Priority 1 / 2 + audit logs are stable.
