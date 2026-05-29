# Client ↔ Team Workflow Contract

> **Update (2026-05-29).** The real workflow foundation now implements this
> contract in code as a production-shaped data model + repository with a
> swappable storage layer (temporary browser persistence, backend pending).
> See `REAL_WORKFLOW_FOUNDATION.md`. The shape below remains the target for the
> real backend tables.

> **Purpose.** This contract defines the first real backend slice for the
> Client ↔ Veroxa Team work and communication layer. The lifecycle and status
> model are now implemented via `src/lib/workflow/*` behind a repository; cloud
> persistence (e.g. Supabase) is still pending. This doc describes the shape
> that will become real backend tables when the backend is activated.

---

## 1. Current fixture / repository baseline

- **Fixtures:** `src/data/demo/demoClientTeamWork.ts`
  - `demoClientTeamSubmissions` (the request / ticket / work row)
  - `demoClientTeamMessages` (threaded messages with visibility split)
  - `demoClientActionItems` (granular client-facing next actions)
- **Repository:** `src/lib/repositories/clientTeamWorkRepository.ts`
  - Single canonical read path for client and team portals.
  - **Visibility is enforced here** — callers cannot accidentally leak
    `internalTeamNote` or `team_only` messages to client surfaces.
- All behavior is fixture/read-only. No network, no Supabase, no
  localStorage, no mutations. Demo IDs only: `demo-a`, `demo-b`, `demo-c`,
  `demo-d`.

## 2. Future Supabase tables

Four tables, one-to-one with the fixture types:

1. `client_team_submissions` ← `ClientTeamSubmission`
2. `client_team_messages` ← `ClientTeamMessage`
3. `client_action_items` ← `ClientActionItem`
4. `client_team_status_events` ← `ClientTeamStatusEvent`

The fixture column names map directly (camelCase → snake_case). Migration
should be a clean rename + connection swap; the repository surface stays the
same.

## 3. Draft table fields

