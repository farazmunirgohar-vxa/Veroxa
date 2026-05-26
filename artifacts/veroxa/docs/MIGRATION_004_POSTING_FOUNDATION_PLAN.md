# Migration 004 — Posting Foundation: Planning Document

**Status:** Planning only. No SQL draft authored in this pass.
`AUTH_MODE` remains `"placeholder"`. No publishing integrations, no
background jobs, no real platform APIs.

---

## 1. Purpose

M004 introduces the scheduling/posting foundation: `posts` and
`post_slots`, plus the deferred `media_assets.linked_post_id` FK and
the `client_portal_calendar_view`.

### Dependency

M004 depends on **M001** (identity), **M002** (clients +
team_client_assignments + helpers), and **M003** (media_assets). Must
not apply before all three are green.

### Scope

Included:
- `posts`
- `post_slots`
- Adds FK: `media_assets.linked_post_id → posts(id) on delete set null`
- RLS + per-role policies
- Indexes
- Commented client-safe view stub: `client_portal_calendar_view`

**NOT in scope** (deferred):
- `weekly_reports`, `monthly_reports` — M005
- `content_concepts`, `draft_sets`, `draft_variants`, `ai_agents` — M006
- AI APIs, real platform APIs (Meta Graph, Google Business, TikTok) — M008+
- Storage buckets — M007
- Real publishing integrations — M008+
- Background workers / cron — out of all SQL migrations; orchestrated separately
- Payment systems — separate track

---

## 2. Tables

### 2.1 `posts`

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid pk default gen_random_uuid()` | |
| `client_id` | `uuid not null references clients(id) on delete cascade` | |
| `media_asset_id` | `uuid null references media_assets(id) on delete set null` | post may exist before media is attached |
| `concept_id` | `uuid null` | M006 placeholder; no FK until then |
| `draft_variant_id` | `uuid null` | M006 placeholder; no FK until then |
| `platform_name` | `text not null check (platform_name in ('instagram','facebook','google_business','tiktok','other'))` | |
| `content_type` | `text not null check (content_type in ('photo','reel','carousel','story'))` | |
| `title` | `text null` | internal display label |
| `caption_text` | `text null` | |
| `post_status` | `text not null default 'planning' check (post_status in ('planning','awaiting_content','ready_for_review','approved','ready_to_schedule','scheduled','published','failed','reschedule_required','archived'))` | |
| `scheduled_for` | `timestamptz null` | |
| `published_at` | `timestamptz null` | manual/system update; no real API in M004 |
| `publish_failure_reason` | `text null` | internal — hidden from client view |
| `is_reuse_based` | `boolean not null default false` | |
| `created_by_user_id` | `uuid null references user_profiles(id) on delete set null` | |
| `approved_by_user_id` | `uuid null references user_profiles(id) on delete set null` | |
| `created_at` / `updated_at` | `timestamptz not null default now()` | |

Notes:
- `concept_id` and `draft_variant_id` are bare uuid placeholders. FKs are added in M006.
- No real publishing API. `published_at` and `post_status='published'` are set manually or by a future M008+ worker.

### 2.2 `post_slots`

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid pk default gen_random_uuid()` | |
| `client_id` | `uuid not null references clients(id) on delete cascade` | |
| `platform_name` | `text not null check (...same enum as posts...)` | |
| `slot_date` | `date not null` | |
| `slot_time` | `time not null` | local-time-of-day in the slot's `timezone` |
| `timezone` | `text not null` | IANA timezone; required |
| `status` | `text not null default 'open' check (status in ('open','reserved','scheduled','completed','skipped'))` | |
| `reserved_post_id` | `uuid null references posts(id) on delete set null` | |
| `created_at` / `updated_at` | `timestamptz not null default now()` | |

Constraint:
- `unique (client_id, platform_name, slot_date, slot_time)` — one slot per client/platform/datetime; reuse the slot rather than inserting duplicates.

Notes:
- `timezone` is required; no default. Client's `clients.timezone` is the natural source on insert.
- No background scheduler. Slot fill is a manual / future-worker concern.

---

## 3. Media linkage (M003 deferred FK)

In M003, `media_assets.linked_post_id` was created as a bare `uuid`
placeholder column without a FK because `posts` did not exist yet. M004
adds:

