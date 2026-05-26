# Migration 002 — Client Foundation: Planning Document

**Status:** Planning only. No SQL draft file has been created. No
migration has been applied. `AUTH_MODE` remains `"placeholder"`.

This document is the source-of-truth plan for the second real Supabase
migration. The actual draft SQL file (`docs/sql_drafts/migrations_review/002_client_foundation_draft.sql`)
will be authored in a follow-up pass once this plan is reviewed and
approved.

---

## 1. Purpose

Migration 002 introduces the **client foundation** — the business
entities and the team↔client assignment join table that everything
operational (media, posts, reports, AI agents) will hang off of.

### Dependency

Migration 002 **depends on Migration 001** (identity foundation).
Required pre-existing objects:

- `public.user_profiles` (with the `client_id` column already present but no FK)
- `public.team_members`
- The `private` schema and the six identity helpers
- `public.set_updated_at()` trigger function

Migration 002 must not be applied before 001 has succeeded.

### Scope of Migration 002

Included:
- `clients`
- `team_client_assignments` (replaces the deprecated `team_members.assigned_client_ids uuid[]`)
- `client_platforms`
- `onboarding_items`
- `client_requests`
- Add FK `user_profiles.client_id → clients(id) on delete set null`
- New helpers: `is_assigned_to_client`, `can_view_client`, `can_manage_client_operations`, `can_manage_pricing`
- Pricing-write owner-only trigger on `clients`
- Per-table RLS
- Indexes

**Explicitly NOT in scope** (deferred to M003+):
- `media_assets`, `media_versions`
- `posts`, `post_slots`, `post_schedule_windows`
- `reports`, `report_sections`
- `notifications`
- `activity_logs`
- AI / content concept tables (`ai_agents`, `content_concepts`, etc.)
- Storage buckets and storage RLS
- Publishing integration tables
- Financial snapshots, owner-only metrics

---

## 2. Tables

### 2.1 `clients`

Columns:

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | |
| `business_name` | `text not null` | |
| `legal_name` | `text null` | |
| `primary_contact_name` | `text not null` | |
| `primary_contact_email` | `text not null` | |
| `primary_contact_phone` | `text null` | |
| `secondary_contact_name` | `text null` | |
| `secondary_contact_email` | `text null` | |
| `cuisine_type` | `text null` | |
| `address` | `text null` | |
| `website_url` | `text null` | |
| `hours_text` | `text null` | |
| `plan_type` | `text not null check (plan_type in ('twelve_month','six_month','three_month','no_contract','month_to_month'))` | |
| `service_package` | `text not null check (service_package in ('google_presence_starter','complete_online_presence','ads_addon','ads_only','bundle'))` | |
| `monthly_fee_cents` | `integer not null` | cents, never dollars; owner-only write |
| `contract_months` | `integer null` | |
| `start_date` | `date null` | |
| `posting_frequency_weekly` | `integer not null default 3` | |
| `timezone` | `text not null` | required; **no Toronto default**; demo seed uses `America/Chicago` |
| `assigned_operator_id` | `uuid null references public.user_profiles(id) on delete set null` | the single operator owning the account |
| `assigned_team_label` | `text null` | informational; real assignments live in `team_client_assignments` |
| `account_status` | `text not null default 'onboarding'` | check list TBD — at minimum `onboarding`, `active`, `paused`, `cancelled` |
| `content_health_status` | `text not null default 'healthy'` | check list TBD — `healthy`, `at_risk`, `behind` |
| `risk_status` | `text not null default 'good'` | check list TBD — `good`, `watch`, `intervene` |
| `onboarding_complete` | `boolean not null default false` | |
| `created_at` | `timestamptz not null default now()` | |
| `updated_at` | `timestamptz not null default now()` | trigger via `public.set_updated_at()` |

Required SQL comments:
- `timezone` — required; no Toronto default
- `monthly_fee_cents` — cents, owner-only write (enforced by trigger)
- `service_package` — Google Presence Starter is a **package**, not a `plan_type`
- Pricing values must remain unchanged from the locked table:
  - GPS: $497/mo → `monthly_fee_cents = 49700`
  - COP 12-month: $997/mo → `99700`
  - COP 6-month: $1,097/mo → `109700`
  - COP 3-month: $1,197/mo → `119700`
  - COP no-contract: $1,497/mo → `149700`

### 2.2 `team_client_assignments`

Replaces the deprecated `team_members.assigned_client_ids uuid[]`.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | |
| `team_member_id` | `uuid not null references public.team_members(id) on delete cascade` | |
| `client_id` | `uuid not null references public.clients(id) on delete cascade` | |
| `assignment_role` | `text not null default 'executor' check (assignment_role in ('executor','reviewer','scheduler','reporter','lead'))` | |
| `is_active` | `boolean not null default true` | |
| `created_at` | `timestamptz not null default now()` | |
| `updated_at` | `timestamptz not null default now()` | trigger via `public.set_updated_at()` |

