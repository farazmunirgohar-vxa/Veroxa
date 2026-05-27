# Veroxa — RLS + Migration Readiness Plan V1

**Status:** Planning draft. **Not** a migration. **Not** wired to any live database.
`AUTH_MODE` remains `"placeholder"`. No code, auth guards, portal UI, pricing, navigation, uploads, AI APIs, publishing, or payments are touched.

This document is the future-state Row Level Security plan, helper-function plan, migration sequencing, seed strategy, auth-activation checklist, storage rules, and activity-log strategy for Veroxa's Supabase backend. It builds on:

- `docs/SUPABASE_SCHEMA_DRAFT_V1.md` (V1.1 corrected) — table + enum spec
- `docs/sql_drafts/001_veroxa_schema_draft.sql` — commented CREATE TABLE drafts
- `docs/DEMO_DATA_MAP.md` — source-of-truth mapping of `src/data/demo/` to tables

---

## Part 1 — Roles overview

Veroxa has **five** principals at the database level. Four are human (rows in `user_profiles.role`) and one is non-human (the service role used by background jobs and triggers).

| Role | `user_profiles.role` | Source of access |
|---|---|---|
| Client | `client` | The contact at a restaurant. Sees their own account only. |
| Team | `team` | Internal contractor / staffer. Sees clients they are assigned to. |
| Operator | `operator` | Full operational visibility across the portfolio. |
| Owner | `owner` | Veroxa's owner(s). Full access; sole pricing/permission writer. |
| System | service role | Background jobs, Postgres triggers, scheduled tasks. Bypasses RLS. |

**Universal rule:** every table has `enable row level security` from migration 001 onward. No table is ever publicly readable. The service role bypasses RLS by definition; everywhere else, an explicit policy must exist before any rows are reachable.

---

## Part 2 — Role access rules (plain English)

### Client

**Can view:**
- Their own `clients` row
- Their own `client_platforms` (status only — never internal notes)
- Their own `onboarding_items`
- Their own `media_assets`, but only the client-safe fields (no `rejection_reason` body, no internal `team_note`)
- Their own `post_slots` and **published** `posts`
- Their own `notifications` (where `target_role='client'`)
- Their own `weekly_reports` with `status='published'`
- Their own `monthly_reports` with `status='published'`
- Their own `client_requests`

**Can create:**
- `media_assets` for their own `client_id` (source_type pinned to `'client_upload'`)
- `client_requests` for their own `client_id`
- Marking client-owned `onboarding_items` as `pending` or `complete`

**Can update (narrow):**
- Their own `client_requests.status` (`pending` → `in_progress` → `completed`)
- Their own `onboarding_items.status` (only items where `owner_role='client'`)
- Their own contact fields on `clients` (name, phone, secondary contacts) — never pricing, status, or assignment fields

> **Important — the client portal should read from client-safe views, not base tables.** RLS controls rows, not columns. To keep sensitive columns (pricing, internal notes, assignment fields) off the wire entirely, the client portal queries `client_portal_*_view` objects rather than the raw base tables. See "Client-safe views" at the end of this part.
- `notifications.status` for their own notifications (mark seen/dismissed)

**Cannot view:**
- Any other client's rows (any table)
- `draft_sets`, `draft_variants`, `content_concepts`
- `weekly_reports.internal_validation_note`, `weekly_reports.summary_json` while still in `drafted`/`validated` state
- `monthly_reports` while still in `drafting`/`operator_review`
- `activity_logs` (entire table)
- `financial_snapshots`, `ai_agents`, `system_status`, `team_members`
- `notifications` targeted at any other role
- `clients.plan_type` / `service_package` / `monthly_fee_cents` (these are owner-write-only, but should also be hidden from client SELECT via a view, not the base table)

### Team

**Can view:**
- `clients` they are assigned to (via `clients.assigned_operator_id = auth.uid()` OR an active row in `team_client_assignments` linking their `team_members.id` to the `client_id`)
- All operational child rows of assigned clients: `media_assets`, `content_concepts`, `draft_sets`, `draft_variants`, `posts`, `post_slots`, `client_platforms`, `onboarding_items`, `client_requests`, `client_health_snapshots`
- `weekly_reports` for assigned clients (all statuses)
- `monthly_reports` for assigned clients (read-only — they cannot approve)
- `notifications` targeted at `target_role='team'` (theirs)
- `activity_logs` scoped to assigned clients
- `team_members` rows for themselves only
- `team_client_assignments` rows where they are the `team_member_id` AND `is_active=true` (read-only; cannot modify their own assignments)

**Can create / update:**
- `media_assets.review_status`, `rejection_reason`, `quality_ai_flag` (for assigned clients)
- All `content_concepts`, `draft_sets`, `draft_variants` for assigned clients
- `posts` and `post_slots` for assigned clients, up to the point of publishing (publishing is system/automation)
- `weekly_reports` drafts (`drafted` → `validated`)
- `client_requests` for assigned clients (operator can also)
- Their own `notifications.status` (mark seen/dismissed)

**Cannot:**
- Change pricing fields on `clients`
- Change `user_profiles.role`
- Approve `monthly_reports` (operator-only transition to `approved`/`published`)
- View `financial_snapshots`, `ai_agents` settings, `system_status` (admin views)
- See any client they are not assigned to

### Operator

**Can view:** everything operational across **all** clients.
- Every table that is operational: `clients`, `client_platforms`, `onboarding_items`, `media_assets`, `content_concepts`, `draft_sets`, `draft_variants`, `posts`, `post_slots`, `notifications`, `weekly_reports`, `monthly_reports`, `activity_logs`, `client_requests`, `client_health_snapshots`, `ai_agents`, `team_members`
- `financial_snapshots` (read-only; the source for owner dashboards)
- `system_status`

