# Migration 005 — Reporting Foundation: Planning Document

**Status:** Planning only — no SQL draft yet. `AUTH_MODE` remains
`"placeholder"`. No AI content generation, no PDF exports, no payment
reporting, no financial snapshots, no AI agents, no automation jobs,
no background workers.

---

## 1. Purpose

M005 introduces the reporting foundation on top of the identity,
clients, media, and posting layers shipped in M001–M004. It adds two
report tables — `weekly_reports` and `monthly_reports` — plus the
two client-safe views that surface published reports to the client
portal.

This is the first migration in the series whose primary consumer is
the **client portal**, not the team / operator queues. The shape of
the tables and views is therefore driven by what is and is not safe
for a client to ever see.

### Dependency

M005 depends on **M001** (identity + helpers), **M002** (clients +
team_client_assignments + `can_view_client` / `can_manage_client_operations`),
**M003** (media + audit), and **M004** (`posts` — required for
`weekly_reports.top_post_id`). Must not apply before all four are
green.

### Scope

Included:
- `weekly_reports`
- `monthly_reports`
- RLS + per-role policies on both
- Indexes on both
- Two client-safe views:
  - `client_portal_weekly_reports_view`
  - `client_portal_monthly_reports_view`

**Explicitly NOT in scope** (deferred or out of all SQL migrations):
- AI content generation (report narrative, summaries, copy) — separate AI track
- PDF / image / slide exports of reports — separate export track
- Payment reporting, billing, invoices — separate payments track
- `financial_snapshots`, revenue rollups — separate analytics track
- `ai_agents`, agent workflow tables — M006
- `content_concepts`, `draft_sets`, `draft_variants` — M006
- Automation jobs, schedulers, cron, background workers — orchestrated separately
- Real publishing integrations — M008+
- Notifications about report state — uses the existing `notifications` table from M003; no new column or trigger added in this migration
- Any change to `AUTH_MODE`, auth wiring, portal navigation, or pricing

---

## 2. Tables

### 2.1 `weekly_reports`

One row per client per ISO week. Drafted by team, validated by team or
operator, published by operator. Clients only ever see published rows,
and even then only through the client-safe view.

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid pk default gen_random_uuid()` | |
| `client_id` | `uuid not null references clients(id) on delete cascade` | |
| `week_start` | `date not null` | inclusive; Monday of the ISO week |
| `week_end` | `date not null` | inclusive; Sunday of the ISO week |
| `posts_planned` | `integer not null default 0` | snapshot of the plan for the week |
| `posts_published` | `integer not null default 0` | snapshot of what actually shipped |
| `top_post_id` | `uuid null references posts(id) on delete set null` | the highlight post for the week |
| `status` | `text not null default 'drafted' check (status in ('drafted','validated','published'))` | three-step pipeline |
| `draft_owner_id` | `uuid null references user_profiles(id) on delete set null` | team member who drafted |
| `validation_owner_id` | `uuid null references user_profiles(id) on delete set null` | team or operator who validated |
| `internal_validation_note` | `text null` | **never client-facing**; staff-only commentary |
| `client_safe_summary` | `text null` | powers the client view; rewritten / sanitized copy only |
| `summary_json` | `jsonb null` | full payload (metrics, charts, narrative); client view exposes only the safe subset |
| `published_at` | `timestamptz null` | set when `status` flips to `published` |
| `created_at` / `updated_at` | `timestamptz not null default now()` | |

**Unique:** `(client_id, week_start)` — one weekly report per client per week. Reuse the row across status transitions; never insert duplicates.

Notes:
- `status` is a hard check constraint, not a soft enum, because the
  three-step flow is the entire point of this table.
- `internal_validation_note` is the canonical "staff-only" field on
  this table. The client-safe view explicitly hides it (see §4).
- `client_safe_summary` is the sanitized narrative shown to clients.
  Drafting team must write this assuming the client will read it — it
  is not a copy-paste of `internal_validation_note`.
- `top_post_id` is `on delete set null` so deleting a post does not
  blow up historical reports; it just loses the highlight reference.

### 2.2 `monthly_reports`

One row per client per calendar month. Drafted by team, reviewed by
operator, approved and published by operator. Clients only see
`status='published'` rows, and even then only through the client-safe
view. Approval is a hard gate before publication.

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid pk default gen_random_uuid()` | |
| `client_id` | `uuid not null references clients(id) on delete cascade` | |
| `month_key` | `text not null` | `YYYY-MM`, e.g. `"2026-05"` |
| `status` | `text not null default 'drafting' check (status in ('drafting','operator_review','approved','published'))` | four-step pipeline |
| `summary_json` | `jsonb null` | trend data, narrative, focus areas; client view exposes only the safe subset |
| `approved_by_user_id` | `uuid null references user_profiles(id) on delete set null` | operator who approved; required before `status` may transition to `published` |
| `published_at` | `timestamptz null` | set when `status` flips to `published` |
| `created_at` / `updated_at` | `timestamptz not null default now()` | |

