# Migration 003 — Media Foundation: Planning Document

**Status:** Planning. The draft SQL exists at
`docs/sql_drafts/migrations_review/003_media_foundation_draft.sql` and
has **not** been applied to any database. `AUTH_MODE` remains
`"placeholder"`. No app code touched.

---

## 1. Purpose

Migration 003 introduces the first operational layer after clients
exist: client-uploaded media, per-tenant notifications, periodic health
snapshots, and a write-once activity log.

### Dependency

M003 depends on **M001** (identity + helpers) and **M002** (clients,
team_client_assignments, can_view_client / can_manage_client_operations
helpers). M003 must not apply before both are green.

### Scope

Included:
- `media_assets`
- `notifications`
- `client_health_snapshots`
- `activity_logs`
- `updated_at` triggers on each table that has `updated_at`
- RLS + per-role policies on all four tables
- Indexes
- Commented client-safe view stubs:
  `client_portal_media_view`, `client_portal_notifications_view`,
  `client_portal_health_view`

**NOT in scope** (deferred):
- `posts`, `post_slots` — Migration 004
- `media_assets.linked_post_id` FK — Migration 004 (column exists in M003 as a bare uuid placeholder)
- Reports (`weekly_reports`, `monthly_reports`) — M005
- AI / content concept tables (`content_concepts`, `draft_sets`, `draft_variants`, `ai_agents`) — M006
- Storage buckets and storage RLS — M007
- Publishing integration tables — M008+
- Real `CREATE VIEW` SQL for the portal views (commented stubs only; materialized in the portal-connect pass)

---

## 2. Tables

### 2.1 `media_assets`

One row per uploaded asset (image / short video). Lifecycle status drives
the entire content workflow.

Per the prompt — full column list documented in the SQL draft. Key
points:
- `client_id not null references clients(id) on delete cascade`
- `linked_post_id uuid null` — **no FK in M003**; the FK is added in M004 once `posts` exists. Commented at the column definition.
- `source_type` check: `client_upload`, `legacy_reuse`, `team_upload`
- `review_status` check covers the 11 lifecycle states from the prompt (`uploaded`, `ai_reviewed`, `team_review_pending`, `rejected`, `usable`, `shortlisted`, `drafted`, `approved`, `scheduled`, `used`, `reusable_archive`)
- `quality_ai_flag` check: `likely_usable`, `borderline`, `likely_reject`
- `reuse_eligible boolean not null default false`
- Internal columns (`internal_note`, raw `rejection_reason`, `quality_score`, `quality_ai_flag`) MUST be hidden from `client_portal_media_view`.

### 2.2 `notifications`

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid pk default gen_random_uuid()` | |
| `client_id` | `uuid null references clients(id) on delete cascade` | nullable — global ops notifications can have no client |
| `target_role` | `text not null check (target_role in ('client','team','operator','owner'))` | scopes audience |
| `target_user_id` | `uuid null references user_profiles(id) on delete set null` | optional direct target |
| `notification_type` | `text not null check in ('success','info','warning','reminder','critical')` | |
| `priority` | `text not null default 'p2' check (priority in ('p1','p2','p3'))` | |
| `title` | `text not null` | |
| `message_body` | `text not null` | |
| `status` | `text not null default 'created' check (status in ('created','sent','seen','dismissed','escalated'))` | |
| `trigger_source` | `text not null default 'system' check (trigger_source in ('system','agent','operator','team','client_action'))` | |
| `created_at` / `updated_at` | `timestamptz not null default now()` | |

Visibility rules → enforced by RLS:
- Client: own `client_id` AND `target_role='client'` only.
- Team: assigned-client (`can_view_client(client_id)`) AND `target_role in ('team','operator')` (team needs to see operator escalations on assigned clients but not owner-only alerts).
- Operator / Owner: full read.

### 2.3 `client_health_snapshots`

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid pk default gen_random_uuid()` | |
| `client_id` | `uuid not null references clients(id) on delete cascade` | |
| `level` | `text not null check (level in ('healthy','attention','critical'))` | |
| `priority_level` | `text not null default 'normal' check (priority_level in ('low','normal','high','critical'))` | |
| `content_runway_days` | `integer null` | |
| `approved_media_count` | `integer null` | |
| `scheduled_posts_count` | `integer null` | |
| `open_requests_count` | `integer null` | |
| `unresolved_alerts_count` | `integer null` | |
| `summary` | `text null` | |
| `created_by_role` | `text not null default 'system' check (created_by_role in ('system','operator','owner'))` | |
| `created_at` | `timestamptz not null default now()` | append-only; no `updated_at` |

No `updated_at` — snapshots are append-only.