**Can update:**
- `clients.account_status`, `risk_status`, `content_health_status`, `assigned_operator_id`, `assigned_team_label`
- `weekly_reports.status` (`validated` → `published`), validation notes
- `monthly_reports.status` (`operator_review` → `approved` → `published`)
- `notifications`: create, escalate, dismiss, reassign
- `client_requests`: any field, any client
- `client_health_snapshots`: insert overrides (rare — usually system writes)
- Any row in any client's operational tables (but should rarely edit content directly)

**Cannot:**
- Change `clients.plan_type`, `clients.service_package`, `clients.monthly_fee_cents` (Owner only)
- Change `user_profiles.role`, `user_profiles.is_active` for other operators or the owner
- Toggle `ai_agents.is_enabled` (Owner only)
- Hard-delete clients or any historical row (soft-archive via `account_status='closed'` only)

### Owner

**Can view:** everything, every table, every row, no exceptions.

**Can update:**
- All operator capabilities, plus:
- `clients.plan_type`, `clients.service_package`, `clients.monthly_fee_cents`
- `user_profiles.role`, `is_active` for all users
- `ai_agents.is_enabled`, `ai_agents` settings
- `system_status` rows
- Soft-deletes / hard-deletes are still discouraged; prefer `account_status='closed'`

The Owner role is the **only** principal that can change pricing or grant new role assignments. Every write to those fields **must** create an `activity_logs` entry.

### System / automation (service role)

The service role bypasses RLS entirely. It is used by:
- Edge Functions / scheduled cron
- Postgres triggers
- Background job workers

**Can insert / update:**
- `activity_logs` (sole insert path for audit-grade rows, alongside trigger-emitted rows)
- `notifications` (system-originated, with `trigger_source='system'` or `'agent'`)
- `client_health_snapshots` (the daily aggregator)
- `financial_snapshots` (monthly rollup)
- `posts`: `post_status` transitions to `scheduled`, `published`, `failed`, `reschedule_required`
- `post_slots.status` transitions following posts
- `media_assets.review_status` for AI-driven moves (e.g. `uploaded` → `ai_reviewed`)
- `weekly_reports`, `monthly_reports`: insert auto-drafts at the start of each cycle

**Rule:** every system-side mutation that changes a `*_status` field must also write an `activity_logs` row with `performed_by_role='system'` and `new_value_json.agent_key` (when applicable).

---

## Part 3 — Table-by-table RLS matrix

Legend: **✓** = full, **own** = only own rows, **assigned** = only rows for assigned clients, **all** = all rows in table, **partial** = only specific columns, **—** = no access. `S` = SELECT, `I` = INSERT, `U` = UPDATE, `D` = DELETE.

| Table | Client (S/I/U/D) | Team (S/I/U/D) | Operator (S/I/U/D) | Owner (S/I/U/D) | System (I/U) |
|---|---|---|---|---|---|
| `user_profiles` | own / — / partial (display_name, avatar_url) / — | own / — / partial / — | all / — / — / — | all / ✓ / ✓ / — | ✓ / ✓ |
| `team_members` | — / — / — / — | own / — / — / — | all / — / — / — | all / ✓ / ✓ / — | — / — |
| `team_client_assignments` | — / — / — / — | own active rows / — / — / — | all / — / partial (`is_active`) / — | all / ✓ / ✓ / — | — / ✓ (admin workflows only) |
| `clients` | own / — / partial (contact fields) / — | assigned / — / — / — | all / — / partial (status/risk/assignment) / — | all / ✓ / ✓ / — | — / partial (derived fields) |
| `client_platforms` | own / — / — / — | assigned / ✓ / ✓ / — | all / ✓ / ✓ / — | all / ✓ / ✓ / ✓ | — / ✓ (sync) |
| `onboarding_items` | own / — / partial (client-owned only) / — | assigned / ✓ / ✓ / — | all / ✓ / ✓ / — | all / ✓ / ✓ / ✓ | — / ✓ (auto-complete) |
| `media_assets` | own (safe fields) / own (source_type pinned) / — / — | assigned / ✓ / ✓ / — | all / ✓ / ✓ / — | all / ✓ / ✓ / ✓ | ✓ / ✓ (AI review, link_post_id) |
| `content_concepts` | — / — / — / — | assigned / ✓ / ✓ / — | all / ✓ / ✓ / — | all / ✓ / ✓ / ✓ | ✓ / ✓ (agent-generated) |
| `draft_sets` | — / — / — / — | assigned / ✓ / ✓ / — | all / ✓ / ✓ / — | all / ✓ / ✓ / ✓ | ✓ / ✓ (agent-generated) |
| `draft_variants` | — / — / — / — | assigned / ✓ / ✓ / — | all / ✓ / ✓ / — | all / ✓ / ✓ / ✓ | ✓ / ✓ |
| `posts` | own (published only) / — / — / — | assigned / ✓ / ✓ (pre-publish) / — | all / ✓ / ✓ / — | all / ✓ / ✓ / ✓ | — / ✓ (publish results) |
| `post_slots` | own / — / — / — | assigned / ✓ / ✓ / — | all / ✓ / ✓ / — | all / ✓ / ✓ / ✓ | — / ✓ (slot reservation flow) |
| `notifications` | own (target_role='client') / — / partial (status) / — | own (target_role='team') / — / partial / — | own + all (target_role='operator') / ✓ / ✓ / — | all / ✓ / ✓ / ✓ | ✓ / ✓ |
| `weekly_reports` | own (status='published' only) / — / — / — | assigned / ✓ / ✓ (drafted → validated) / — | all / ✓ / ✓ (validated → published) / — | all / ✓ / ✓ / ✓ | ✓ (auto-draft) / ✓ |
| `monthly_reports` | own (status='published' only) / — / — / — | assigned (read) / — / — / — | all / ✓ / ✓ (review → approved → published) / — | all / ✓ / ✓ / ✓ | ✓ (auto-draft) / ✓ |
| `activity_logs` | — / — / — / — | assigned (read) / — / — / — | all / — / — / — | all / — / — / — | ✓ / — (append-only) |
| `client_requests` | own / own / partial (status) / — | assigned / ✓ / ✓ / — | all / ✓ / ✓ / — | all / ✓ / ✓ / ✓ | ✓ / ✓ |
| `client_health_snapshots` | — / — / — / — | assigned (read) / — / — / — | all / partial / — / — | all / ✓ / ✓ / — | ✓ / — (append-only) |
| `ai_agents` | — / — / — / — | — / — / — / — | all (read) / — / — / — | all / ✓ / ✓ / — | — / partial (last_activity_at) |
| `financial_snapshots` | — / — / — / — | — / — / — / — | all (read) / — / — / — | all / ✓ / ✓ / — | ✓ / ✓ |
| `system_status` | — / — / — / — | — / — / — / — | all (read) / — / — / — | all / ✓ / ✓ / — | — / ✓ |