**Unique:** `(client_id, month_key)` — one monthly report per client per calendar month.

Notes:
- `status='approved'` is the hand-off state: the report has passed
  operator review but is not yet visible to the client. Publication is
  a deliberate second step (typically same operator, sometimes a
  scheduled release).
- Operator approval is required before `status='published'`. The plan
  is that the operator who flips to `approved` is recorded in
  `approved_by_user_id`, and the policy on the `published` transition
  checks both `is_operator()` and that `approved_by_user_id is not null`.
- `month_key` is stored as text (not date) because reports are pinned
  to a calendar month, not a specific day. Using `YYYY-MM` keeps the
  unique constraint trivial and avoids timezone ambiguity at month
  boundaries.

---

## 3. Status pipelines

### 3.1 weekly_reports

```text
drafted  ─▶  validated  ─▶  published
   │            │              │
team writes  team/op signs   operator releases
```

- `drafted` — team has written the report; not yet validated.
- `validated` — a second pair of eyes (team peer or operator) has
  validated; ready for the operator's release decision.
- `published` — operator has released it; visible to the client
  through `client_portal_weekly_reports_view`.

### 3.2 monthly_reports

```text
drafting  ─▶  operator_review  ─▶  approved  ─▶  published
   │              │                    │             │
team writes   op queue              op approves   op releases
```

- `drafting` — team is still authoring; nothing routed for review.
- `operator_review` — submitted to operator queue.
- `approved` — operator has approved; `approved_by_user_id` set.
  Not yet visible to the client.
- `published` — operator releases; visible through
  `client_portal_monthly_reports_view`. Hard rule: cannot reach
  `published` without going through `approved` first.

---

## 4. Client-safe views

Both views follow the same pattern as the existing
`client_portal_*_view` objects (see `SUPABASE_RLS_PLAN_V1.md` Part 3):
`with (security_invoker = true)`, exposes a narrow column set, and is
filtered to published rows only. The portal queries the view; it does
not query the base tables.

### 4.1 `client_portal_weekly_reports_view`

Source table: `weekly_reports`. Filter: `where status='published'`.

Exposed columns:
- `id`
- `client_id`
- `week_start`
- `week_end`
- `posts_planned`
- `posts_published`
- `top_post_id`
- `client_safe_summary`
- `published_at`
- Safe-subset projection of `summary_json` (e.g. `summary_json->'client_safe'`)

Explicitly hidden:
- `internal_validation_note`
- `draft_owner_id`, `validation_owner_id`
- Raw `summary_json` (only the client-safe subset is exposed)
- `status` (the view is published-only by definition; exposing the
  column would just leak the existence of internal states)
- Any draft/validated row (filtered out before column projection)

### 4.2 `client_portal_monthly_reports_view`

Source table: `monthly_reports`. Filter: `where status='published'`.

Exposed columns:
- `id`
- `client_id`
- `month_key`
- `published_at`
- Safe-subset projection of `summary_json`

Explicitly hidden:
- `approved_by_user_id`
- Raw `summary_json` (only the client-safe subset is exposed)
- `status`
- Any `drafting`, `operator_review`, or `approved` row (filtered out
  before column projection)

Rule for both views: the client portal must query **only** the views
for report data. If a portal page needs a column that is not exposed,
that is a signal to discuss whether the column is truly client-safe —
never bypass the view.

---

## 5. RLS plan

### 5.1 `weekly_reports`

- **Client SELECT** — own client only, via
  `client_portal_weekly_reports_view`. Base-table policy:
  `client_id = current_user_client_id() AND status='published'`.
  Base-table grants to the client role are revoked; the view is the
  only path.
- **Client INSERT / UPDATE / DELETE** — DENIED. Clients never write
  reports.
- **Team manage assigned** — `can_manage_client_operations(client_id)`
  for `select`, `insert`, `update`. Team owns the `drafted → validated`
  transition. Team may set `validation_owner_id = auth.uid()` when
  flipping to `validated`. Team may NOT flip `status` to `published`.
- **Operator** — `is_operator()` for `select`, `insert`, `update`.
  Operator owns the `validated → published` transition. Setting
  `published_at` is paired with that transition.
- **Owner** — full access (inherits operator capabilities; can also
  retroactively edit any field if absolutely required).
