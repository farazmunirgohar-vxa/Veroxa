# Migration 004 — Posting Foundation: Test Plan Outline

**Status:** Outline only. The full plan with fixtures and pass/fail
cells is authored alongside the M004 SQL draft. `AUTH_MODE` remains
`"placeholder"`.

## Prerequisites
- [ ] Migration 001, 002, and 003 all applied and green on the target project.
- [ ] M001+M002+M003 fixture set present.

## Scope under test
Tables: `posts`, `post_slots`. FK addition:
`media_assets.linked_post_id → posts(id)`. View stub:
`client_portal_calendar_view`.

---

## Headline test cases

### 1. Client calendar visibility
- [ ] Client sees only own client's `posts` and `post_slots`.
- [ ] Client base-table `select` on `posts` excludes internal pipeline states (`planning`, `awaiting_content`, `ready_for_review`, `approved`, `ready_to_schedule`, `failed`, `reschedule_required`, `archived`) — only `scheduled` and `published` are visible.
- [ ] (After view ships) `client_portal_calendar_view` does NOT expose `concept_id`, `draft_variant_id`, `created_by_user_id`, `approved_by_user_id`, `publish_failure_reason`.
- [ ] `status_label` translates internal pipeline states to client-safe labels (e.g. all pre-scheduled internal states → "In progress").

### 2. Client cannot create / edit posts
- [ ] As client: `insert into public.posts (...)` → **denied** (no client INSERT policy).
- [ ] As client: `update public.posts set caption_text='...' where id=<own client's row>` → **denied** (no client UPDATE policy).
- [ ] Client must use `client_requests` for any post changes.

### 3. Team can create posts for assigned clients
- [ ] As team (assigned A, executor role): `insert into public.posts (client_id, platform_name, content_type) values (<A>, 'instagram', 'photo')` → succeeds.
- [ ] As team (assigned A): same insert with `client_id=<B>` → **denied**.
- [ ] As team2 (assigned B, **reporter** role): insert for B → **denied** (reporter excluded from `can_manage_client_operations`).

### 4. Operator / owner full visibility
- [ ] As operator: `select count(*) from public.posts` returns total.
- [ ] As owner: same.
- [ ] As operator: `update post_status` on any post → succeeds.

### 5. post_slots unique constraint
- [ ] Insert two slots with the same `(client_id, platform_name, slot_date, slot_time)` → second fails with unique violation.
- [ ] Same datetime on a different platform → succeeds.

### 6. media_assets.linked_post_id FK
- [ ] Setting `media_assets.linked_post_id` to a non-existent `posts.id` → fails with FK violation.
- [ ] Setting to a real `posts.id` → succeeds.
- [ ] Deleting the referenced `posts` row → `media_assets.linked_post_id` becomes NULL.
- [ ] The FK is added by M004; confirm M003 application alone did NOT add it.

### 7. No automatic publishing
- [ ] Inserting a post with `post_status='scheduled'` and `scheduled_for=<past timestamp>` does NOT cause any external API call (no integration exists).
- [ ] `published_at` is NULL until explicitly set.
- [ ] `post_status='failed'` and `publish_failure_reason='...'` are inert — no retry, no notification fan-out unless future M008+ wires it.

### 8. post_slots scheduling reference (no cascade publishing)
- [ ] Setting `post_slots.status='scheduled'` and `reserved_post_id=<post>` is a pure data write; nothing else happens.
- [ ] Deleting the referenced `posts` row → `post_slots.reserved_post_id` becomes NULL (the slot reopens).

### 9. Cascade behavior
- [ ] Delete a `clients` row → cascades on `posts` and `post_slots` for that client.
- [ ] Delete a `media_assets` row → `posts.media_asset_id` becomes NULL.
- [ ] Delete a `user_profiles` row referenced by `posts.created_by_user_id` / `approved_by_user_id` → those columns become NULL.

### 10. Anon blocked
- [ ] anon SELECT / INSERT / UPDATE / DELETE on `posts` and `post_slots` → denied (all policies `to authenticated`).

### 11. Cross-tenant isolation
- [ ] Client A cannot see B's posts or slots in any access path.
- [ ] Team assigned only to A cannot see / write B's posts or slots.

---

## Rollback expectation

**Forward-only + pre-cutover snapshot**, same as M001–M003.

### Rollback drop order (dev reference)

```text
-- Drop FK before the table that holds it (media_assets.linked_post_id
-- references posts(id)).
alter table public.media_assets drop constraint if exists media_assets_linked_post_id_fkey;
drop view  if exists public.client_portal_calendar_view;
drop table if exists public.post_slots cascade;
drop table if exists public.posts      cascade;
```

### Rollback tests
- [ ] Apply M004 to a clean dev project that has M001 + M002 + M003 → succeeds.
- [ ] Re-apply through the Supabase runner → "already applied".
- [ ] Re-run raw `.sql` → fails cleanly with "relation already exists".
- [ ] Snapshot restore: pre-M004 snapshot → apply → restore → state matches.
- [ ] FK drop test: drop the `linked_post_id` FK first, then drop `posts` — succeeds; reverse order fails.

---

## Blocking Issues Before Real Migration

| # | Issue | Severity | Resolution |
|---|---|---|---|
| E1 | M004 SQL draft does not yet exist | Blocker for M004 promotion | Author `docs/sql_drafts/migrations_review/004_posting_foundation_draft.sql` once M003 has progressed through testing. |
| E2 | `client_portal_calendar_view` is a stub (planned only in this outline) | Blocker for client calendar in the portal; NOT for M004 SQL promotion | Materialize in the portal-connect pass. |
| E3 | No automatic publishing — `post_status='published'` is manual | NOT a blocker for M004 | Real publishing is M008+. Document expectation that M004 ships without any external API contact. |
| E4 | `concept_id` and `draft_variant_id` are bare uuid placeholders | NOT a blocker for M004 | FKs added in M006 when those tables exist. |
| E5 | Test plan above is outline-only, no fixtures | Blocker for promotion | Materialize fixtures + per-test pass/fail cells when the SQL draft is authored. |
| E6 | Append-only / publishing-job design decisions not finalized (who writes `published_at`? Where does the worker live?) | NOT a M004 schema concern | Out of scope; tracked in `docs/SOCIAL_PUBLISHING_PLAN.md`. |

**Promotion gate:** M003 promoted + green. E1 + E5 closed (SQL drafted, tests fleshed out and run). E2 must resolve before the client portal calendar lights up.

---

## Cross-references

- M004 plan: `docs/MIGRATION_004_POSTING_FOUNDATION_PLAN.md`
- M003 draft: `docs/sql_drafts/migrations_review/003_media_foundation_draft.sql`
- M003 test plan: `docs/MIGRATION_003_TEST_PLAN.md`
- M002 draft: `docs/sql_drafts/migrations_review/002_client_foundation_draft.sql`
- Publishing track: `docs/SOCIAL_PUBLISHING_PLAN.md`
