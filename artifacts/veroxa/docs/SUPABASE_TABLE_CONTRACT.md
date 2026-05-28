# Supabase Table Contract: Client ↔ Team Workflow

> This is the planned future schema for the real backend. The demo fixtures
> (`demoClientTeamWork.ts`) model this shape exactly so that migration to
> Supabase is a clean rename + connection swap.

> Current status: CONTRACT DRAFT — not yet implemented. All production reads
> still use the fixture repository (`clientTeamWorkRepository`). No real
> Supabase project is active yet.

---

## Tables

### 1. `client_team_submissions`

The core request / ticket / inbox row. Every piece of work or communication
that crosses the client ↔ team boundary starts here.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | `uuid` | PK | `gen_random_uuid()` | |
| client_id | `uuid` | FK → `clients.id`, NOT NULL | | |
| submitted_by | `text` | NOT NULL | | enum: `client` / `team` |
| submission_type | `text` | NOT NULL | | enum: `media`, `menu_update`, `promotion`, `correction`, `question`, `access_info`, `general_request` |
| title | `text` | NOT NULL | | |
| description | `text` | NOT NULL | | |
| status | `text` | NOT NULL | `new` | enum: `new`, `needs_review`, `needs_client_clarification`, `accepted`, `in_progress`, `blocked`, `completed`, `archived` |
| priority | `text` | NOT NULL | `normal` | enum: `low`, `normal`, `high`, `urgent` |
| created_at | `timestamptz` | NOT NULL | `now()` | |
| updated_at | `timestamptz` | NOT NULL | `now()` | auto-updated |
| client_visible_note | `text` | NOT NULL | | Rendered on client portal |
| internal_team_note | `text` | NOT NULL | | Team-only. Never rendered to client |
| requested_client_action | `text` | | | Nullable. What to ask the client to do next |
| linked_media_id | `uuid` | | | FK → `media_items.id` |
| linked_work_item_id | `uuid` | | | FK → `work_items.id` |

**RLS policies**
- `SELECT`: client sees own rows; team sees all rows.
- `INSERT`: client can insert with `submitted_by = 'client'`; team can insert with `submitted_by = 'team'`.
- `UPDATE`: client can update own rows (status only); team can update any row.
- `DELETE`: team only (soft delete via `archived` status preferred).

---

### 2. `client_team_messages`

Threaded messages linked to a submission. Visibility split means a single
submission can have a client-visible channel and a team-only channel.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | `uuid` | PK | `gen_random_uuid()` | |
| client_id | `uuid` | FK → `clients.id`, NOT NULL | | |
| submission_id | `uuid` | FK → `client_team_submissions.id`, NOT NULL | | |
| sender_role | `text` | NOT NULL | | enum: `client` / `team` |
| body | `text` | NOT NULL | | |
| created_at | `timestamptz` | NOT NULL | `now()` | |
| visibility | `text` | NOT NULL | `client_and_team` | enum: `client_and_team`, `team_only` |
| action_required | `boolean` | NOT NULL | `false` | |

**RLS policies**
- `SELECT`: client sees messages where `visibility = 'client_and_team'` AND `client_id = auth.uid()`; team sees all messages.
- `INSERT`: client can insert with `sender_role = 'client'` AND `visibility = 'client_and_team'`; team can insert with any visibility.
- `UPDATE` / `DELETE`: team only. Client messages are immutable.

---

### 3. `client_action_items`

Granular next actions derived from submissions. The client sees these as their
"to-do" list. The team uses them to track what they're waiting on.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | `uuid` | PK | `gen_random_uuid()` | |
| client_id | `uuid` | FK → `clients.id`, NOT NULL | | |
| title | `text` | NOT NULL | | |
| description | `text` | NOT NULL | | |
| status | `text` | NOT NULL | `open` | enum: `open`, `waiting_on_team`, `completed` |
| due_label | `text` | NOT NULL | | e.g. "By Thu", "This week", "ASAP" |
| related_submission_id | `uuid` | | | FK → `client_team_submissions.id` |
| created_at | `timestamptz` | NOT NULL | `now()` | |
| updated_at | `timestamptz` | NOT NULL | `now()` | auto-updated |

**RLS policies**
- `SELECT`: client sees own action items; team sees all.
- `INSERT` / `UPDATE` / `DELETE`: team only. Client cannot mutate action items.

---

## Indexes (planned)

```sql
create index idx_submissions_client_id on client_team_submissions(client_id);
create index idx_submissions_status on client_team_submissions(status);
create index idx_submissions_client_status on client_team_submissions(client_id, status);
create index idx_messages_submission_id on client_team_messages(submission_id);
create index idx_messages_client_visibility on client_team_messages(client_id, visibility);
create index idx_action_items_client_status on client_action_items(client_id, status);
```

## Migration path (when ready)

1. Create real Supabase project with these tables.
2. Run `supabase migration` to create the tables.
3. Replace `clientTeamWorkRepository` fixture calls with `supabase.from()` calls.
4. The repository API shape stays the same — callers consume the same types.
   - `getClientVisibleSubmissions` → `supabase.from("client_team_submissions").select("*, ...")` with RLS filtering.
   - `getClientVisibleMessages` → `supabase.from("client_team_messages").select("*").eq("client_id", ...).eq("visibility", "client_and_team")`.
   - `getClientOpenActions` → `supabase.from("client_action_items").select("*").eq("client_id", ...).neq("status", "completed")`.

## Repository readiness checklist

| Requirement | Status |
|-------------|--------|
| Fixture types mirror table columns exactly | ✅ `ClientTeamSubmission` fields match |
| Visibility split enforced at repository layer | ✅ `getClientVisibleSubmissions` strips `internalTeamNote`; `getClientVisibleMessages` filters `team_only` |
| No client surface imports raw data directly | ✅ All client pages use `clientTeamWorkRepository` |
| `linkedWorkItemId` / `linkedMediaId` ready for FKs | ✅ UUID strings in fixtures |
| Status enum values match planned DB enum | ✅ |
| `updated_at` auto-update planned | ✅ `now()` default in contract, fixture values hardcoded |