### Client-safe views (defense in depth — RLS controls rows, not columns)

RLS gates **rows**. To hide individual **columns** (pricing, internal notes, assignment fields) from a role that can see the row, the safest design is a `security_invoker` view that projects only the safe columns and let the client portal query the view instead of the base table. Base-table SELECT remains available to staff; the client role's grants can even be restricted to the views only.

Planned views (created in the migration that creates the underlying table, with `revoke select on <base_table> from client_role` + `grant select on <view> to client_role`):

| View | Underlying table(s) | Exposes | Hides |
|---|---|---|---|
| `client_portal_clients_view` | `clients` | id, business_name, primary contact fields, cuisine_type, address, website_url, hours_text, timezone, account_status, content_health_status | `monthly_fee_cents`, `plan_type`, `service_package`, `risk_status`, `assigned_operator_id`, `assigned_team_label`, internal notes |
| `client_portal_media_view` | `media_assets` | id, client_id, file_url, file_type, title, review_status, used_in_post_id, created_at | `rejection_reason` (raw), internal `team_note`, raw `quality_score`, `source_type` (just exposed as `is_client_upload` boolean if needed) — rejection text rewritten into a `client_message` field by a `case` in the view |
| `client_portal_weekly_reports_view` | `weekly_reports` | published weeklies only (`where status='published'`), client_id, week_start, `summary_json->'client_safe'` projection, top_post_id, published_at | `internal_validation_note`, `draft_owner_id`, `validation_owner_id`, raw `summary_json`, drafted / validated rows |
| `client_portal_monthly_reports_view` | `monthly_reports` | published monthlies only (`where status='published'`), client_id, month_key, `summary_json->'client_safe'` projection, top_post_id, published_at | `approved_by_user_id`, raw `summary_json`, drafting / operator_review / approved rows |
| `client_portal_calendar_view` | `posts` + `post_slots` | scheduled and published posts only, slot_date/time, platform, `client_safe_title`, media references | concepts, drafts, variants, internal scheduling notes, pre-publish posts |
| `client_portal_platforms_view` | `client_platforms` | id, client_id, platform, handle, connected_status, last_synced_at | internal `notes`, raw OAuth state |
| `client_portal_onboarding_view` | `onboarding_items` | full row (no staff-only columns today, but routed through the view for consistency) | — |
| `client_portal_requests_view` | `client_requests` | id, client_id, subject, body, status, created_at | `assigned_to_role`, `requested_by_user_id` |
| `client_portal_health_view` | `client_health_snapshots` | client-safe summary fields | raw `priority_level`, `unresolved_alerts_count` |
| `client_portal_notifications_view` | `notifications` | id, target_user_id, title, body, status, created_at — filtered to `target_role='client'` AND (`target_user_id = auth.uid()` OR `target_user_id is null`) | internal `trigger_source` payload, staff-routed notifications |

Rules:
- Views are `security_invoker = true` (Postgres 15+) so the caller's RLS still applies — the view is a column filter, not a privilege escalation.
- Base-table policies still exist; the views are an additional layer, not a replacement.
- The client portal frontend should query **only** these views. If a portal page needs a column not exposed, that's a signal to discuss whether it's actually client-safe — never bypass the view.

### Per-row notes
- **`user_profiles`:** writes other than `display_name` / `avatar_url` are Owner-only. Role and `is_active` changes must trigger an `activity_logs` insert.
- **`clients` partial-update for client role:** allowed fields are `primary_contact_name`, `primary_contact_email`, `primary_contact_phone`, `secondary_contact_name`, `secondary_contact_email`, `hours_text`. All other writes are forbidden — pricing fields are Owner-only.
- **`media_assets` client insert:** pin `source_type='client_upload'`, `review_status='uploaded'`, `client_id=auth_client_id()` in the policy `with check` clause; never trust the client payload.
- **`notifications` target_user_id:** if non-null, restrict SELECT to that user; if null, fall back to the role check.
- **`activity_logs`:** SELECT for Team is scoped by `client_id` (denormalized column) so policies can be index-friendly.

---

## Part 4 — Helper function plan

All helpers live in schema `private` (or `auth_helpers`) and are `security definer`, `stable`, and access `auth.uid()` from the JWT. They should be exhaustively unit-tested before any policy depends on them.

### `current_user_role() returns text`
- **Purpose:** Look up the calling user's role from `user_profiles`.
- **Inputs:** none (reads `auth.uid()`).
- **Returns:** `'client' | 'team' | 'operator' | 'owner' | NULL` (NULL for anon / service role).
- **Used by:** every policy.
- **Risk if wrong:** returning the wrong role here breaks every table's access. Must be `stable` (cacheable per statement) and never raise.