- **System** — service role bypasses RLS. Used for the auto-draft
  insert at the start of each week (one empty `drafted` row per
  active client) once that worker exists; no worker shipped in M005.
- **Append rule** — every `status` transition writes an
  `activity_logs` row (the hybrid policy from
  `SUPABASE_RLS_PLAN_V1.md` Part 9).

### 5.2 `monthly_reports`

- **Client SELECT** — own client only, via
  `client_portal_monthly_reports_view`. Base-table policy:
  `client_id = current_user_client_id() AND status='published'`.
  Base-table grants to the client role are revoked; the view is the
  only path.
- **Client INSERT / UPDATE / DELETE** — DENIED.
- **Team manage assigned** — `can_manage_client_operations(client_id)`
  for `select`, `insert`, `update` BUT only while
  `status in ('drafting','operator_review')`. Team may flip
  `drafting → operator_review`. Team may NOT flip to `approved` or
  `published` — that is operator-only.
- **Operator** — `is_operator()` for `select`, `insert`, `update`.
  Operator owns the `operator_review → approved → published`
  transitions. The `approved → published` transition policy checks
  `approved_by_user_id is not null`.
- **Owner** — full access.
- **System** — service role bypasses RLS. Used for the future
  auto-draft insert at the start of each month; no worker shipped in
  M005.
- **Append rule** — every `status` transition and every
  `approved_by_user_id` change writes an `activity_logs` row.

### 5.3 Cross-cutting

- Both tables have `enable row level security` from migration
  apply-time; no table is ever publicly readable.
- The client role's `select` grant on the base tables is revoked
  immediately after table creation; the views are granted instead.
  This is defense in depth on top of the row-level policy — RLS
  controls rows, the view controls columns.

---

## 6. Indexes

Targeted to the actual query shapes; do not over-index.

