# Portal Query Safety Checklist

Manual, lightweight check to run before any portal change merges, and
before flipping `AUTH_MODE` from `"placeholder"` to `"real"`. This
checklist is the human-driven equivalent of the future CI grep check
described in `PORTAL_QUERY_SAFETY_PLAN.md`.

`AUTH_MODE` stays `"placeholder"` while this checklist is in force.

## Scope of these checks

These checks apply to the **client-portal data path** — the files
under `artifacts/veroxa/src/` that load data on behalf of a
`client`-role user. They do NOT apply to:

- `src/lib/auth/useRealAuth.ts` and `src/pages/login.tsx`, which read
  `public.user_profiles` to resolve the caller's own row during
  sign-in. That is part of the auth scaffolding for the future
  `AUTH_MODE='real'` flip and is governed by the M001 user_profiles
  RLS policy (self-row only), not by the client-portal view contract.
- `src/lib/supabase/clientPortalQueries.ts` itself, whose top-of-file
  comment block names the forbidden tables for documentation.

The grep commands below pre-scope away those files so the checklist
returns zero matches on a clean repo.

## 1. Forbidden base-table reads — grep checks

From the repo root. Every command MUST produce **zero matches**. A
match means the client-portal data path is reading a sensitive base
table directly and the change must NOT merge.

Authoritative single-line sweep (excludes auth scaffolding + the
documentation comment in `clientPortalQueries.ts`):

```bash
rg -n \
  -g '!src/lib/auth/useRealAuth.ts' \
  -g '!src/pages/login.tsx' \
  -g '!src/lib/supabase/clientPortalQueries.ts' \
  '\.from\(["'\'']?(clients|client_platforms|onboarding_items|client_requests|media_assets|notifications|client_health_snapshots|posts|post_slots|weekly_reports|monthly_reports|draft_variants|draft_sets|content_concepts|ai_agents|activity_logs|team_members|team_client_assignments|user_profiles)["'\'']?\)' \
  artifacts/veroxa/src/
```

(The character class `["'\'']?` matches both single- and double-quoted
table names so renaming with a different quote style does not
silently bypass the check.)

If the sweep prints anything, stop and route the read through the
appropriate `client_portal_*` view (see Section 3).

Per-table form (useful when triaging a single match):

```bash
rg -n '\.from\(["'\'']?<TABLE>["'\'']?\)' artifacts/veroxa/src/
```

Substitute `<TABLE>` with the forbidden table name from the list above.

## 2. Removed library exports — must not return

`src/lib/supabase/index.ts` MUST NOT re-export `getClientDraftVariants`,
`getClientPostSlots`, or `getClientPosts`. They were removed when the
portal was migrated to views-only.

```bash
rg -n \
  -g '!src/lib/supabase/clientPortalQueries.ts' \
  'getClientDraftVariants|getClientPostSlots|getClientPosts\b' \
  artifacts/veroxa/src/
```

Expected: **zero matches**. The exclude flag drops the one allowed
mention — the top-of-file comment block in `clientPortalQueries.ts`
that documents why these helpers were removed.

## 3. Allowed surface — the views that ARE permitted

Every client portal read MUST go through one of these ten views and
nothing else:

| View | What it replaces |
|---|---|
| `client_portal_clients_view`          | `public.clients` |
| `client_portal_platforms_view`        | `public.client_platforms` |
| `client_portal_onboarding_view`       | `public.onboarding_items` |
| `client_portal_requests_view`         | `public.client_requests` |
| `client_portal_media_view`            | `public.media_assets` |
| `client_portal_notifications_view`    | `public.notifications` |
| `client_portal_health_view`           | `public.client_health_snapshots` |
| `client_portal_calendar_view`         | `public.posts` AND `public.post_slots` |
| `client_portal_weekly_reports_view`   | `public.weekly_reports` |
| `client_portal_monthly_reports_view`  | `public.monthly_reports` |

`draft_variants`, `draft_sets`, `content_concepts`, `ai_agents`,
`activity_logs`, `team_members`, `team_client_assignments`, and other
rows of `user_profiles` have **no client-safe view by design** — the
client portal must never read them.

## 4. Confirm no client portal source uses base tables

Visual confirmation after running Section 1: open
`src/lib/supabase/clientPortalQueries.ts` and verify every `.from(...)`
string starts with `client_portal_`. Then open
`src/hooks/useClientPortalData.ts` and verify the `Promise.all` block
references only the six `getClient*` helpers exported from
`@/lib/supabase` — and that `getClientDraftVariants` / `getClientPosts`
/ `getClientPostSlots` no longer appear anywhere.

Finally, confirm:

```bash
rg -n 'AUTH_MODE\s*:\s*AuthMode\s*=' artifacts/veroxa/src/lib/auth/authMode.ts
```

prints exactly one line with `"placeholder"`. If it prints `"real"`,
this checklist MUST have been run and passed in the same commit.

## 4b. Placeholder-mode short-circuit — required

While `AUTH_MODE === "placeholder"` the client portal MUST NOT call
any Supabase helper. The single enforcement point is
`src/hooks/useClientPortalData.ts`, which:

- Imports `AUTH_MODE` from `src/lib/auth/authMode.ts`.
- Initialises `useState` to
  `{ source: "demo", loading: false, error: null, data: DEMO_DATA }`
  synchronously when `AUTH_MODE === "placeholder"` (no transient
  loading flicker, no Supabase awaited).
- Returns early from the `useEffect` body with `if (AUTH_MODE ===
  "placeholder") return;` BEFORE any `Promise.all` of `getClient*`
  helpers is constructed.

Confirm with:

```bash
rg -n 'AUTH_MODE\s*===\s*"placeholder"' artifacts/veroxa/src/hooks/useClientPortalData.ts
```

Expected: **at least two matches** — one in the initial-state
expression, one inside the `useEffect` early return.

Companion rule: `clientPortalQueries` may only target
`client_portal_*` views. Section 1 above is the grep that enforces
this; do not loosen it. The client portal must not call Supabase in
placeholder mode — this short-circuit is the canonical enforcement
point, and any future PR that removes or weakens it must also flip
`AUTH_MODE` to `"real"` in the same commit and pass every other
check in this file.

## 5. When this checklist is mandatory

- Any PR that adds or modifies a file under `artifacts/veroxa/src/`
  that imports from `@/lib/supabase` or calls `getSupabaseClient()`.
- Any PR that proposes flipping `AUTH_MODE` to `"real"`.
- Any PR that lands a new `client_portal_*` view or removes one.

## Cross-references

- `docs/PORTAL_QUERY_SAFETY_PLAN.md` — full contract, allowed/forbidden lists, view rationale.
- `docs/sql_drafts/migrations_review/002_003_004_portal_connect_views_draft.sql` — view definitions for M002 / M003 / M004.
- `docs/sql_drafts/migrations_review/005_reporting_foundation_draft.sql` — view definitions for M005.
- `docs/sql_drafts/migrations_review/005_reports_select_staff_correction_draft.sql` — M005 staff-policy correction.
- `src/lib/supabase/clientPortalQueries.ts` — the only file allowed to call `.from(...)` for client-portal data.