Constraints:
- `unique (team_member_id, client_id)` — one assignment row per (member, client) pair. Deactivate by flipping `is_active`, not by inserting a duplicate.

Purpose:
- Replaces `assigned_client_ids` array
- Enables safer RLS (helpers can filter on `is_active`)
- Enables assignment auditability (rows persist after deactivation)
- Supports future multi-team workflows (multiple members per client, multiple clients per member)

### 2.3 `client_platforms`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | |
| `client_id` | `uuid not null references public.clients(id) on delete cascade` | |
| `platform_name` | `text not null check (platform_name in ('instagram','facebook','google_business','tiktok','other'))` | |
| `access_status` | `text not null default 'pending' check (access_status in ('pending','granted','verified','revoked'))` | |
| `username_or_handle` | `text null` | client-visible |
| `notes` | `text null` | **internal — never exposed to client** |
| `last_verified_at` | `timestamptz null` | |
| `created_at` | `timestamptz not null default now()` | |
| `updated_at` | `timestamptz not null default now()` | |

**Security note:** the eventual `client_portal_client_platforms_view`
(M003+) must omit `notes` and may want to expose only a coarse
`access_status` plus a "needs your action / on us" flag.

### 2.4 `onboarding_items`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | |
| `client_id` | `uuid not null references public.clients(id) on delete cascade` | |
| `item_key` | `text not null` | stable identifier (e.g. `connect_instagram`) |
| `item_label` | `text not null` | display label |
| `description` | `text null` | |
| `status` | `text not null default 'not_started' check (status in ('not_started','pending','complete','blocked'))` | |
| `owner_role` | `text not null check (owner_role in ('client','team','operator','veroxa'))` | who must act |
| `priority` | `text not null default 'medium'` | check list TBD — `low`, `medium`, `high` |
| `completed_by_role` | `text null` | audit trail |
| `completed_at` | `timestamptz null` | |
| `created_at` | `timestamptz not null default now()` | |
| `updated_at` | `timestamptz not null default now()` | |

Constraints:
- `unique (client_id, item_key)` — recommended; prevents duplicate items.

### 2.5 `client_requests`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | |
| `client_id` | `uuid not null references public.clients(id) on delete cascade` | |
| `request_type` | `text not null` | check list TBD (e.g. `content_change`, `schedule_change`, `account_question`) |
| `title` | `text not null` | |
| `description` | `text null` | |
| `status` | `text not null default 'pending' check (status in ('pending','in_progress','completed','cancelled'))` | |
| `priority` | `text not null default 'normal' check (priority in ('low','normal','high'))` | |
| `requested_by_user_id` | `uuid null references public.user_profiles(id) on delete set null` | preserves history even if user deleted |
| `assigned_to_role` | `text null check (assigned_to_role in ('team','operator','owner'))` | |
| `due_date` | `date null` | |
| `created_at` | `timestamptz not null default now()` | |
| `updated_at` | `timestamptz not null default now()` | |

---

## 3. FK addition to `user_profiles`

Migration 002 adds:

```
alter table public.user_profiles
  add constraint user_profiles_client_id_fkey
  foreign key (client_id) references public.clients(id)
  on delete set null;
```

Rationale:
- Client users get linked to exactly one client.
- Team / operator / owner users almost always have `client_id = null`.
- This FK could not exist in Migration 001 because `clients` did not exist yet — the column was created in M001 without a constraint, and `current_user_client_id()` already references it safely (returns NULL when unset).