`weekly_reports`:
- `weekly_reports (client_id)` — every per-client query
- `weekly_reports (week_start)` — calendar / timeline queries
- `weekly_reports (status)` — operator queue ("show me everything
  awaiting validation / publication")
- `weekly_reports (top_post_id)` — backref lookups when a post is
  edited / deleted

`monthly_reports`:
- `monthly_reports (client_id)` — every per-client query
- `monthly_reports (month_key)` — month-over-month timeline
- `monthly_reports (status)` — operator queue
- `monthly_reports (approved_by_user_id)` — "what did this operator
  approve?" audit and team-load views

The `unique (client_id, week_start)` and `unique (client_id, month_key)`
constraints each create their own index — do not duplicate them.

---

## 7. Seed strategy

| Demo source | Target table |
|---|---|
| `src/data/demo/demoWeeklyReports.ts` | `weekly_reports` |
| `src/data/demo/demoMonthlyReports.ts` | `monthly_reports` |

Rules (same shape as M001–M004 seed rules):
- **Dev-only.** Seed runs against the local / dev Supabase project,
  never against production. No production seed file exists.
- **Stable UUIDs.** Each seeded report uses a deterministic `v5`
  UUID derived from `(client_id, week_start)` or
  `(client_id, month_key)` so re-running the seed updates the same
  row instead of inserting duplicates.
- **Idempotent.** Insert ... on conflict (`(client_id, week_start)` /
  `(client_id, month_key)`) do update ...`. Re-running the seed must
  leave the same row set, not grow it.
- **No fake reports shown as real data.** Seeded rows are clearly
  labeled in `client_safe_summary` and `summary_json` as
  demo / illustrative content. Never seed numbers that imply a real
  paying client's results.
- **Published-only in client views.** The seed deliberately produces
  a mix of `drafted`, `validated`, and `published` weekly rows, plus
  a mix of `drafting`, `operator_review`, `approved`, and `published`
  monthly rows, so the client-safe view filter is exercised by the
  fixtures. The client demo user must only ever see the `published`
  subset.
- **Runs as service role inside a single transaction.** Same as
  M001–M004.
- **Demo files are not modified.** This migration does not touch
  `demoWeeklyReports.ts` or `demoMonthlyReports.ts`; it just maps
  their existing shape onto the table columns.

---

## 8. Migration 005 draft SQL — decision

**Decision (this pass): planning-only; SQL draft NOT created.**

Rationale: matches the explicit task instruction ("Planning only — no
SQL draft yet"). The plan above is concrete enough that the eventual
draft will be a near-mechanical translation, mirroring the structure
of `004_posting_foundation_draft.sql`. Authoring the SQL is the next
forward step once M004 has progressed through testing.

---

## 9. Cross-references

- M001 draft: `docs/sql_drafts/migrations_review/001_identity_foundation_draft.sql`
- M002 draft: `docs/sql_drafts/migrations_review/002_client_foundation_draft.sql`
- M003 draft: `docs/sql_drafts/migrations_review/003_media_foundation_draft.sql`
- M004 draft: `docs/sql_drafts/migrations_review/004_posting_foundation_draft.sql`
- M004 plan: `docs/MIGRATION_004_POSTING_FOUNDATION_PLAN.md`
- M005 test outline (this plan's tests): `docs/MIGRATION_005_TEST_PLAN_OUTLINE.md`
- Schema reference: `docs/SUPABASE_SCHEMA_DRAFT_V1.md` (`weekly_reports`, `monthly_reports`)
- RLS reference: `docs/SUPABASE_RLS_PLAN_V1.md` (Parts 2, 3, 4 — client-safe views and report rules)
- Demo data reference: `docs/DEMO_DATA_MAP.md`

---

## 10. Final report

**Files created in this pass**
1. `artifacts/veroxa/docs/MIGRATION_005_REPORTING_FOUNDATION_PLAN.md` (this document)
2. `artifacts/veroxa/docs/MIGRATION_005_TEST_PLAN_OUTLINE.md`

**Files modified:** none.

**Tables planned:** 2 — `weekly_reports`, `monthly_reports`.

**Views planned:** 2 — `client_portal_weekly_reports_view`,
`client_portal_monthly_reports_view`. Both `security_invoker`,
both filter to `status='published'`, both project a narrow
client-safe column set that hides internal notes, raw JSON,
draft / review / approved rows, and staff attribution fields.

**RLS summary:** Client SELECT is own-client + published-only,
through the views; client never writes. Team manages assigned
clients' reports up to `validated` (weekly) and `operator_review`
(monthly); team cannot approve or publish. Operator owns the
`validated → published` step on weekly and the
`operator_review → approved → published` steps on monthly;
publication requires `approved_by_user_id is not null`. Owner has
full access. System (service role) bypasses RLS for future auto-draft
workers (no worker shipped in M005).

**Seed strategy summary:** Maps `demoWeeklyReports.ts → weekly_reports`
and `demoMonthlyReports.ts → monthly_reports`. Dev-only, stable
UUIDs derived from `(client_id, week_start)` and
`(client_id, month_key)`, idempotent `on conflict do update`, no
production seed, seeded rows clearly demo-labeled, full mix of
statuses to exercise the published-only view filter.

**Test outline created:** Yes — see
`docs/MIGRATION_005_TEST_PLAN_OUTLINE.md`. Eleven headline cases:
own-published visibility (weekly + monthly), draft invisibility,
internal-note invisibility, operator-review invisibility, team
drafting authority, team approval prohibition, operator approval
authority, owner full visibility, monthly unique constraint, and
rollback drop order (views before tables).

**No migrations were run.** No SQL was authored. `docs/sql_drafts/`
is unchanged. No Supabase project was touched.

**`AUTH_MODE` unchanged.** Still `"placeholder"`. No auth wiring,
portal navigation, or login flow was modified.

**Pricing unchanged.** No pricing column, plan, or page was touched.
The locked pricing reference in `SUPABASE_SCHEMA_DRAFT_V1.md` is
untouched.

**Remaining risks**
- `summary_json` client-safe projection is described as "the safe
  subset" but the exact key shape inside `summary_json` is not yet
  pinned. When the SQL draft is authored, the safe key path
  (`summary_json->'client_safe'` vs. an explicit allow-list of
  top-level keys) must be locked, otherwise the view risks leaking
  internal payload.
- Auto-draft worker (system insert at the start of each week /
  month) is out of scope; until it exists, there is no row for
  team to validate. Either the seed covers all current periods or
  team manually inserts a `drafted` row to start. This is a
  workflow concern, not a schema concern.
- `top_post_id` is `on delete set null`, so deleting a post silently
  drops the highlight. Acceptable for V1 because the report copy
  still exists; revisit if "highlight integrity" becomes a product
  requirement.
- The hybrid activity-log strategy from `SUPABASE_RLS_PLAN_V1.md`
  Part 9 assumes the app writes report status transitions to
  `activity_logs`. Until the report-write code paths exist, that
  audit row will be missing. Flag for the implementation pass.

**Recommended next prompt**
Author `docs/sql_drafts/migrations_review/005_reporting_foundation_draft.sql`
following the structure of `004_posting_foundation_draft.sql`:
table DDL + check constraints + unique constraints + indexes +
`updated_at` triggers + RLS enable + per-role policies +
`client_portal_weekly_reports_view` and
`client_portal_monthly_reports_view` definitions + base-table
grant revocation + view grants to the client role.