### `current_user_client_id() returns uuid`
- **Purpose:** For client-role users, the `clients.id` they are tied to.
- **Inputs:** none.
- **Returns:** `clients.id` or NULL.
- **Used by:** every `own`-scoped policy on a client-facing table.
- **Risk if wrong:** a non-null value for a non-client user could leak rows across clients. Helper must return NULL unless `current_user_role() = 'client'`.

### `is_owner() returns boolean`
- **Purpose:** Shortcut for `current_user_role() = 'owner'`.
- **Used by:** pricing-field policies, role-management policies.

### `is_operator() returns boolean`
- **Purpose:** Shortcut for `current_user_role() in ('operator','owner')` — owner inherits all operator capabilities.

### `is_team_member() returns boolean`
- **Purpose:** Shortcut for `current_user_role() in ('team','operator','owner')` — operator/owner inherit team visibility.

### `is_assigned_to_client(client_id uuid) returns boolean`
- **Purpose:** True if the calling user is a team or operator user assigned to that client.
- **Returns:** true when `is_operator()`, OR `clients.assigned_operator_id = auth.uid()`, OR an **active** row exists in `team_client_assignments` linking the caller's `team_members.id` to the given `client_id`. (No array-contains anywhere — `team_members.assigned_client_ids` is deprecated and removed from the real design.)
- **Used by:** every `assigned`-scoped policy on `media_assets`, `content_concepts`, `draft_sets`, `draft_variants`, `posts`, `post_slots`, `client_requests`, `client_platforms`, `onboarding_items`, `client_health_snapshots`, `activity_logs` SELECT.
- **Risk if wrong:** a permissive bug exposes other clients' rows to the wrong team member. Must default to false for any unknown user, must require `is_active = true`, and must not be tricked by inactive/revoked assignments left in the table for audit purposes.

### `can_view_client(client_id uuid) returns boolean`
- **Purpose:** Union of client (own) + team (assigned) + operator + owner.
- **Returns:** `(current_user_role() = 'client' and current_user_client_id() = client_id) or is_assigned_to_client(client_id) or is_operator()`.
- **Used by:** the `select` policy on every per-client table.

### `can_manage_client_operations(client_id uuid) returns boolean`
- **Purpose:** True for team (assigned), operator, owner. False for client.
- **Used by:** mutating policies on operational tables.

### `can_manage_pricing() returns boolean`
- **Purpose:** Owner-only. Alias for `is_owner()`. Kept as a separate helper so the intent is obvious in policy text.
- **Used by:** the column-level update policies on `clients` (`plan_type`, `service_package`, `monthly_fee_cents`).

### `can_view_owner_metrics() returns boolean`
- **Purpose:** Gates `financial_snapshots`, `ai_agents` config, `system_status`.
- **Returns:** `is_operator()` for read; `is_owner()` for write.

### `is_system_actor() returns boolean`
- **Purpose:** True when the caller is the service role (no JWT, or `auth.role() = 'service_role'`).
- **Used by:** insert policies on `activity_logs`, `client_health_snapshots`, `financial_snapshots`.