### `client_team_submissions`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `client_id` | `uuid` FK → `clients.id` | NOT NULL |
| `submitted_by` | `text` | enum: `client` / `team` |
| `submission_type` | `text` | enum: `media`, `menu_update`, `promotion`, `correction`, `question`, `access_info`, `general_request` |
| `source_channel` | `text` | **Nullable.** enum: `client_portal`, `restaurant_upload`, `team_created`, `system_seeded`. Optional — repo derives a default when unset. |
| `work_type` | `text` | **Nullable.** enum: `content`, `media_review`, `menu_update`, `google_update`, `reporting`, `client_support`. Optional — `getSubmissionWorkType` derives from `submission_type`. |
| `title` | `text` | NOT NULL |
| `description` | `text` | NOT NULL |
| `status` | `text` | enum: `new`, `needs_review`, `needs_client_clarification`, `accepted`, `in_progress`, `blocked`, `completed`, `archived` |
| `priority` | `text` | enum: `low`, `normal`, `high`, `urgent` |
| `team_work_status` | `text` | **Nullable.** enum: `not_started`, `ready_for_team`, `in_progress`, `waiting_on_client`, `ready_for_review`, `completed`. Optional — `getSubmissionTeamWorkStatus` derives from `status`. |
| `client_visible_note` | `text` | Safe to render on client portal |
| `internal_team_note` | `text` | **Team-only** — never rendered on client pages |
| `requested_client_action` | `text` | Nullable |
| `linked_media_id` | `uuid` FK → `media_items.id` | Nullable |
| `linked_work_item_id` | `uuid` FK → `work_items.id` | Nullable |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()`, auto-updated |

> The following fields are **derived at read time** and are NOT persisted columns: `client_status_label`, `team_status_label`, `next_team_action`, `next_client_action`. Helpers live in `demoClientTeamWork.ts` (`getSubmissionClientStatusLabel`, `getSubmissionTeamStatusLabel`, `getSubmissionNextTeamAction`, `getSubmissionNextClientAction`).
>
> Soft-archival is currently expressed by `status = 'archived'` only. A dedicated `archived_at timestamptz` column may be added in a later migration if filtering by archive date becomes useful, but it is intentionally **not** part of this initial slice.

### `client_team_messages`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `client_id` | `uuid` FK → `clients.id` | NOT NULL |
| `submission_id` | `uuid` FK → `client_team_submissions.id` | **Nullable** — most messages thread off a submission, but free-form `client_and_team` notes can stand alone. |
| `sender_role` | `text` | enum: `client` / `team` |
| `body` | `text` | NOT NULL |
| `visibility` | `text` | enum: `client_and_team`, `team_only` — default `client_and_team` |
| `action_required` | `boolean` | default `false` |
| `created_at` | `timestamptz` | default `now()` |

### `client_action_items`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `client_id` | `uuid` FK → `clients.id` | NOT NULL |
| `title` | `text` | NOT NULL |
| `description` | `text` | NOT NULL |
| `status` | `text` | enum: `open`, `waiting_on_team`, `completed` |
| `due_label` | `text` | e.g. "By Thu", "This week", "ASAP" |
| `related_submission_id` | `uuid` FK → `client_team_submissions.id` | Nullable |

> Note: this slice intentionally omits `created_at` / `updated_at` on
> `client_action_items` because the fixture type does not carry them today.
> They will be added when the first write path lands; until then, ordering
> follows the linked submission's `updated_at`.

### Future AI-first SOP fields (not yet persisted)

The AI-first SOP layer is currently a deterministic, read-only preview
(`src/lib/ai/aiAgentPreviewEngine.ts`). When the backend is activated and a
real model call slots in behind those interfaces, the following **nullable**
columns are the planned persistence shape. None of these exist as columns
today — they are computed at read time by the preview engine.

| Field | Type | Notes |
|-------|------|-------|
| `report_draft_status` | `text` | **Nullable.** enum: `ready`, `needs_human_review`, `approved`, `blocked`, `manual_review_needed`. Mirrors `AiAgentStatus` for a report draft. |
| `ai_draft_summary` | `text` | **Nullable.** The AI-assisted draft summary text. Always treated as a draft until a human verifies it. |
| `missing_data_flags` | `text[]` | **Nullable.** Reasons the draft is incomplete (e.g. metrics not connected, no publishing activity). Empty/null when nothing is missing. |
| `human_verified_at` | `timestamptz` | **Nullable.** Set when a Veroxa team member approves the AI draft. `NULL` means "AI-assisted draft, not yet verified" — nothing client-facing may ship while null. |
| `client_visible_status` | `text` | **Nullable.** The calm, client-safe label derived from internal status: `Uploaded`, `Being reviewed`, `Needs your input`, `Prepared by Veroxa`, `Included in report`. |

> Invariant: `human_verified_at IS NULL` ⇒ the item is an unverified
> AI-assisted draft and must not be surfaced to a client as final. The
> `client_visible_status` never exposes internal AI agent names, risk levels,
> or quality scores.

### `client_team_status_events`

Captures the audit trail of how a submission moved through statuses.
`client_visible` is the hard switch the repository layer uses to decide
whether a client portal can render the event.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `client_id` | `uuid` FK → `clients.id` | NOT NULL |
| `submission_id` | `uuid` FK → `client_team_submissions.id` | NOT NULL |
| `from_status` | `text` | Nullable — enum matches `client_team_submissions.status` |
| `to_status` | `text` | NOT NULL — enum matches `client_team_submissions.status` |
| `actor_role` | `text` | enum: `client`, `team`, `system` |
| `note` | `text` | NOT NULL — short human-readable note |
| `client_visible` | `boolean` | default `false`. **Client portals only ever render events where this is `true`.** Internal triage / assignment / fallback-plan notes stay `false`. |
| `created_at` | `timestamptz` | default `now()` |

> Read paths: client portals must go through
> `getClientLatestStatusUpdates(clientId)` /
> `getClientVisibleStatusEvents(clientId)` in the repository, which both
> enforce `client_visible = true` and map status into the four
> client-friendly buckets: **Received / In progress / Waiting on your
> input / Completed**. Team surfaces use `getTeamStatusTimeline(clientId)`
> and `getTeamSubmissionStatusEvents(submissionId)` for the full history.

## 4. Visibility rules

- A client can read only their own `client_team_submissions`.
- A client **never** sees `internal_team_note`.
- A client sees only messages where `visibility = 'client_and_team'`.
- A client sees only status events where `client_visible = true`. The
  internal-only events (e.g. team assignments, fallback plans) are
  surfaced exclusively through the team-only repository helpers.
- The team can see assigned client records, including `team_only` messages,
  `internal_team_note`, and all status events.
- Operator and Owner read rules are intentionally **parked** and will be
  defined in a later contract.

## 5. Out of scope (for this contract)

- No migrations yet.
- No RLS policies yet (they will be added when the tables are created).
- No real auth yet.
- No writes / inserts / updates / deletes yet.
- No storage uploads yet.
- No notifications (email, SMS, WhatsApp, in-app) yet.

## 6. First future write paths

When the backend is activated, write paths should land in this order:

1. **Client creates a submission.** `INSERT` into `client_team_submissions`
   with `submitted_by = 'client'`, `source_channel = 'client_portal'`. This
   is the simplest, lowest-risk write because it does not require team or
   storage coordination.
2. **Team posts a message or asks for clarification.** `INSERT` into
   `client_team_messages` with the team's chosen `visibility`, and
   `UPDATE` the parent submission's `status` (e.g. → `needs_client_clarification`).
3. **File upload / storage.** Only after (1) and (2) are validated end-to-end.

## 7. Repository readiness checklist

| Requirement | Status |
|-------------|--------|
| Fixture types mirror table columns (optional fields marked nullable in the contract) | ✅ |
| Visibility split enforced at repository layer | ✅ `getClientVisibleSubmissions` strips `internalTeamNote`; `getClientVisibleMessages` filters `team_only` |
| All client surfaces read through the repository | ✅ `/demo/client`, `/demo/client/requests`, `/demo/client/media`, `/demo/client/updates` |
| Normalized client `ClientWorkItem` and team `TeamWorkItem` shapes | ✅ Returned by all the new repo helpers |
| `linked_work_item_id` / `linked_media_id` ready for FKs | ✅ string IDs in fixtures |
| Derived fields are pure helpers, not persisted | ✅ `getSubmission{WorkType,TeamWorkStatus,ClientStatusLabel,TeamStatusLabel,NextTeamAction,NextClientAction}` |

## 8. Future reporting workflow fields

AI-assisted reporting drafts (Team Report Queue) anticipate a future
`client_reports` table. Today drafts are rule-based previews, or AI-assisted
via `POST /api/ai/draft` when configured, and are always human-verified before
reaching a client. See `FUTURE_BACKEND_CONTRACT.md` for the full field table.

| Field | Type | Notes |
|-------|------|-------|
| `report_type` | `text` | enum: `weekly`, `monthly`. |
| `source_work_item_ids` | `uuid[]` | Completed work items the draft is based on. |
| `ai_draft_status` | `text` | Draft lifecycle status. |
| `ai_draft_mode` | `text` | enum: `ai`, `rule_based_fallback`, `not_configured`, `error`. |
| `missing_data_flags` | `text[]` | **Internal only** — never rendered on client surfaces. |
| `human_verification_status` | `text` | enum: `pending`, `verified`. |
| `approved_by` | `uuid` | Team member who approved. |
| `approved_at` | `timestamptz` | Nullable. |
| `client_visible_at` | `timestamptz` | When the report became client-visible. |

> **Invariant.** No AI output is treated as final. Client Reports shows calm
> plain-language status only; internal missing-data flags are never shown to
> the client.
