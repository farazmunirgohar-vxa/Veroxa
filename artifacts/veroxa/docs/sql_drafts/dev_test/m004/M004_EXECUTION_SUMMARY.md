# M004 Execution Summary

## What this package tests

Migration 004 — Posting Foundation. Adds the `posts` and `post_slots`
tables, wires the deferred `media_assets.linked_post_id → posts(id) on
delete set null` FK (held back from M003 because posts didn't exist
yet), and applies the BEFORE DELETE trigger that resets orphaned reserved
slots when a post is deleted.

## Files in this package

| File | Purpose |
|---|---|
| `README.md` | Preconditions, execution order, predicted defect, stop conditions |
| `01_apply_m004.sql` | Faithful runnable copy of `004_posting_foundation_draft.sql` |
| `01b_apply_post_slot_reset_guard.sql` | Faithful runnable copy of `004_post_slot_reset_guard_draft.sql` |
| `02_seed_m004_dev_data.sql` | Dev fixtures — 5 A posts, 2 B posts, 4 slots, media linkage |
| `03_test_m004_queries.sql` | 18 test sections + 7 slot-reset guard checks (56 total) |
| `04_m004_test_results.md` | Pass/fail sheet |
| `M004_EXECUTION_SUMMARY.md` | This file |

## Key design decisions documented

**D5 — Append-only open question on posts (F7).** The M004 draft grants
`posts_manage_assigned` as a `for all` policy, so any team/operator with
manage rights can DELETE posts. The test plan flags this as F7 and calls
for a human decision: allow staff deletions during the planning state
(current draft — simplest, sufficient for MVP) or enforce soft-deletes
via `post_status='archived'` + removal of DELETE from the policy.
Record the decision in `04_m004_test_results.md`.

**D6 — Client SELECT is row-level only, not view-only.** M004's client
SELECT policy on `posts` already filters to `scheduled` and `published`
at the RLS level, so even a base-table client read won't leak in-progress
drafts. The `client_portal_calendar_view` adds column-hiding
(concept_id, approved_by_user_id, publish_failure_reason) and label
translation; it's the presentation layer, not the security layer.

**D7 — No automatic publishing in M004.** `scheduled_for` is just a
timestamp. `published_at` and `post_status='published'` are set manually
or by a future background worker. M004 SQL contains no pg_cron, pg_net,
http extension calls, or edge function references.

**D8 — Slot trigger fires BEFORE DELETE.** The reset guard runs BEFORE
the FK `on delete set null` fires, so `old.id` is still present in the
WHERE clause when the trigger executes. This ordering is intentional.
`scheduled`/`completed`/`skipped` slots are not reset — they represent
publishing history.

## Predicted source-draft defect

`posts_select_staff` uses `private.can_view_client(client_id)` without
a status filter. Since `can_view_client` returns TRUE for a client
viewing their own client_id, a client-role caller sees ALL posts for
their own client — including `planning`, `ready_for_review`, `failed`,
and the raw `publish_failure_reason`. Test 1a is predicted to fail
(client sees 5 instead of 2). Same helper in `post_slots_select_staff`
doesn't change the count (client still sees 3 slots) but is the same
policy-design defect.

Recommended correction: swap `can_view_client` → `is_assigned_to_client`
in both `posts_select_staff` and `post_slots_select_staff`. Must be
resolved before M004 is promoted beyond dev.

## Stop conditions

- 01_apply_m004.sql errors → STOP.
- 01b errors → STOP.
- Seed fails after UUID replacement → STOP.
- Any required test fails beyond the predicted Test 1a failure → STOP.

## What to do when all required tests pass

1. Complete `04_m004_test_results.md` with all passes recorded.
2. Record the F7 (append-only) decision.
3. Draft the `posts_select_staff` / `post_slots_select_staff` correction
   (swap `can_view_client` → `is_assigned_to_client`) in
   `docs/sql_drafts/migrations_review/004_posts_select_staff_correction_draft.sql`
   and a companion `dev_test/m004/01c_apply_posts_select_staff_correction.sql`.
4. Re-run Tests 1a and 3a to confirm green after the correction.
5. Report back so M005 dev test package (Reporting Foundation) can be prepared.

## M004 fixture totals (post-seed)

| Table | Rows | Notes |
|---|---|---|
| `posts` | 7 | 5 for A (scheduled, published, planning, ready_for_review, failed) + 2 for B |
| `post_slots` | 4 | 3 for A (1 reserved, 2 open) + 1 for B (open) |
| `media_assets.linked_post_id` | 1 link | MEDIA_A3 → POST_A2 (Anniversary reel) |