### Security definer safety rules (apply to every helper)
Every helper above is `security definer` (runs with the function-owner's
privileges, not the caller's). That power makes them attack surface; treat
each one like an internal API:

- **Explicit schema.** Define in `private` (or `auth_helpers`); never in `public`. Reference fully-qualified tables (`public.user_profiles`, not `user_profiles`).
- **Explicit `set search_path = pg_catalog, public`.** Defeats search-path hijacking — without this, a malicious extension or shadow table on the caller's path can intercept references.
- **`stable` / `immutable`.** Cache per statement so the planner is sane and the policy isn't recomputed per row.
- **No exceptions.** Return null/false on missing rows. A raised exception escapes to the user and tells them which row triggered it.
- **No dynamic SQL.** No `execute`, no string-built queries; only static SQL the planner can verify.
- **Read only from schema-controlled tables.** `user_profiles`, `team_members`, `team_client_assignments`, `clients`. Never read from a user-writable table whose contents could be poisoned by an attacker (e.g. `media_assets.title`).
- **Owner = role-creator.** The function owner should be the migration role, not `postgres` superuser, and the function should be `revoke execute from public` then `grant execute to authenticated, service_role` explicitly.
- **Unit tests before use.** Each helper passes against fixtures for: anon, service role, one user per role, a user whose `user_profiles` row was deleted, and a team user with an inactive `team_client_assignments` row.

### Risk summary
- A permissive `current_user_role()` returns the wrong role → every other policy fails open.
- An `is_assigned_to_client()` that forgets `is_active=true` → revoked team members still see their old clients.
- A missing `set search_path` → an attacker who can create a table in their own schema can shadow `public.user_profiles` and lie about their own role.
- A helper that raises → the error message can leak which client_id was queried.

---

## Part 5 — Migration sequencing plan

Each migration is a single PR. **Each migration MUST land with: schema + indexes + RLS enabled + per-table policies + seed fixture + test cases.** Skipping any of those is a regression.

### Migration 001 — Identity foundation
- **Tables:** `user_profiles`, `team_members`
- **Helpers:** `current_user_role`, `current_user_client_id`, `is_owner`, `is_operator`, `is_team_member`, `is_system_actor`
- **RLS:** `enable row level security` on both. Policies: users SELECT their own row; Owner SELECT/UPDATE all; Operator SELECT all.
- **Why safe first:** every other policy depends on these helpers. Nothing else can be migrated until role lookup works.
- **Dependencies:** Supabase `auth.users` exists (provided by Supabase).
- **Seed:** one user per role for dev + a sample team member.
- **Test cases:**
  - `current_user_role()` returns correct role for each test user
  - Anonymous client (`current_user_role()` returns NULL) cannot SELECT any row
  - Client user cannot SELECT another user's `user_profiles` row
  - Owner can UPDATE `role` on a team user, change shows up in next `current_user_role()` call

### Migration 002 — Client foundation
- **Tables:** `clients`, `team_client_assignments`, `client_platforms`, `onboarding_items`, `client_requests`
- **Helpers added:** `is_assigned_to_client`, `can_view_client`, `can_manage_client_operations`, `can_manage_pricing`
- **RLS:** all five tables, plus column-level update on `clients` (pricing fields owner-only). `client_requests` allows client INSERT for own `client_id`. `team_client_assignments`: Owner full CRUD, Operator read + `is_active` toggle, Team read-only-own-active rows.
- **Why safe second:** these are the root identifiers used by every operational table. `team_client_assignments` belongs here (not 001) because it FKs to both `team_members` (from 001) **and** `clients` (created in this migration); placing it here keeps the dependency one-directional. Needs to land before any media/content table can FK to `clients`, and before `is_assigned_to_client()` is referenced by any other policy.
- **Dependencies:** Migration 001.
- **Seed:** `demoClients` (San Antonio fixtures), 1–2 platforms per client, onboarding items per `demoOnboarding`, **`team_client_assignments` rows derived from `demoTeam.ts`** (one active row per team member × assigned client, `assignment_role` defaulted to `'executor'`).
- **Test cases:**
  - Client sees own `clients` row only
  - Team user sees only assigned clients
  - Client can UPDATE `primary_contact_email` but not `plan_type`
  - Operator can UPDATE `account_status` but not `monthly_fee_cents`
  - Owner can UPDATE `monthly_fee_cents`
  - Client cannot SEE `client_platforms.notes`
  - A team user with an `is_active=false` row in `team_client_assignments` does **not** see that client's rows (revocation is honored)
  - Removing an assignment (setting `is_active=false`) cuts SELECT visibility on the next statement, with no per-session caching staleness

### Migration 003 — Media foundation
- **Tables:** `media_assets`, `client_health_snapshots`, `notifications`, `activity_logs`
- **RLS:** Client INSERT on `media_assets` with `source_type='client_upload'` and `review_status='uploaded'` pinned in `with check`. Append-only INSERT policy on `activity_logs` (system + operator + owner only); SELECT scoped by `can_view_client`.
- **Why safe third:** the audit/observability layer must exist before posting tables can write to it. Notifications are needed before any team workflow surfaces them.
- **Dependencies:** Migrations 001, 002.
- **Seed:** `demoMediaItems`, sample `demoNotifications`, a week of `client_health_snapshots`, no `activity_logs` seed (those accrete naturally).
- **Test cases:**
  - Client can INSERT a media asset for their own `client_id` only
  - Client cannot set `review_status='approved'` on insert
  - Team user can UPDATE `review_status` on assigned clients only
  - Operator can SELECT `activity_logs` for any client
  - Client cannot SELECT any `activity_logs` row
  - System role can INSERT `client_health_snapshots`

### Migration 004 — Posting foundation
- **Tables:** `posts`, `post_slots`
- **RLS:** Client SELECT restricted to `post_status='published'`. Team UPDATE forbidden once `post_status='published'`. System UPDATE for publish-result transitions.
- **Why safe fourth:** content concepts/drafts don't exist yet, so `posts.concept_id` and `posts.draft_variant_id` start NULL. Wire them in Migration 006.
- **Dependencies:** Migrations 002, 003 (media + activity log).
- **Seed:** `demoContentPipelineItems` and `demoCalendarSlots` mapped to seed clients.
- **Test cases:**
  - Client cannot SELECT a `posts` row with `post_status='planning'`
  - Team user cannot UPDATE `posts.published_at` directly
  - Operator can UPDATE `post_status` but write triggers `activity_logs` row
  - Unique `(client_id, platform_name, slot_date, slot_time)` enforced on `post_slots`

### Migration 005 — Reporting foundation
- **Tables:** `weekly_reports`, `monthly_reports`
- **RLS:** Client SELECT only `status='published'`. Operator-only transition to `approved`/`published` (UPDATE policy gated on caller being operator/owner AND the `status` transition being legal).
- **Why safe fifth:** reports reference `posts` (top_post_id) so posts must exist.
- **Dependencies:** Migration 004.
- **Seed:** the past 2 weeks/months for each seed client.
- **Test cases:**
  - Client cannot SELECT a `drafted` weekly report
  - Team can transition `drafted → validated` only on assigned clients
  - Operator can transition `validated → published`
  - Operator cannot transition `monthly_reports` directly from `drafting → published` (must go through `operator_review → approved`)

### Migration 006 — Content AI foundation
- **Tables:** `content_concepts`, `draft_sets`, `draft_variants`, `ai_agents`
- **Wire FKs:** add `posts.concept_id` and `posts.draft_variant_id` FK constraints now that the targets exist.
- **RLS:** Client has zero access to any of these. Team gets full CRUD on assigned clients. `ai_agents` config is operator-read, owner-write.
- **Why safe sixth:** by now the core pipeline runs without AI; layering AI on top is additive, not blocking.
- **Dependencies:** Migrations 002–004.
- **Seed:** `demoContentConcepts` (derived from `demoPosts.ts`), agent registry from `demoAgents.ts`.
- **Test cases:**
  - Client never sees a `draft_variants` row, even with `used_in_post_id` set
  - Toggling `ai_agents.is_enabled` requires owner role
  - Team user can INSERT a `content_concepts` row for assigned client only

### Migration 007 — Business analytics
- **Tables:** `financial_snapshots`, `system_status`
- **RLS:** Operator read, Owner write. No Client/Team visibility.
- **Why safe last:** business-level rollup that depends on every other table being populated. Safe to land last.
- **Dependencies:** all prior migrations.
- **Seed:** 1 trailing month of `financial_snapshots`; static `system_status` rows mirroring `demoSystemStatus`.
- **Test cases:**
  - Client cannot SELECT any row
  - Team cannot SELECT any row
  - Operator can SELECT but not INSERT/UPDATE
  - Owner can INSERT, UPDATE
  - Anonymous (no JWT) gets zero rows

---

## Part 6 — Seed data strategy

All seed scripts live under `supabase/seed/` (future) or `scripts/seed/` (TypeScript loader). **Never seed `auth.users` from a public file** — use `supabase admin auth.users.create` from a dev-only script with credentials pulled from secrets.

### Mapping (demo → seed)

| Demo file | Seed file | Idempotent? | Dev-only? | Notes |
|---|---|---|---|---|
| `demoClients.ts` | `seed_clients.ts` | yes | yes | Stable UUIDs required — every other seed FKs to these. Use `v5` UUIDs derived from `business_name` slugs. |
| (implicit) | `seed_user_profiles.ts` | yes | yes | One user per role: `client@…`, `team@…`, `operator@…`, `owner@…`. **Never seed in production.** |
| `demoTeam.ts` (members) | `seed_team_members.ts` | yes | yes | One row per internal user with `role_label`. No assignment columns. |
| `demoTeam.ts` (assignments) | `seed_team_client_assignments.ts` | yes | yes | Derived join rows: one per (team_member, client) pair, `assignment_role='executor'`, `is_active=true`. Idempotent via `unique (team_member_id, client_id)`. |
| `demoOnboarding.ts` | `seed_onboarding_items.ts` | yes | yes | Idempotent via `unique (client_id, item_key)`. |
| `demoMediaAssets.ts` | `seed_media_assets.ts` | yes | yes | File URLs point to Supabase Storage dev bucket — pre-uploaded once. |
| `demoNotifications.ts` | `seed_notifications.ts` | yes | yes | Recent-dated relative to seed-run time. |
| `demoActivityLogs.ts` | `seed_activity_logs.ts` | yes | yes | Historical only — production accretes its own. |
| `demoWeeklyReports.ts` | `seed_weekly_reports.ts` | yes | yes | Date-shifted relative to "today". |
| `demoMonthlyReports.ts` | `seed_monthly_reports.ts` | yes | yes | Same date shift. |
| `demoPosts.ts` (content pipeline) | `seed_posts.ts` | yes | yes | Includes pre-publish states. |
| `demoPostSlots.ts` | `seed_post_slots.ts` | yes | yes | |
| `demoRequests.ts` | `seed_client_requests.ts` | yes | yes | |
| `demoAgents.ts` | `seed_ai_agents.ts` | yes | **prod OK** | Agent registry is product config, not demo data. Default `is_enabled=false`. |
| `demoTeam.ts` (metrics, oversight) | — | n/a | — | Computed at query time; do not seed. |
| `demoOperations.ts` (queues, digests) | — | n/a | — | Computed views, not base-table seeds. |
| `demoFinancials.ts` | `seed_financial_snapshots.ts` | yes | yes | Dev only. Production data is generated by month-end jobs. |
| `demoOwner.ts` (command center, briefing) | — | n/a | — | Computed at query time. |
| `demoSystemStatus.ts` | `seed_system_status.ts` | yes | **prod OK** | Display registry. Idempotent upsert on `label`. |
| `demoClientHealth.ts` | `seed_client_health_snapshots.ts` | yes | yes | One row per client for "today" — production jobs take over after. |

### Excluded from production seeds
- All `seed_*` files marked **dev-only** above
- Every `auth.users` insert — production users are created via signup flow / admin invite
- `demoNotifications`, `demoActivityLogs`, `demoRequests` — production accretes these naturally
- `financial_snapshots` past data — production starts empty and rolls forward

### Stable IDs that must not drift
- `clients.id` for the dev fixtures (used across every other seed)
- `user_profiles.id` for the four dev role users
- `ai_agents.agent_key` (the stable text key; the UUID can be generated)
- `system_status.label`

### Idempotency contract
Every seed file must be safe to re-run. Use:
- `insert ... on conflict (id) do nothing` for FK-anchor tables
- `insert ... on conflict (...unique cols...) do update set ...` for upsert-style fixtures (`onboarding_items`, `system_status`)
- A single `truncate` block guarded by `NODE_ENV !== 'production'` for "reset & reseed" flows

---

## Part 7 — Auth activation checklist

This is the gating checklist for flipping `AUTH_MODE` from `"placeholder"` to `"real"`. **Do not flip until every box is checked.**

### Infrastructure
- [ ] Supabase project created, region pinned to `us-central` (closest to San Antonio)
- [ ] Project URL + anon key + service-role key set in env (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` already exist; service role key added as a secret, **never** to the client bundle)
- [ ] Database backups enabled (daily PITR minimum)
- [ ] Connection pool sized for expected traffic

### Schema & policies
- [ ] Migrations 001–007 applied to dev and verified against the test suite
- [ ] `enable row level security` audited on every table via `pg_tables` / `pg_policies`
- [ ] No table without at least one policy
- [ ] All helper functions present and unit-tested
- [ ] Policies pass the per-migration test matrix in Part 5

### Users
- [ ] One verified user per role exists (`client`, `team`, `operator`, `owner`)
- [ ] At least one test `clients` row linked to the client user via `user_profiles.client_id`
- [ ] At least one team user assigned to ≥1 client (via an active row in `team_client_assignments` AND/OR `clients.assigned_operator_id`)
- [ ] Operator can SELECT all clients but **cannot** UPDATE `monthly_fee_cents`
- [ ] Owner can UPDATE `monthly_fee_cents`

### Cross-tenant isolation
- [ ] Client A cannot SELECT Client B's `clients` row
- [ ] Client A cannot SELECT Client B's `media_assets`, `posts`, `notifications`, `weekly_reports`, `monthly_reports`
- [ ] Client cannot SELECT any `draft_variants`, `content_concepts`, `activity_logs`, `financial_snapshots`
- [ ] No public demo route exposes protected data (audit `src/lib/demoRoutes.ts`)
- [ ] No portal page constructs a query that bypasses Supabase (no direct `service_role` from the browser)

### Auth flow
- [ ] Login (email/password or magic link) tested end-to-end
- [ ] Logout clears Supabase session and redirects to public landing
- [ ] Session refresh works across tabs
- [ ] Password reset flow works
- [ ] Sign-up flow gated (invite-only for V1 — no public sign-up creates a `client` row by accident)

### Rollback
- [ ] Documented rollback: set `AUTH_MODE` back to `"placeholder"`, redeploy
- [ ] Backup snapshot taken immediately before cut-over
- [ ] On-call contact identified for the first 24 hours

### Observability
- [ ] Supabase logs piped to a sink (or at minimum, log explorer access tested)
- [ ] Client-side error tracking captures Supabase errors with role context

---

## Part 8 — Storage / media rules planning

### Recommended bucket layout

**Single bucket: `client-media`** (private, no public access).

```
client-media/
  {client_id}/
    raw/         — client uploads, awaiting AI/team review
    approved/    — team-approved, ready for use in posts
    archive/     — used + retained for reuse, or rejected & kept for audit
```

Alternatives considered:
- **Per-client bucket** (`client-{id}-media`): cleaner isolation, but Supabase bucket count limits and the policy duplication make this worse at scale. Rejected.
- **Per-status bucket** (`media-raw` / `media-approved`): forces cross-bucket moves on status changes, which is racy. Rejected.

### File limits (V1)
- Max size: **50 MB** per file
- Allowed MIME types:
  - Images: `image/jpeg`, `image/png`, `image/webp`, `image/heic`
  - Videos: `video/mp4`, `video/quicktime`, `video/webm`
- Reject everything else at the storage policy level, not just in the UI

### Per-client folder isolation (policies)
- INSERT policy: `bucket_id = 'client-media' AND (storage.foldername(name))[1] = auth_client_id()::text` for client users; `can_manage_client_operations(...)` for team/operator/owner
- SELECT policy: same shape — folder name must match a `client_id` the caller is authorized for
- UPDATE / DELETE: team/operator/owner for assigned clients only; clients cannot delete (must request via `client_requests`)

### Signed URL strategy
- All client-facing reads use **signed URLs** (default expiry 1 hour)
- Operator/team admin views may use longer expiry (24 hours) for usability
- Never expose raw public URLs — every `media_assets.file_url` is a signed URL minted at read time, **not** stored permanently

### Upload flow
- Client uploads via signed upload URL minted by an Edge Function (verifies role + client_id before signing)
- Direct browser-to-Supabase upload using the signed URL (no proxying)
- On upload completion, a webhook (or client confirmation) writes the `media_assets` row with `review_status='uploaded'`

### Orphan cleanup
- Daily cron: list every object in `client-media/`; cross-reference against `media_assets.file_url`; delete objects with no matching DB row that are older than 24 hours (gives upload flow a grace period)
- Daily cron also: list `media_assets` rows; delete rows whose underlying object is missing AND `review_status in ('rejected', 'reusable_archive')` for more than 90 days

### Out of scope for V1
- CDN fronting (Supabase Storage's CDN is sufficient)
- Per-file watermarking (handled at post-render time, not on storage)
- Cross-region replication

---

## Part 9 — Activity log strategy

### The three options

**Option A — App writes `activity_logs`**
- Pros: full control over `description` and `new_value_json`; role attribution comes from the JWT cleanly; easy to test
- Cons: any code path that forgets to log is a silent audit hole; system-level changes (cron jobs) are easy to miss

**Option B — Postgres triggers write `activity_logs`**
- Pros: impossible to bypass; truly append-only; works for ad-hoc `psql` writes too
- Cons: role attribution is awkward (triggers see the session role, not the application's `user_profiles.role`); descriptions are generic; complex business changes are hard to capture meaningfully; harder to test

**Option C — Hybrid (recommended)**
- App writes a rich row for **business-meaningful events** with full context (the bulk of audit data)
- A minimal "safety net" trigger writes a low-detail row for **column-level changes on a small set of compliance-critical fields** even if the app forgets

### Recommended V1: Hybrid

**App-written events (Option A) — primary audit source.** Required at every:
- Status transition: `posts.post_status`, `weekly_reports.status`, `monthly_reports.status`, `media_assets.review_status`, `client_requests.status`, `onboarding_items.status`
- Report approval / publication
- Notification creation / escalation
- Client request creation / completion
- Onboarding completion
- AI agent action (with `agent_key` in `new_value_json`)

**Trigger-written events (Option B) — safety net only.** A single trigger function fires on UPDATE to a hard-coded list of compliance-critical columns:
- `clients.plan_type`
- `clients.service_package`
- `clients.monthly_fee_cents`
- `clients.account_status` (only when transitioning to `closed` / `paused` / `at_risk`)
- `user_profiles.role`
- `user_profiles.is_active`
- `ai_agents.is_enabled`

These triggers do not depend on app code. Even if a future feature forgets to log, pricing/role/agent changes still leave a trace.

### Role attribution
- App rows: `performed_by_role` = `current_user_role()`; `performed_by_user_id` = `auth.uid()`
- Trigger rows: `performed_by_role` = `current_user_role()` if available, else `'system'`; `performed_by_user_id` = `auth.uid()` if available, else NULL

### Why this combo
- The app layer captures intent (what the user was trying to do)
- The trigger captures truth (what actually changed in the DB)
- Together they cover both "user did a thing through the UI" and "someone touched a row out of band"
- Both write through the **same** `activity_logs` table — one source of truth for the audit timeline

### Defer to V2
- Streaming activity log to an external SIEM
- Cryptographic chaining of rows (hash-linked audit)

---

## Part 9b — Pre-migration checklist

Run through this list **before** creating real migration files in `supabase/migrations/`. Every item must be checked off in writing (or explicitly waived with a rationale) — it is the dam between "planning" and "production code".

- [ ] **`team_client_assignments` design confirmed** — replaces the deprecated `team_members.assigned_client_ids` array; FKs, unique constraint, and `assignment_role` enum locked.
- [ ] **Client-safe views planned** — every protected column on a client-readable table either lives in a `client_portal_*_view` projection or is documented as intentionally exposed.
- [ ] **Security definer helper rules documented** — explicit schema, `set search_path`, `stable`, no exceptions, no dynamic SQL, restricted EXECUTE grants. Helper unit-test fixture list written.
- [ ] **Pricing writes Owner-only** — `clients.plan_type`, `clients.service_package`, `clients.monthly_fee_cents` enforced both by RLS policy AND a `before update` trigger that raises on non-owner attempts. Backed by audit-log entry.
- [ ] **Client cannot query base sensitive tables directly** — `revoke select on <sensitive_base_tables> from client_role` planned; `grant select on <client_portal_*_view> to client_role` listed.
- [ ] **One-user-per-role test plan written** — explicit fixture list (`client@…`, `team@…`, `operator@…`, `owner@…`) plus the cross-tenant probe set: Client A ↛ Client B's media / posts / reports / notifications; revoked team member ↛ assigned client's rows.
- [ ] **Seed ID strategy finalized** — `clients.id` and `user_profiles.id` for dev fixtures pinned to deterministic `v5` UUIDs; `ai_agents.agent_key` and `system_status.label` documented as stable text keys.
- [ ] **Rollback plan drafted** — `AUTH_MODE='placeholder'` flip-back procedure, pre-cutover backup snapshot, on-call contact, and the exact migration `down`-equivalent strategy (or "forward-only + restore from backup" if that's the choice).
- [ ] **Storage rules planned but not implemented** — `client-media` bucket layout (`{client_id}/raw|approved|archive`), MIME/size limits, signed-URL policy, orphan cleanup cron. No buckets actually created.
- [ ] **Activity log write strategy confirmed** — Hybrid (Option C): app writes business events; narrow Postgres trigger writes safety-net rows for pricing/role/agent column changes. Trigger column list explicit.
- [ ] **Demo seed → real seed file mapping reviewed** — every entry in Part 6's table either has a planned seed file or is explicitly marked "computed at query time, never seeded".
- [ ] **No real-auth env vars wired into the client bundle** — service-role key only ever in server-side secrets; `VITE_*` exposes only the anon key.

If any checkbox can't be ticked, the corresponding plan section is the next thing to write, not the migration itself.

---

## Part 10 — Final report

**Files created in this pass**
1. `artifacts/veroxa/docs/SUPABASE_RLS_PLAN_V1.md` (this document)
2. `artifacts/veroxa/docs/sql_drafts/002_rls_policy_examples.sql` (commented examples; DO NOT RUN)

**Files modified:** none.

**RLS plan summary:** 5 principals defined (Client, Team, Operator, Owner, System). Strict per-role rules for SELECT / INSERT / UPDATE / DELETE on every table. Column-level Owner-only writes for pricing fields. Append-only audit log. Service role bypasses RLS for background jobs and triggers.

**Table-by-table matrix summary:** All 19 tables covered (Part 3). Clients always own-scoped, Team always assigned-scoped, Operator always all-rows with selective writes, Owner unrestricted, System append-only.

**Helper functions planned:** 10 — `current_user_role`, `current_user_client_id`, `is_owner`, `is_operator`, `is_team_member`, `is_assigned_to_client`, `can_view_client`, `can_manage_client_operations`, `can_manage_pricing`, `can_view_owner_metrics`, `is_system_actor`. All `security definer`, `stable`, default-deny on missing data, with explicit `set search_path = pg_catalog, public`, no dynamic SQL, no exception throwing, restricted `EXECUTE` grants. `is_assigned_to_client` now reads `team_client_assignments` (join table) — the array-based `team_members.assigned_client_ids` is deprecated and out of the real design.

**Migration sequencing summary:** 7 migrations, each landing schema + indexes + RLS + seed + tests together. Order: identity → clients → media/audit → posting → reporting → content AI → analytics.

**Seed strategy summary:** Per-demo-file seed plan in Part 6. Stable UUIDs for `clients` and dev users. Idempotent inserts. Strict dev-only / prod-OK split. Computed data (queues, briefings) never seeded.

**Auth activation checklist summary:** Five-section gate (infra, schema/policies, users, cross-tenant isolation, auth flow, rollback, observability) in Part 7. Flipping `AUTH_MODE='real'` is forbidden until every box is checked.

**Storage / media planning summary:** Single private `client-media` bucket, per-client top-level folder with `raw/`, `approved/`, `archive/` subfolders. Signed-URL reads only. Storage policies enforce folder-level isolation by `client_id`. Daily orphan cleanup cron.

**Activity log strategy recommendation:** Hybrid (Option C). App writes the rich audit rows for business-meaningful events; a narrow Postgres trigger writes a safety-net row for compliance-critical column changes (pricing, role, account_status closures, agent enablement). Both feed the same `activity_logs` table.

**Recommended next prompt (after this one):** "Author `docs/SUPABASE_OBSERVABILITY_V1.md` covering: PostHog/Sentry wiring for the portal, server-side error capture for Edge Functions, log shipping for Supabase logs, alert rules on RLS denial spikes, and a runbook for the first three weeks of production." Or, alternatively: "Run the testing skill to confirm the placeholder portal still routes correctly under all four demo roles, so the auth-activation cutover starts from a known-good baseline."
