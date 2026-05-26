# Veroxa — Supabase Schema Draft V1

**Status:** Planning draft. **Not** a migration. **Not** wired to any live database.

This document is the future-state blueprint for the Veroxa Supabase schema. It is derived from the cleaned demo data under `src/data/demo/` (see `docs/DEMO_DATA_MAP.md`) and the locked Veroxa OS feature set.

> Do **not** apply any of this yet. `AUTH_MODE` remains `"placeholder"`. No real database, AI APIs, uploads, publishing, or payments are wired.

---

## Pricing reference (locked)

The public pricing page remains the source of truth for display. The database
stores money as **integer cents only** in `clients.monthly_fee_cents`. Only the
Owner role may write to `clients.plan_type`, `clients.service_package`, or
`clients.monthly_fee_cents` (see Part 5 RLS).

| Service / Plan | `service_package` | `plan_type` | `monthly_fee_cents` |
|---|---|---|---|
| Google Presence Starter | `google_presence_starter` | `month_to_month` *(or `no_contract`)* | `49700` |
| Complete Online Presence — 12 month | `complete_online_presence` | `twelve_month` | `99700` |
| Complete Online Presence — 6 month | `complete_online_presence` | `six_month` | `109700` |
| Complete Online Presence — 3 month | `complete_online_presence` | `three_month` | `119700` |
| Complete Online Presence — no-contract | `complete_online_presence` | `no_contract` | `149700` |

> **Google Presence Starter is a service package, not a contract term.** It is
> identified by `service_package='google_presence_starter'`. Its billing
> cadence is captured in `plan_type` (`month_to_month` or `no_contract`),
> never by overloading `plan_type` with a product name.

No other prices (bundle / ads add-on) are listed here — only the values
already locked on the public pricing page. Do not invent additional prices.

---

## Conventions

- **Primary keys:** `id uuid primary key default gen_random_uuid()`
- **Timestamps:** `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()` (updated by trigger or app code)
- **Foreign keys:** all suffixed `_id`; `on delete cascade` for owned children of `clients`, `on delete restrict` for cross-domain references (e.g. `top_post_id` on reports)
- **Soft enums:** stored as `text` with a `check (... in (...))` constraint — keeps migrations cheap as values evolve
- **JSON fields:** `jsonb` (always), never `json`
- **Naming:** snake_case for tables, columns, and enum values
- **Money:** integer cents (no floats)

---

## Part 2 — Core tables

For each table: purpose, fields (with types), foreign keys, the demo file it maps to today, the portal pages it will eventually power, and a build priority (P1 = first migration phase, P5 = last).

---

### 1. `clients` — P1

**Purpose:** The root entity. Every restaurant on the Veroxa platform.

**Demo source:** `demoClients.ts` (`demoRestaurants`, `demoRestaurantProfiles`, `demoClientLifecycle`)