```sql
alter table public.media_assets
  add constraint media_assets_linked_post_id_fkey
  foreign key (linked_post_id) references public.posts(id)
  on delete set null;
```

Pre-flight: every existing `media_assets.linked_post_id` is NULL or
points to a real `posts.id`. Greenfield ⇒ trivially safe; otherwise null
out orphans first.

---

## 4. Client-safe calendar view (stub in M004 SQL when authored)

Pattern: `with (security_invoker = true)`; view hides internal columns.

**`client_portal_calendar_view`** — exposes: `client_id`, `post_id` (id),
`platform_name`, `content_type`, `client_safe_title` (the `title` column
or a translated fallback like `"Post for {platform_name} on {date}"`),
`scheduled_for`, `published_at`, `status_label` (translation of
`post_status`), `thumbnail_url` (joined via `media_assets`).

Hidden: `concept_id`, `draft_variant_id`, `created_by_user_id`,
`approved_by_user_id`, `publish_failure_reason`, `caption_text` unless
intentionally exposed, internal approval timestamps, internal `title`
when sensitive.

`status_label` translation (proposed):
- `planning` / `awaiting_content` / `ready_for_review` / `approved` / `ready_to_schedule` → **"In progress"** (collapse internal pipeline)
- `scheduled` → **"Scheduled"**
- `published` → **"Posted"**
- `failed` / `reschedule_required` → **"Needs another shot"**
- `archived` → not surfaced

---

## 5. RLS plan

### 5.1 `posts`

- **Client SELECT** — own client only, ideally through `client_portal_calendar_view` for column hiding. Base policy: `client_id = current_user_client_id() AND post_status in ('scheduled','published')` — clients do not see internal pipeline states.
- **Client INSERT / UPDATE / DELETE** — DENIED in M004. Future "client request a post change" goes through `client_requests` (already shipped in M002), not direct table writes.
- **Team manage assigned** — `can_manage_client_operations(client_id)` for `for all`. Team is the primary author here.
- **Operator** — view all + update operational fields.
- **Owner** — full access.
- **System** — updates `post_status` → `published`/`failed` via service role (RLS bypass). No real API in M004.

### 5.2 `post_slots`

- **Client SELECT** — own client only, through `client_portal_calendar_view` join. Base policy: `client_id = current_user_client_id()`.
- **Client INSERT / UPDATE / DELETE** — DENIED.
- **Team manage assigned** — `can_manage_client_operations(client_id)`.
- **Operator** — view all + update.
- **Owner** — full access.

No real publishing permission anywhere; M004 is a schema migration only.

---

## 6. Indexes

- `posts (client_id)`
- `posts (post_status)`
- `posts (scheduled_for)`
- `posts (platform_name)`
- `post_slots (client_id)`
- `post_slots (platform_name, slot_date)` — composite for calendar lookups
- `post_slots (status)`
- `post_slots (reserved_post_id)` — for "what's in this slot" lookups

(The `unique(client_id, platform_name, slot_date, slot_time)` constraint creates its own index.)

---

## 7. Seed strategy

| Demo source | Target table |
|---|---|
| `demoPosts.ts` | `posts` |
| `demoPostSlots.ts` | `post_slots` |
| `demoMediaAssets.ts` linkage | `media_assets.linked_post_id` after posts exist |

Rules: dev-only, idempotent, stable UUIDs, no real client data, no real
platform publishing. Seed runs as service role inside a single
transaction.

---

## 8. Test plan

Outline in `docs/MIGRATION_004_TEST_PLAN_OUTLINE.md`. The full test
plan is authored when the M004 SQL draft itself is authored.

---

## 9. Migration 004 draft SQL — decision

**Decision (this pass): planning-only; SQL draft NOT created.**

Rationale: matches the explicit prompt instruction ("No SQL draft yet
unless clearly asked later"). The plan above is concrete enough that
the eventual draft will be a near-mechanical translation. Authoring
the SQL is the next forward step once M003 promotion / testing has
progressed.

---

## 10. Cross-references

- M001 draft: `docs/sql_drafts/migrations_review/001_identity_foundation_draft.sql`
- M002 draft: `docs/sql_drafts/migrations_review/002_client_foundation_draft.sql`
- M003 draft: `docs/sql_drafts/migrations_review/003_media_foundation_draft.sql`
- M004 test outline (this plan's tests): `docs/MIGRATION_004_TEST_PLAN_OUTLINE.md`