### 2.4 `activity_logs`

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid pk default gen_random_uuid()` | |
| `client_id` | `uuid null references clients(id) on delete cascade` | nullable — system-wide ops events can have no client |
| `entity_type` | `text not null` | e.g. `clients`, `media_assets`, `posts` |
| `entity_id` | `uuid null` | the row id; intentionally NOT a FK (entity_type discriminates) |
| `action_key` | `text not null` | e.g. `pricing_changed`, `media_uploaded`, `post_approved` |
| `description` | `text null` | |
| `performed_by_role` | `text not null check in ('system','client','team','operator','owner')` | |
| `performed_by_user_id` | `uuid null references user_profiles(id) on delete set null` | |
| `old_value_json` | `jsonb null` | |
| `new_value_json` | `jsonb null` | |
| `created_at` | `timestamptz not null default now()` | append-only |

Append-only. No `updated_at`, no UPDATE policy, no DELETE policy.
Future M004+ triggers (e.g. pricing-change logging on `clients`) will
INSERT here as `system`.

---

## 3. Helper functions

M003 reuses M001 + M002 helpers; no new private helpers are required.
The four M002 helpers (`is_assigned_to_client`, `can_view_client`,
`can_manage_client_operations`, `can_manage_pricing`) cover every
visibility rule in this migration.

---

## 4. RLS plan

### 4.1 `media_assets`

- **Client SELECT own** — via `client_portal_media_view` for column hiding; base-table policy `media_assets_select_own_client` permits row read.
- **Client INSERT own** — `with check (client_id = current_user_client_id() AND source_type='client_upload' AND review_status='uploaded')`. The `with check` is the enforcement of "pinned" values; client cannot pre-mark its own upload as `approved` or as `team_upload`.
- **Client UPDATE** — DENIED. No client UPDATE policy; clients cannot edit `review_status`, `internal_note`, `quality_*`, or `rejection_reason`. If a future "client can replace caption_hint" mutation is wanted, add a narrow policy then.
- **Team manage assigned** — `can_manage_client_operations(client_id)` for ALL.
- **Operator** — view all + update operational fields.
- **Owner** — full access.

### 4.2 `notifications`

- **Client SELECT own client-targeted** — `client_id = current_user_client_id() AND target_role='client'`.
- **Client UPDATE status** — own row only AND only flip `status` to `seen` or `dismissed`. Enforced at the policy level via `with check`; the portal mutation layer narrows the column set further in M004+.
- **Team SELECT assigned + team/operator scope** — `can_view_client(client_id) AND target_role in ('team','operator')`.
- **Operator / Owner SELECT all.**
- **System INSERT via service role** (RLS bypass).

### 4.3 `client_health_snapshots`

- **Client SELECT** — own client only, through `client_portal_health_view` (level + summary + a "needs your attention" hint only).
- **Team SELECT** — `can_view_client(client_id)`; full snapshot fields visible to staff.
- **Operator / Owner SELECT all + INSERT.**
- **System INSERT** via service role; the typical writer.
- **No UPDATE policy** — snapshots are immutable. Correct a wrong snapshot by inserting a new one.

### 4.4 `activity_logs`

- **NO client read access.** Logs may contain internal old/new values from pricing changes etc.
- **Team SELECT assigned** — narrow policy: `can_view_client(client_id) AND entity_type in (...allowlist...)`. M003 keeps the allowlist permissive (`entity_type in ('media_assets','client_requests','onboarding_items','client_platforms')`); later migrations can tighten.
- **Operator / Owner SELECT all.**
- **INSERT** — `private.is_owner() OR private.is_operator()` (manual ops events), and service role (system events). No team / client INSERT.
- **UPDATE / DELETE forbidden** — no policy defined → default-deny → append-only.

---

## 5. Indexes

- `media_assets (client_id)`
- `media_assets (review_status)`
- `media_assets (uploaded_at)`
- `media_assets (source_type)`
- `notifications (client_id)`
- `notifications (target_role)`
- `notifications (target_user_id)`
- `notifications (status)`
- `notifications (priority)`
- `client_health_snapshots (client_id)`
- `client_health_snapshots (created_at)`
- `activity_logs (client_id)`
- `activity_logs (entity_type, entity_id)` — composite for entity-history lookups
- `activity_logs (created_at)`
- `activity_logs (performed_by_user_id)`

---

## 6. Client-safe views (stubs in M003 SQL; materialized in M003 portal-connect pass)

Stubs documented as commented SQL at the bottom of the draft SQL file.
Pattern: every view uses `with (security_invoker = true)` so base-table
RLS applies; the view's job is to hide columns.

**`client_portal_media_view`** — exposes: `client_id`, `id`, `file_type`,
`thumbnail_url`, `title`, `caption_hint`, `client_safe_note`,
`review_status_label` (translated; e.g. `'uploaded'`→"Received",
`'team_review_pending'`→"Reviewing", `'approved'`→"Approved",
`'used'`→"Posted", `'rejected'`→"Needs another shot"), `uploaded_at`.
Hidden: `internal_note`, raw `rejection_reason`, `quality_score`,
`quality_ai_flag`, `source_type`, `linked_post_id`, AI reasoning fields.

**`client_portal_notifications_view`** — exposes: `id`, `client_id`,
`title`, `message_body`, `status`, `created_at`. Filtered to own client
+ `target_role='client'`.

**`client_portal_health_view`** — exposes: `id`, `client_id`, `level`,
`content_runway_days`, `summary`, `created_at`. Hidden: `priority_level`
(internal triage), all internal counts, `created_by_role`.

---

## 7. Seed strategy

| Demo source | Target table |
|---|---|
| `demoMediaAssets.ts` | `media_assets` |
| `demoNotifications.ts` | `notifications` |
| `demoClientHealth.ts` | `client_health_snapshots` |
| `demoActivityLogs.ts` | `activity_logs` (dev-only; recommend skipping in seed to keep the audit trail "real") |

Rules: dev-only, idempotent (`insert ... on conflict (id) do update`),
stable IDs, no real PII, no production seeding. Seeds run as service
role (RLS bypass) inside a single transaction.

---

## 8. Test plan

Materialized in `docs/MIGRATION_003_TEST_PLAN.md`.

---

## 9. Cross-references

- M001 draft: `docs/sql_drafts/migrations_review/001_identity_foundation_draft.sql`
- M002 draft: `docs/sql_drafts/migrations_review/002_client_foundation_draft.sql`
- M003 draft (this plan's SQL): `docs/sql_drafts/migrations_review/003_media_foundation_draft.sql`
- M003 test plan: `docs/MIGRATION_003_TEST_PLAN.md`
- Schema source of truth: `docs/SUPABASE_SCHEMA_DRAFT_V1.md`
- RLS source of truth: `docs/SUPABASE_RLS_PLAN_V1.md`