**Portal pages:** Owner client list, Operator priority board, every per-client portal page, all reports.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | ✓ | PK |
| `business_name` | text | ✓ | Display name |
| `legal_name` | text |   | For invoicing |
| `primary_contact_name` | text | ✓ |  |
| `primary_contact_email` | text | ✓ |  |
| `primary_contact_phone` | text |   |  |
| `secondary_contact_name` | text |   |  |
| `secondary_contact_email` | text |   |  |
| `cuisine_type` | text |   | e.g. "Modern Levantine" |
| `address` | text |   |  |
| `website_url` | text |   |  |
| `hours_text` | text |   | Plain-text hours summary |
| `plan_type` | text | ✓ | enum (see Part 3) |
| `service_package` | text | ✓ | enum (see Part 3) |
| `monthly_fee_cents` | integer | ✓ | Locked pricing in cents |
| `contract_months` | integer |   |  |
| `start_date` | date |   |  |
| `posting_frequency_weekly` | integer | ✓ | default 3 |
| `timezone` | text | ✓ | **No hard-coded default.** Required for every client. Demo seed uses `"America/Chicago"` (Veroxa's initial market is San Antonio, TX). |
| `assigned_operator_id` | uuid |   | FK → `user_profiles.id` |
| `assigned_team_label` | text |   | "Team A" etc. |
| `account_status` | text | ✓ | enum |
| `content_health_status` | text | ✓ | enum, default `"healthy"` |
| `risk_status` | text | ✓ | enum, default `"low"` |
| `onboarding_complete` | boolean | ✓ | default `false` |
| `created_at` | timestamptz | ✓ |  |
| `updated_at` | timestamptz | ✓ |  |

**Foreign keys:** `assigned_operator_id` → `user_profiles.id`.

---

### 2. `client_platforms` — P1

**Purpose:** One row per social/Google platform a client has connected (or is about to connect).

**Demo source:** Implicit in `demoClients.ts` brand guidelines + onboarding signals.

**Portal pages:** Onboarding wizard, client settings, publishing setup, operator health.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | ✓ | PK |
| `client_id` | uuid | ✓ | FK → `clients.id` |
| `platform_name` | text | ✓ | enum: `instagram`, `facebook`, `tiktok`, `google_business`, `youtube`, `x` |
| `access_status` | text | ✓ | enum: `not_connected`, `pending`, `connected`, `error`, `revoked` |
| `username_or_handle` | text |   |  |
| `notes` | text |   |  |
| `last_verified_at` | timestamptz |   |  |
| `created_at` | timestamptz | ✓ |  |
| `updated_at` | timestamptz | ✓ |  |

---

### 3. `onboarding_items` — P1

**Purpose:** Granular onboarding checklist — one row per item per client.

**Demo source:** `demoOnboarding.ts` (`demoOnboardingSteps`)

**Portal pages:** Client onboarding wizard, Operator onboarding overview, Veroxa next-needs widget.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | ✓ | PK |
| `client_id` | uuid | ✓ | FK → `clients.id` |
| `item_key` | text | ✓ | Stable machine key, e.g. `"restaurant_info"` |
| `item_label` | text | ✓ | Display label |
| `description` | text |   |  |
| `status` | text | ✓ | enum: `missing`, `in_progress`, `complete` |
| `owner_role` | text | ✓ | enum: `client`, `team`, `operator`, `veroxa` |
| `priority` | text | ✓ | enum: `low`, `medium`, `high` |
| `due_label` | text |   | Free-text "Week 1" etc. |
| `completed_by_role` | text |   |  |
| `completed_by_user_id` | uuid |   | FK → `user_profiles.id` |
| `completed_at` | timestamptz |   |  |
| `created_at` | timestamptz | ✓ |  |
| `updated_at` | timestamptz | ✓ |  |

**Unique:** `(client_id, item_key)`.

---

### 4. `media_assets` — P2

**Purpose:** Every photo/video uploaded for a client. The library that feeds the content pipeline.

**Demo source:** `demoMediaAssets.ts` (`demoMediaItems`, `demoMediaRunway`)

**Portal pages:** Client media library, Team media review queue, Content pipeline source picker.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | ✓ | PK |
| `client_id` | uuid | ✓ | FK → `clients.id` |
| `file_url` | text | ✓ | Supabase Storage URL |
| `thumbnail_url` | text |   |  |
| `file_type` | text | ✓ | enum: `photo`, `video` |
| `mime_type` | text | ✓ |  |
| `width_px` | integer |   |  |
| `height_px` | integer |   |  |
| `duration_seconds` | numeric |   | for video only |
| `source_type` | text | ✓ | enum: `client_upload`, `legacy_reuse`, `team_upload` |
| `title` | text |   | Display name |
| `caption_hint` | text |   | Client-provided context |
| `quality_ai_flag` | text |   | enum: `likely_usable`, `borderline`, `likely_reject` |
| `quality_score` | integer |   | 0–100 |
| `review_status` | text | ✓ | enum (see Part 3) |
| `rejection_reason` | text |   |  |
| `reuse_eligible` | boolean | ✓ | default `false` |
| `linked_post_id` | uuid |   | FK → `posts.id` (most-recent use) |
| `tags` | text[] |   | freeform |
| `uploaded_at` | timestamptz | ✓ |  |
| `reviewed_at` | timestamptz |   |  |
| `reviewed_by_user_id` | uuid |   | FK → `user_profiles.id` |
| `created_at` | timestamptz | ✓ |  |
| `updated_at` | timestamptz | ✓ |  |

---

### 5. `content_concepts` — P5

**Purpose:** A creative direction generated from one or more media assets, before captions exist.

**Demo source:** `demoPosts.ts` (`demoContentPipelineItems` early stages)

**Portal pages:** Content strategist agent output, Team review queue.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | ✓ | PK |
| `client_id` | uuid | ✓ | FK → `clients.id` |
| `media_asset_id` | uuid |   | FK → `media_assets.id` (primary media) |
| `additional_media_ids` | uuid[] |   | extra assets |
| `content_angle` | text | ✓ | e.g. "Family platter weekend" |
| `content_goal` | text |   | enum: `awareness`, `engagement`, `conversion`, `branding`, `recovery` |
| `hook_style` | text |   | enum: `question`, `bold_statement`, `story`, `stat`, `behind_scenes` |
| `cta_direction` | text |   | enum: `visit`, `order`, `book`, `follow`, `share`, `none` |
| `status` | text | ✓ | enum: `proposed`, `approved`, `archived` |
| `generated_at` | timestamptz |   |  |
| `generated_by_agent` | text |   | "content_strategist" etc. |
| `created_at` | timestamptz | ✓ |  |
| `updated_at` | timestamptz | ✓ |  |

---

### 6. `draft_sets` — P5

**Purpose:** A generation batch of caption drafts for a single concept (e.g. v1, v2 if regenerated).

**Demo source:** Implicit in `demoPosts.ts` caption stages.

**Portal pages:** Team caption review.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | ✓ | PK |
| `concept_id` | uuid | ✓ | FK → `content_concepts.id` |
| `generation_version` | integer | ✓ | default `1` |
| `status` | text | ✓ | enum: `drafting`, `awaiting_review`, `approved`, `superseded` |
| `team_note` | text |   |  |
| `generated_at` | timestamptz |   |  |
| `generated_by_agent` | text |   | "caption" |
| `created_at` | timestamptz | ✓ |  |
| `updated_at` | timestamptz | ✓ |  |

---

### 7. `draft_variants` — P5

**Purpose:** Individual caption options inside a draft set — typically Safe / Engagement / Sales.

**Demo source:** `demoPosts.ts` caption agent output.

**Portal pages:** Team caption picker, Brand voice agent feedback.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | ✓ | PK |
| `draft_set_id` | uuid | ✓ | FK → `draft_sets.id` |
| `variant_type` | text | ✓ | enum: `safe`, `engagement`, `sales` |
| `caption_body` | text | ✓ |  |
| `hook_text` | text |   |  |
| `cta_text` | text |   |  |
| `hashtag_block` | text |   |  |
| `brand_voice_score` | integer |   | 0–100, set by brand_voice agent |
| `status` | text | ✓ | enum: `draft`, `approved`, `rejected`, `used`, `superseded` |
| `used_in_post_id` | uuid |   | FK → `posts.id` |
| `created_at` | timestamptz | ✓ |  |
| `updated_at` | timestamptz | ✓ |  |

---

### 8. `posts` — P3

**Purpose:** The unit of social output. The pipeline endpoint.

**Demo source:** `demoPosts.ts` (`demoContentPipelineItems`, `demoContentItems`)

**Portal pages:** Calendar, content pipeline kanban, Ready-to-post queue, every report.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | ✓ | PK |
| `client_id` | uuid | ✓ | FK → `clients.id` |
| `media_asset_id` | uuid |   | FK → `media_assets.id` |
| `concept_id` | uuid |   | FK → `content_concepts.id` |
| `draft_variant_id` | uuid |   | FK → `draft_variants.id` |
| `title` | text |   | Internal label |
| `platform_name` | text | ✓ | enum (same as `client_platforms.platform_name`) |
| `content_type` | text | ✓ | enum: `photo`, `reel`, `carousel`, `story` |
| `post_status` | text | ✓ | enum (see Part 3) |
| `scheduled_for` | timestamptz |   |  |
| `published_at` | timestamptz |   |  |
| `publish_failure_reason` | text |   |  |
| `external_post_id` | text |   | platform's post id, once published |
| `external_permalink` | text |   |  |
| `is_reuse_based` | boolean | ✓ | default `false` — flag for reused media |
| `created_at` | timestamptz | ✓ |  |
| `updated_at` | timestamptz | ✓ |  |

---

### 9. `post_slots` — P3

**Purpose:** Calendar slots — both planned/open slots and reservations for specific posts.

**Demo source:** `demoPostSlots.ts` (`demoCalendarSlots`)

**Portal pages:** Calendar view, scheduling agent.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | ✓ | PK |
| `client_id` | uuid | ✓ | FK → `clients.id` |
| `platform_name` | text | ✓ |  |
| `slot_date` | date | ✓ |  |
| `slot_time` | time | ✓ |  |
| `status` | text | ✓ | enum: `open`, `planned`, `scheduled`, `published`, `cancelled` |
| `reserved_post_id` | uuid |   | FK → `posts.id` |
| `created_at` | timestamptz | ✓ |  |
| `updated_at` | timestamptz | ✓ |  |

**Unique:** `(client_id, platform_name, slot_date, slot_time)`.

---

### 10. `notifications` — P2

**Purpose:** All system, agent, and operator notifications targeted at a specific role.

**Demo source:** `demoNotifications.ts` (`demoNotifications`, `demoRoleNotifications`)

**Portal pages:** Notification center (every role), Operator alert center, Owner business risk feed.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | ✓ | PK |
| `client_id` | uuid |   | FK → `clients.id` (nullable for portfolio-level alerts) |
| `target_role` | text | ✓ | enum: `client`, `team`, `operator`, `owner` |
| `target_user_id` | uuid |   | FK → `user_profiles.id` (nullable; null = broadcast to role) |
| `notification_type` | text | ✓ | enum: `success`, `info`, `warning`, `reminder`, `critical` |
| `category` | text |   | e.g. `media`, `report`, `onboarding`, `revenue` |
| `priority` | text | ✓ | enum: `p1`, `p2`, `p3` |
| `title` | text | ✓ |  |
| `message_body` | text | ✓ |  |
| `suggested_action` | text |   |  |
| `status` | text | ✓ | enum: `created`, `sent`, `seen`, `dismissed`, `escalated` |
| `trigger_source` | text | ✓ | enum: `system`, `agent`, `operator`, `team`, `client_action` |
| `agent_id` | uuid |   | FK → `ai_agents.id` (nullable) |
| `seen_at` | timestamptz |   |  |
| `created_at` | timestamptz | ✓ |  |
| `updated_at` | timestamptz | ✓ |  |

---

### 11. `weekly_reports` — P4

**Purpose:** One row per client per week.

**Demo source:** `demoWeeklyReports.ts` (`demoWeeklyReports`, `demoReportingOps`)

**Portal pages:** Client report viewer, Operator validation queue.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | ✓ | PK |
| `client_id` | uuid | ✓ | FK → `clients.id` |
| `week_start` | date | ✓ |  |
| `week_end` | date | ✓ |  |
| `posts_planned` | integer | ✓ | default `0` |
| `posts_published` | integer | ✓ | default `0` |
| `top_post_id` | uuid |   | FK → `posts.id` (`on delete set null`) |
| `status` | text | ✓ | enum: `drafted`, `validated`, `published` |
| `draft_owner_id` | uuid |   | FK → `user_profiles.id` |
| `validation_owner_id` | uuid |   | FK → `user_profiles.id` |
| `internal_validation_note` | text |   |  |
| `client_facing_summary` | text |   |  |
| `summary_json` | jsonb |   | Full report payload (metrics, charts, narrative) |
| `published_at` | timestamptz |   |  |
| `created_at` | timestamptz | ✓ |  |
| `updated_at` | timestamptz | ✓ |  |

**Unique:** `(client_id, week_start)`.

---

### 12. `monthly_reports` — P4

**Purpose:** One row per client per calendar month.

**Demo source:** `demoMonthlyReports.ts` (`demoMonthlyReports`)

**Portal pages:** Client monthly report viewer, Operator monthly approval queue.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | ✓ | PK |
| `client_id` | uuid | ✓ | FK → `clients.id` |
| `month_key` | text | ✓ | e.g. `"2026-05"` |
| `status` | text | ✓ | enum: `drafting`, `operator_review`, `approved`, `published` |
| `summary_json` | jsonb |   | Trend data, narrative, focus areas |
| `approved_by_user_id` | uuid |   | FK → `user_profiles.id` |
| `published_at` | timestamptz |   |  |
| `created_at` | timestamptz | ✓ |  |
| `updated_at` | timestamptz | ✓ |  |

**Unique:** `(client_id, month_key)`.

---

### 13. `activity_logs` — P2

**Purpose:** Append-only audit log of every meaningful state change.

**Demo source:** `demoActivityLogs.ts` (`demoActivityEvents`, `demoActivityLog`)

**Portal pages:** Per-client activity timeline, Operator audit view.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | ✓ | PK |
| `entity_type` | text | ✓ | e.g. `client`, `media_asset`, `post`, `weekly_report` |
| `entity_id` | uuid | ✓ |  |
| `client_id` | uuid |   | FK → `clients.id` (denormalized for query speed) |
| `action_key` | text | ✓ | e.g. `media.approved`, `post.scheduled`, `report.validated` |
| `description` | text |   | Human-readable summary |
| `performed_by_role` | text | ✓ | enum: `client`, `team`, `operator`, `owner`, `agent`, `system` |
| `performed_by_user_id` | uuid |   | FK → `user_profiles.id` |
| `old_value_json` | jsonb |   |  |
| `new_value_json` | jsonb |   |  |
| `created_at` | timestamptz | ✓ |  |

**No `updated_at`** — append-only.

---

## Support tables

### 14. `user_profiles` — P1

**Purpose:** Application-level user data, paired 1:1 with `auth.users`.

**Demo source:** Implicit (`assignedOperator` etc. in `demoClients.ts`, `demoTeam.ts`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | ✓ | PK; matches `auth.users.id` |
| `display_name` | text | ✓ |  |
| `email` | text | ✓ |  |
| `role` | text | ✓ | enum: `client`, `team`, `operator`, `owner` |
| `client_id` | uuid |   | FK → `clients.id` (only for `role='client'` users) |
| `avatar_url` | text |   |  |
| `is_active` | boolean | ✓ | default `true` |
| `created_at` | timestamptz | ✓ |  |
| `updated_at` | timestamptz | ✓ |  |

---

### 15. `team_members` — P1

**Purpose:** Operational profile for users with `role in ('team','operator')`. Allows performance tracking without polluting `user_profiles`.

**Demo source:** `demoTeam.ts` (`demoTeamMembers`, `demoTeamOversight`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | ✓ | PK |
| `user_profile_id` | uuid | ✓ | FK → `user_profiles.id` (unique) |
| `role_label` | text | ✓ | e.g. `"Content Lead"` |
| `created_at` | timestamptz | ✓ |  |
| `updated_at` | timestamptz | ✓ |  |

> **Deprecated:** earlier drafts included `assigned_client_ids uuid[]` on this
> table. That array column is **not** the real-schema design. Assignments now
> live in a dedicated join table — see `team_client_assignments` below. RLS
> against a `uuid[]` is painful to index and clunky to revoke; the join table
> is the only design used by the RLS plan and seed strategy.

---

### 15a. `team_client_assignments` — P2 (join table)

**Purpose:** Many-to-many link between a team member and the clients they work on. Replaces the deprecated `team_members.assigned_client_ids` array. Every RLS check for team scoping reads this table.

**Demo source:** Derived from `demoTeam.ts` (`demoTeamMembers` + assigned-client lists) plus `clients.assignedOperator` in `demoClients.ts`.

**Portal pages:** Operator team oversight, Owner role management, every team-scoped query (drives `is_assigned_to_client()`).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | ✓ | PK |
| `team_member_id` | uuid | ✓ | FK → `team_members.id` `on delete cascade` |
| `client_id` | uuid | ✓ | FK → `clients.id` `on delete cascade` |
| `assignment_role` | text | ✓ | enum, default `'executor'` — see Part 3 |
| `is_active` | boolean | ✓ | default `true` — soft-revoke without deleting the row |
| `created_at` | timestamptz | ✓ |  |
| `updated_at` | timestamptz | ✓ |  |

**Unique:** `(team_member_id, client_id)` — one assignment row per pair; revoke by flipping `is_active=false`, do not delete (preserves audit history).

**Why a join table, not an array:**
- Soft-revoke + audit history via `is_active` / `activity_logs`
- Per-assignment `assignment_role` (executor vs reviewer vs lead)
- Indexable both directions (`(team_member_id, is_active)` and `(client_id, is_active)`)
- RLS check becomes a cheap `exists` instead of an `ANY(array)` scan
- Owner can add/revoke assignments without rewriting the team_members row

---

### 16. `client_requests` — P2

**Purpose:** Outstanding asks from Veroxa to the client (upload more photos, confirm hours, etc).

**Demo source:** `demoRequests.ts` (`demoClientRequests`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | ✓ | PK |
| `client_id` | uuid | ✓ | FK → `clients.id` |
| `title` | text | ✓ |  |
| `description` | text |   |  |
| `status` | text | ✓ | enum: `pending`, `in_progress`, `completed`, `cancelled` |
| `priority` | text | ✓ | enum: `low`, `normal`, `high` |
| `due_label` | text |   | e.g. `"Today"`, `"May 28"` |
| `due_date` | date |   |  |
| `requested_by_user_id` | uuid |   | FK → `user_profiles.id` |
| `completed_at` | timestamptz |   |  |
| `created_at` | timestamptz | ✓ |  |
| `updated_at` | timestamptz | ✓ |  |

---

### 17. `client_health_snapshots` — P4

**Purpose:** Daily/weekly snapshot of computed client health signals. Time-series — never updated, only inserted.

**Demo source:** `demoClientHealth.ts` (`demoClientHealth`, `demoHealthScores`, `demoClientPriorities`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | ✓ | PK |
| `client_id` | uuid | ✓ | FK → `clients.id` |
| `snapshot_date` | date | ✓ |  |
| `level` | text | ✓ | enum: `healthy`, `attention`, `critical` |
| `score` | integer | ✓ | 0–100 |
| `priority_level` | text | ✓ | enum: `low`, `normal`, `high`, `critical` |
| `media_inventory_value` | integer |   |  |
| `media_inventory_max` | integer |   |  |
| `posting_consistency_status` | text |   | enum: `good`, `warn`, `bad` |
| `google_visibility_score` | integer |   |  |
| `google_visibility_trend` | text |   | enum: `up`, `flat`, `down` |
| `reviews_recent_count` | integer |   |  |
| `onboarding_pct` | integer |   |  |
| `report_status` | text |   |  |
| `signals_json` | jsonb |   | full computed payload |
| `created_at` | timestamptz | ✓ |  |

**Unique:** `(client_id, snapshot_date)`.

---

### 18. `ai_agents` — P6

**Purpose:** Registry of AI agents — who they are, what they do, current activity status.

**Demo source:** `demoAgents.ts` (`demoAgents`, `demoAiAgentsV2`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | ✓ | PK |
| `agent_key` | text | ✓ | stable e.g. `"media-review"` — unique |
| `name` | text | ✓ |  |
| `category` | text | ✓ | enum: `content`, `operations`, `intelligence`, `executive` |
| `purpose` | text | ✓ |  |
| `is_enabled` | boolean | ✓ | default `false` |
| `confidence_baseline` | integer |   | 0–100 |
| `last_activity_at` | timestamptz |   |  |
| `created_at` | timestamptz | ✓ |  |
| `updated_at` | timestamptz | ✓ |  |

---

### 19. `financial_snapshots` — P4

**Purpose:** Monthly business-level financial rollups for the Owner Layer.

**Demo source:** `demoFinancials.ts` (`demoOwnerMetrics`, `demoRevenueTrend`, `demoServicePlans`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | ✓ | PK |
| `month_key` | text | ✓ | `"2026-05"` |
| `active_clients` | integer | ✓ |  |
| `mrr_cents` | integer | ✓ |  |
| `projected_mrr_cents` | integer |   |  |
| `client_health_average` | integer |   |  |
| `team_utilization_pct` | integer |   |  |
| `retention_score` | integer |   |  |
| `reporting_completion_rate` | integer |   |  |
| `onboarding_completion_rate` | integer |   |  |
| `mom_growth_pct` | integer |   |  |
| `analytics_json` | jsonb |   | full BI payload |
| `created_at` | timestamptz | ✓ |  |
| `updated_at` | timestamptz | ✓ |  |

**Unique:** `(month_key)`.

---

### 20. `system_status` — P6

**Purpose:** Display-only registry of integration/system status (matches demo `demoSystemStatus`).

**Demo source:** `demoSystemStatus.ts` (`demoSystemStatus`, `demoControlPresets`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | ✓ | PK |
| `label` | text | ✓ | unique |
| `state` | text | ✓ | enum: `active`, `not_connected`, `placeholder` |
| `detail` | text |   |  |
| `updated_at` | timestamptz | ✓ |  |

---

## Part 3 — Enum definitions

All enums are stored as `text` with `check (col in (...))` constraints. Values use snake_case.

### `clients.plan_type` — contract term / billing cadence
- `twelve_month`
- `six_month`
- `three_month`
- `no_contract`
- `month_to_month`

> `plan_type` describes **how long / how often** the client is committed.
> It does **not** identify the product. Google Presence Starter clients
> are stored as `service_package='google_presence_starter'` with
> `plan_type='month_to_month'` (or `'no_contract'`).

### `clients.service_package` — which product the client is on
- `google_presence_starter`
- `complete_online_presence`
- `ads_addon`
- `ads_only`
- `bundle`

### `clients.account_status`
- `lead`
- `signed`
- `onboarding`
- `active`
- `needs_attention`
- `at_risk`
- `paused`
- `closed`

### `clients.content_health_status`
- `healthy`
- `caution`
- `urgent`
- `broken`

### `clients.risk_status`
- `good`
- `risk`
- `at_risk`

### `client_platforms.platform_name`
- `instagram` · `facebook` · `google_business` · `tiktok` · `other`

### `client_platforms.access_status`
- `pending` · `granted` · `verified` · `revoked`

### `onboarding_items.status`
- `not_started` · `pending` · `complete` · `blocked`

### `onboarding_items.owner_role`
- `client` · `team` · `operator` · `veroxa`

### `media_assets.file_type`
- `image` · `video`

### `media_assets.source_type`
- `client_upload` · `legacy_reuse` · `team_upload`

### `media_assets.quality_ai_flag`
- `likely_usable` · `borderline` · `likely_reject`

### `media_assets.review_status`
- `uploaded`
- `ai_reviewed`
- `team_review_pending`
- `rejected`
- `usable`
- `shortlisted`
- `drafted`
- `approved`
- `scheduled`
- `used`
- `reusable_archive`

### `content_concepts.content_goal`
- `awareness` · `engagement` · `conversion` · `branding` · `recovery`

### `content_concepts.hook_style`
- `question` · `bold_statement` · `story` · `stat` · `behind_scenes`

### `content_concepts.cta_direction`
- `visit` · `order` · `book` · `follow` · `share` · `none`

### `content_concepts.status`
- `generated` · `under_review` · `rejected` · `approved`

### `draft_sets.status`
- `generated` · `under_review` · `needs_regeneration` · `approved` · `archived`

### `draft_variants.variant_type`
- `safe` · `engagement` · `sales`

### `draft_variants.status`
- `generated` · `under_review` · `approved` · `archived` · `used`

### `posts.content_type`
- `photo` · `reel` · `carousel` · `story`

### `posts.post_status`
- `planning`
- `awaiting_content`
- `ready_for_review`
- `approved`
- `ready_to_schedule`
- `scheduled`
- `published`
- `failed`
- `reschedule_required`
- `archived`

### `post_slots.status`
- `open` · `reserved` · `scheduled` · `completed` · `skipped`

### `notifications.target_role`
- `client` · `team` · `operator` · `owner`

### `notifications.notification_type`
- `success` · `info` · `warning` · `reminder` · `critical`

### `notifications.priority`
- `p1` · `p2` · `p3`

### `notifications.status`
- `created` · `sent` · `seen` · `dismissed` · `escalated`

### `notifications.trigger_source`
- `system` · `agent` · `operator` · `team` · `client_action`

### `weekly_reports.status`
- `drafted` · `validated` · `published`

### `monthly_reports.status`
- `drafting` · `operator_review` · `approved` · `published`

### `activity_logs.performed_by_role`
- `system` · `client` · `team` · `operator` · `owner`

> AI-agent actions are recorded with `performed_by_role='system'` plus an
> `action_key` and `new_value_json.agent_key` payload. No separate `agent` role
> is needed in the audit log.

### `user_profiles.role`
- `client` · `team` · `operator` · `owner`

### `client_requests.status`
- `pending` · `in_progress` · `completed` · `cancelled`

### `client_requests.priority`
- `low` · `normal` · `high`

### `client_health_snapshots.level`
- `healthy` · `attention` · `critical`

### `client_health_snapshots.priority_level`
- `low` · `normal` · `high` · `critical`

### `ai_agents.category`
- `content` · `operations` · `intelligence` · `executive`

### `system_status.state`
- `active` · `not_connected` · `placeholder`

### `team_client_assignments.assignment_role`
- `executor` · `reviewer` · `scheduler` · `reporter` · `lead`

> Default value is `'executor'`. Multiple team members may share a client; the
> Owner role manages assignments. `is_active=false` soft-revokes without
> losing audit trail.

---

## Part 4 — Relationship map

```
auth.users
   └─ user_profiles (1:1)
         ├─ team_members            (1:1, for team/operator)
         └─ clients.assigned_operator_id (many clients per operator)

clients (root)
   ├─ client_platforms              (1:N)
   ├─ onboarding_items              (1:N)
   ├─ media_assets                  (1:N)
   ├─ content_concepts              (1:N)
   ├─ posts                         (1:N)
   ├─ post_slots                    (1:N)
   ├─ notifications                 (1:N)
   ├─ weekly_reports                (1:N)
   ├─ monthly_reports               (1:N)
   ├─ activity_logs                 (1:N denormalized)
   ├─ client_requests               (1:N)
   └─ client_health_snapshots       (1:N time series)

media_assets
   ├─ content_concepts.media_asset_id   (1:N)
   ├─ posts.media_asset_id              (1:N)
   └─ linked_post_id → posts            (denormalized "last used")

content_concepts
   ├─ draft_sets                    (1:N)
   └─ posts.concept_id              (1:N)

draft_sets
   └─ draft_variants                (1:N)

draft_variants
   └─ posts.draft_variant_id        (1:N)

posts
   ├─ post_slots.reserved_post_id   (0..1)
   ├─ weekly_reports.top_post_id    (referenced)
   ├─ activity_logs                 (via entity_type='post')
   └─ notifications                 (via trigger_source)

weekly_reports / monthly_reports
   └─ approved_by_user_id / validation_owner_id / draft_owner_id → user_profiles

ai_agents
   └─ notifications.agent_id        (1:N)

financial_snapshots                 (no FKs — standalone monthly rollup)
system_status                       (no FKs — display registry)
```

---

## Part 5 — Row Level Security planning

> RLS is **not** implemented yet. The rules below are the future contract.

### Helper functions (to add later)
- `auth_role()` — reads `user_profiles.role` for the current `auth.uid()`
- `auth_client_id()` — reads `user_profiles.client_id` for client-role users
- `auth_team_assigned(client_id)` — true if current operator/team user is assigned to that client

### Per-role access summary

**Client (`role='client'`)**
- Can `SELECT` their own `clients` row only (`id = auth_client_id()`)
- Can `SELECT / INSERT` on their own `media_assets`
- Can `SELECT` their own `posts`, `weekly_reports` (only `status='published'`), `monthly_reports` (only `status='published'`), `client_platforms`, `onboarding_items`, `client_requests`, `notifications` (where `target_role='client'` AND `client_id` matches)
- Can `UPDATE` `client_requests.status` (own only, only `pending → in_progress` / `→ completed`)
- **Cannot** see: `draft_sets`, `draft_variants`, `internal_validation_note`, `rejection_reason`, any other client's rows, anything operator/team/owner-targeted

**Team (`role='team'`)**
- Can `SELECT / UPDATE` on every table scoped to clients they're assigned to (`auth_team_assigned(client_id)`)
- Full control over `media_assets`, `content_concepts`, `draft_sets`, `draft_variants`, `posts`, `post_slots`, `weekly_reports` (drafting + validation note)
- Can `SELECT` `monthly_reports` but not `UPDATE` status
- Can `SELECT` notifications targeted at `team`
- **Cannot** see: financial_snapshots, user_profiles for other roles, ai_agents settings, monthly_reports approval, billing

**Operator (`role='operator'`)**
- Can `SELECT` on every row of every operational table (all clients)
- Can `UPDATE` `weekly_reports.status` (validate / publish), `monthly_reports.status` (approve / publish)
- Can `UPDATE` `clients` (account_status, risk_status, content_health_status, assignments)
- Can `SELECT / INSERT` `notifications`, `client_requests`, `activity_logs`
- Can `SELECT` `financial_snapshots`, `client_health_snapshots`, `ai_agents`
- **Cannot** `UPDATE` `clients.plan_type` / `service_package` / `monthly_fee_cents` (owner only), `user_profiles.role`, `ai_agents.is_enabled`

**Owner (`role='owner'`)**
- Full `SELECT / INSERT / UPDATE / DELETE` on every table
- Sole role permitted to change pricing fields, AI agent enablement, user roles, and to soft-delete clients

**System (no JWT — service role / DB trigger)**
- Service role bypasses RLS to write `activity_logs`, `notifications`, `client_health_snapshots`, `financial_snapshots`, scheduled cron writes
- Insert-only policies should still exist on `activity_logs` for traceability

### Notes
- Every table gets RLS `ENABLED` from day one of the migration; no public table is acceptable.
- Use `pg_policies` view to audit; document every policy in a future `SUPABASE_RLS_V1.md`.

---

## Part 6 — Future migration order

Recommended phasing. **Do not implement yet.**

**Phase 1 — Identity & root**
1. `user_profiles`
2. `team_members`
3. `clients`
4. `client_platforms`
5. `onboarding_items`

**Phase 2 — Content intake & comms**
6. `media_assets`
7. `notifications`
8. `activity_logs`
9. `client_requests`

**Phase 3 — Publishing**
10. `posts`
11. `post_slots`

**Phase 4 — Reporting & health**
12. `weekly_reports`
13. `monthly_reports`
14. `client_health_snapshots`
15. `financial_snapshots`

**Phase 5 — Creative pipeline**
16. `content_concepts`
17. `draft_sets`
18. `draft_variants`

**Phase 6 — AI & system**
19. `ai_agents`
20. `system_status`

Each phase should land with: tables + indexes + RLS policies + seed data fixture matching the corresponding `demoXxx.ts` file, plus a backfill plan for any production rows.

---

## Not Ready For Migration Yet

This draft is **not** safe to translate into a real migration. Outstanding
blockers, in rough order of importance:

- **RLS policies still need review.** Part 5 is a plan, not a tested policy
  set. Every table needs `enable row level security` plus explicit
  `for select / insert / update / delete` policies and a regression test plan.
- **Seed data still needs planning.** Each demo file in `src/data/demo/` must
  be turned into an idempotent SQL fixture (or seed script) before migration.
- **`user_profiles` ↔ `auth.users` linkage must be tested separately.** The
  on-signup trigger / sync pattern, role provisioning, and `client_id`
  back-fill on first login are unproven here.
- **Media storage rules not drafted yet.** Supabase Storage bucket layout,
  signed-URL policy, per-client folder rules, MIME and size limits, and
  cleanup of orphaned files are all undefined.
- **Activity log trigger strategy not finalized.** Whether `activity_logs`
  rows are written by app code, by Postgres triggers, or both, is still open.
  A wrong choice here is expensive to undo.
- **Automation / publishing / AI tables should wait.** `ai_agents`,
  `content_concepts`, `draft_sets`, `draft_variants` (Phases 5–6) should land
  only after the core (Phases 1–4) is stable and exercised by real traffic.
- **Pricing change audit.** Even with Owner-only RLS, every write to
  `clients.plan_type / service_package / monthly_fee_cents` should write an
  `activity_logs` row — this contract is not yet wired.

Treat this document as the contract, not the implementation plan.

---

## Part 8 — Final report

**Files created in this pass**
- `docs/SUPABASE_SCHEMA_DRAFT_V1.md` (this document)
- `docs/sql_drafts/001_veroxa_schema_draft.sql` (commented CREATE TABLE drafts; DO NOT RUN)

**Tables drafted:** 20
1. `clients`
2. `client_platforms`
3. `onboarding_items`
4. `media_assets`
5. `content_concepts`
6. `draft_sets`
7. `draft_variants`
8. `posts`
9. `post_slots`
10. `notifications`
11. `weekly_reports`
12. `monthly_reports`
13. `activity_logs`
14. `user_profiles`
15. `team_members`
16. `client_requests`
17. `client_health_snapshots`
18. `ai_agents`
19. `financial_snapshots`
20. `system_status`

**Enums documented:** 37 (across the 20 tables — full list in Part 3)

**Relationship map:** complete (Part 4)

**RLS planning:** complete (Part 5) — covers Client, Team, Operator, Owner, System roles, with helper-function sketches

**Next pass (not part of this task):** turn the SQL draft into a real migration set behind `AUTH_MODE='real'`, ship RLS policies alongside, seed from demo fixtures, write `SUPABASE_RLS_V1.md`.

### Correction pass V1.1 — change log

- **Timezone:** removed `America/Toronto` default. `timezone` is required for
  every client; demo seed uses `America/Chicago` (San Antonio, TX market).
- **`clients.plan_type`:** dropped `google_presence_starter` value (it is a
  product, not a term). Added `month_to_month`.
- **`clients.risk_status`:** simplified from `low/medium/high/critical` to
  `good/risk/at_risk`.
- **`client_platforms.platform_name`:** dropped `youtube` and `x`, added
  `other`. Final set: `instagram / facebook / google_business / tiktok / other`.
- **`client_platforms.access_status`:** retitled from
  `not_connected/pending/connected/error/revoked` to
  `pending/granted/verified/revoked`.
- **`onboarding_items.status`:** retitled from `missing/in_progress/complete`
  to `not_started/pending/complete/blocked`.
- **`media_assets.file_type`:** `photo` → `image`.
- **`media_assets.source_type`:** consolidated to
  `client_upload / legacy_reuse / team_upload`.
- **`media_assets.quality_ai_flag`:** simplified to
  `likely_usable / borderline / likely_reject`.
- **`content_concepts.status`:** retitled to
  `generated / under_review / rejected / approved`.
- **`draft_sets.status`:** retitled to
  `generated / under_review / needs_regeneration / approved / archived`.
- **`draft_variants.status`:** retitled to
  `generated / under_review / approved / archived / used`.
- **`post_slots.status`:** retitled to
  `open / reserved / scheduled / completed / skipped`.
- **`activity_logs.performed_by_role`:** dropped `agent` (agent actions are
  written as `system` with the agent_key in the JSON payload).
- **Pricing:** added an explicit cents table mapping each product to
  `service_package`, `plan_type`, and `monthly_fee_cents`.
- **Google Presence Starter:** clarified as a `service_package`, never a
  `plan_type`.
- **Added "Not Ready For Migration Yet" section** listing outstanding blockers.