Pre-flight (must hold before adding the constraint):
- Every existing `user_profiles.client_id` is either NULL or points to a real `clients.id`. If any orphan UUIDs exist (which shouldn't, on a greenfield), null them out before the `alter`.

---

## 4. Helper functions (Migration 002 additions)

All in `private` schema; same safety rules as M001:
- explicit schema
- `security definer`
- `stable`
- `set search_path = pg_catalog, public`
- no dynamic SQL
- false / null fallback
- EXECUTE revoked from `public`, granted only to `authenticated` + `service_role`

### 4.1 `private.is_assigned_to_client(p_client uuid) returns boolean`

Returns `true` when the current user has an **active** assignment row
for the given client, OR is operator/owner (which short-circuit).

Reads `team_client_assignments` joined to `team_members` joined to
`user_profiles` (`user_profiles.id = auth.uid()`), with `tca.is_active = true`
and `tm.is_active = true`. **No array logic.** Returns `false` for anon,
inactive users, clients, and team members with no matching active row.

### 4.2 `private.can_view_client(p_client uuid) returns boolean`

Returns `true` when:
- caller is the client owning the row (`current_user_client_id() = p_client`), OR
- caller is operator/owner, OR
- `is_assigned_to_client(p_client)` is `true`.

This is the helper that 90% of operational-table policies will reach
for in M003+.

### 4.3 `private.can_manage_client_operations(p_client uuid) returns boolean`

Stricter than `can_view_client`. Returns `true` for operator/owner, and
for team members whose active assignment role is in
(`'executor'`, `'reviewer'`, `'scheduler'`, `'lead'`). Excludes
`'reporter'` (read-only) and excludes clients (clients never manage
operations).

### 4.4 `private.can_manage_pricing() returns boolean`

Returns `true` only when `is_owner()` is true. A trivial alias today,
but the indirection lets future logic (e.g. "owner + during business
hours + with 2FA") plug in without rewriting every policy that gates
on it.

---

## 5. RLS plan (per table)

### 5.1 `clients`

- **Client:** can `select` only their own row (via `current_user_client_id() = id`), and only through `client_portal_clients_view` for sensitive-field hiding (`monthly_fee_cents`, internal status fields, `assigned_operator_id`). M002 enables RLS and adds the base-table policy; the view ships with the M003 portal pass. **No direct base-table reads from client-role users in production** — enforced at the policy level by limiting client SELECT to a column-safe subset, or by routing the portal through the view with `security_invoker=true`.
- **Team:** can `select` only assigned clients (`is_assigned_to_client(id)`).
- **Operator:** can `select` all clients; can `update` operational fields (`account_status`, `content_health_status`, `risk_status`, `posting_frequency_weekly`, `assigned_team_label`); **cannot** update pricing or `assigned_operator_id`.
- **Owner:** full access including pricing, `assigned_operator_id`, and structural fields.
- **System:** updates derived fields via service-role key (RLS bypass).

**Pricing-write owner-only trigger:** a `before update on clients` trigger blocks changes to `monthly_fee_cents`, `plan_type`, `service_package`, `contract_months`, `start_date` unless `is_owner()` returns true. Same column-guard pattern as M001's `user_profiles_column_write_guard`. Also blocks `assigned_operator_id` changes by non-owner.

### 5.2 `team_client_assignments`

- **Client:** no access.
- **Team:** `select` their own active assignments only (`team_member_id` resolves to `auth.uid()` via `team_members.user_profile_id`, filtered `is_active = true`).
- **Operator:** `select` all assignments; **cannot** insert/update (assignment changes are owner-only).
- **Owner:** create / update / deactivate (`is_active=false`) any assignment.
- **System:** insert/update via service-role key only.

### 5.3 `client_platforms`

- **Client:** `select` own client's rows via the future `client_portal_client_platforms_view` (omits `notes`). Base-table client access is blocked by policy.
- **Team:** can `select` and `update` rows for assigned clients (`can_manage_client_operations(client_id)`). Can insert new platform rows for assigned clients.
- **Operator:** view/manage all operationally.
- **Owner:** full access.

### 5.4 `onboarding_items`

- **Client:** can `select` rows where `client_id = current_user_client_id()`. Can `update` rows where `owner_role = 'client'` AND `client_id = current_user_client_id()` (limited to flipping `status` from `pending` → `complete` and back; enforced by trigger or by the portal mutation layer in M003).
- **Team:** can `select` + `update` assigned-client onboarding items (`can_manage_client_operations`).
- **Operator / Owner:** view all; full update.

### 5.5 `client_requests`

- **Client:** can `select` and `insert` rows where `client_id = current_user_client_id()`. Can `update` own rows in limited ways — specifically, can flip `status` from `pending` → `cancelled` only (enforced by trigger or portal mutation layer). Cannot edit `request_type`, `assigned_to_role`, `priority` (those are staff-side fields).
- **Team:** can `select` and `update` assigned-client requests (`can_manage_client_operations`).
- **Operator:** view all + update any.
- **Owner:** view all + update any.

---

## 6. Indexes

Per the prompt + reasonable additions for the queries each table will
actually serve:

- `clients (account_status)`
- `clients (service_package)`
- `clients (plan_type)`
- `clients (assigned_operator_id)`
- `team_client_assignments (team_member_id)`
- `team_client_assignments (client_id)`
- `team_client_assignments (is_active)`
- `client_platforms (client_id)`
- `client_platforms (platform_name)`
- `onboarding_items (client_id)`
- `onboarding_items (status)`
- `client_requests (client_id)`
- `client_requests (status)`

Indexes that are NOT added (and why):
- No composite `(team_member_id, client_id)` — already covered by the unique constraint, which creates an index.
- No partial indexes yet (e.g. `where is_active`) — defer until query patterns are measured.

---

## 7. Seed strategy

Maps the current React demo data to the new tables. **Dev-only**;
production deployments must not be seeded with these fixtures.

| Demo source | Target table |
|---|---|
| `demoClients.ts` | `clients` |
| `demoOnboarding.ts` | `onboarding_items` |
| `demoRequests.ts` | `client_requests` |
| `demoClientPlatforms` (or whatever the platform fixture is) | `client_platforms` |
| `demoTeam.ts` + the M001 user/team fixture set | `team_client_assignments` |

Rules:
- Seeds run **only** in dev / staging projects.
- Seed IDs are stable (hard-coded UUIDs in the seed file) so re-runs are idempotent and the demo URLs don't break.
- Seeds are idempotent: `insert ... on conflict (id) do update set ...`.
- **No real client PII** in seed files — use clearly fictional business names and `@example.test` emails.
- Pricing fields in seed rows must match the locked pricing table verbatim (in cents).
- Seed runs as service role (RLS bypass) inside a `begin … commit` block.

---

## 8. Test plan outline

To be materialized into `docs/MIGRATION_002_TEST_PLAN.md` when the M002
draft SQL is authored. Headline cases:

1. **Client-portal data hiding** — client cannot see `monthly_fee_cents` through the portal view (and base-table client access is policy-denied).
2. **Cross-tenant isolation** — Client A cannot see Client B's `clients` / `onboarding_items` / `client_requests` / `client_platforms` rows.
3. **Team assignment scoping** — team member sees only assigned clients; deactivating the assignment (`is_active=false`) revokes visibility on the **next statement** (no caching).
4. **Operator visibility** — operator sees all clients.
5. **Pricing-write guard** — operator cannot change `monthly_fee_cents`; owner can.
6. **Plan/package guard** — operator cannot change `plan_type` or `service_package`; owner can.
7. **Assignment-operator guard** — operator cannot change `assigned_operator_id`; owner can.
8. **Active/inactive assignment flip** — flipping `is_active` does not delete the row; reactivation restores visibility immediately.
9. **Client request creation** — client can create requests for own `client_id`; cannot create requests for any other `client_id` (RLS denies).
10. **Onboarding ownership** — client can only complete `owner_role='client'` items on their own client; cannot complete `owner_role='team'` items.
11. **Client platform notes hidden** — `notes` column never appears in any client-reachable view.
12. **Helper short-circuits** — `can_view_client` returns true for operator/owner regardless of assignment.
13. **Helper inactive-user behavior** — an inactive operator (`user_profiles.is_active=false`) loses operator powers immediately (because `current_user_role()` returns NULL).
14. **FK behavior on `user_profiles.client_id`** — assigning a non-existent `client_id` fails; deleting the referenced client nulls the column (`on delete set null`).
15. **Helper EXECUTE grants** — anon cannot execute any new helper; authenticated and service_role can.

---

## 9. Migration 002 draft SQL — decision

**Decision (this pass): planning-only; the SQL draft file is NOT created in this pass.**

Rationale: the prompt makes the SQL draft optional ("If it feels too
risky, skip SQL draft and only create the planning doc"). The plan
above is concrete enough that the eventual draft will be a near-
mechanical translation, and keeping the SQL out of this pass:
- keeps the M001 correction the headline review item (cleaner sign-off),
- avoids landing a five-table SQL file that would be the largest single
  artifact in the repo before its planning has been signed off,
- leaves the next prompt with a tight, single-deliverable scope.

When the M002 draft SQL is authored, the file must:
- live at `docs/sql_drafts/migrations_review/002_client_foundation_draft.sql`
- carry the standard `DO NOT RUN — MIGRATION REVIEW DRAFT ONLY` header
- ship alongside `docs/MIGRATION_002_TEST_PLAN.md`
- be reviewed in a follow-up audit pass (same shape as the M001 audit)
- not be promoted to `supabase/migrations/` until both the test plan is
  green on a dev project and the M001 → real promotion has happened
  (M002 cannot apply before M001).

---

## 10. Cross-references

- M001 draft: `docs/sql_drafts/migrations_review/001_identity_foundation_draft.sql`
- M001 test plan + Blocking Issues: `docs/MIGRATION_001_TEST_PLAN.md`
- Schema source of truth: `docs/SUPABASE_SCHEMA_DRAFT_V1.md`
- RLS source of truth: `docs/SUPABASE_RLS_PLAN_V1.md`
- Earlier policy sketches: `docs/sql_drafts/002_rls_policy_examples.sql`
- Demo data inventory: `docs/DEMO_DATA_MAP.md`
