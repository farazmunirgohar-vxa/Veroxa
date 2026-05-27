# M004 Dev Test Results

**Package:** `docs/sql_drafts/dev_test/m004/`
**Source draft:** `docs/sql_drafts/migrations_review/004_posting_foundation_draft.sql`
**Test plan:** `docs/MIGRATION_004_TEST_PLAN.md`
**Executed on:** _(date)_
**Supabase dev project:** _(project ref)_
**Executor:** _(name)_

---

## Pre-run checklist

- [ ] M001 applied and green.
- [ ] M002 applied and green.
- [ ] M003 applied and green (including team-scope correction `01c`).
- [ ] M001–M003 fixture set present (5 users, 2 clients, media_assets).
- [ ] 01_apply_m004.sql ran without errors.
- [ ] 01b_apply_post_slot_reset_guard.sql ran without errors.
- [ ] 02_seed_m004_dev_data.sql ran with UUIDs replaced; confirmed counts (posts=7, slots=4).
- [ ] AUTH_MODE still `"placeholder"`.
- [ ] Portal NOT connected.

---

## Test Results

**Legend:** ✅ Pass | ❌ Fail | ⚠ Predicted fail | ⏭ Deferred

### Test 1 — Client calendar visibility  ⚠ PREDICTED FAIL on 1a

See README "Predicted source-draft defect". `posts_select_staff` uses
`can_view_client` without status filter, giving client@A access to all 5 posts.

| Check | Plan-intended | Predicted actual | Recorded actual | Pass/Fail |
|---|---|---|---|---|
| 1a. client post count | 2 (scheduled+published) | 5 (all A posts) | | |
| 1b. client B post count | 0 | 0 | | |
| 1c. client slot count | 3 | 3 (same count, wrong policy) | | |

### Test 2 — Client cannot see draft/concept IDs (view layer)

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 2a. view not yet materialized | 0 rows | | |

### Test 3 — Client cannot see raw publish failure reason

| Check | Plan-intended | Predicted actual | Recorded actual | Pass/Fail |
|---|---|---|---|---|
| 3a. client cannot see failed post | 0 rows | 1 row (if defect confirmed) | | |

### Test 4 — Client cannot directly update posts

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 4a. client UPDATE caption → 0 rows | 0 rows | | |
| 4b. client UPDATE status → 0 rows | 0 rows | | |
| 4c. client DELETE → 0 rows | 0 rows | | |
| 4d. client INSERT → ERROR | RLS ERROR | | |

### Test 5 — Team can create posts for assigned clients

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 5a. team INSERT for A | 1 row inserted | | |
| 5b. team UPDATE post_status | 1 row | | |
| 5c. team UPDATE caption | 1 row | | |

### Test 6 — Team cannot create posts for unassigned clients

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 6a. team@A INSERT for B | RLS ERROR | | |
| 6b. team@A UPDATE B's post | 0 rows | | |
| 6c. team2 (reporter) INSERT for B | RLS ERROR | | |
| 6d. team2 SELECT B's posts | 2 rows | | |

### Test 7 — Operator can view / update all posts

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 7a. total posts count | 7 | | |
| 7b. operator UPDATE post_status | 1 row | | |
| 7c. operator UPDATE scheduled_for | 1 row | | |

### Test 8 — Owner full access

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 8a. owner posts count | 7 | | |
| 8a. owner UPDATE post | 1 row | | |
| 8a. owner DELETE post | 1 row | | |
| 8b. owner slots count | 4 | | |
| 8b. owner UPDATE slot | 1 row | | |

### Test 9 — post_slots unique constraint

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 9a. first insert → succeeds | 1 row | | |
| 9b. exact duplicate → fails | UNIQUE ERROR | | |
| 9c. same datetime different platform | 1 row | | |
| 9d. same datetime different client | 1 row | | |
| 9e. same client/platform/date, diff time | 1 row | | |

### Test 10 — media_assets.linked_post_id FK

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 10a. FK to non-existent post → ERROR | FK ERROR | | |
| 10b. FK to real post → succeeds | 1 row | | |
| 10c. constraint exists | 1 row (conname) | | |
| 10d. delete post → linked_post_id NULL | NULL | | |

### Test 11 — Scheduled posts do not publish automatically

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 11a. past-scheduled post lands; published_at stays NULL | 1 row, no auto-pub | | |
| 11b. no cron/net/http extensions | 0 rows | | |

### Test 12 — Failed status does not trigger real API

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 12a. failed insert inert | 1 row, no side effects | | |
| 12b. failed update inert | 1 row | | |

### Test 13 — Cross-tenant isolation

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 13a. client@A sees 0 B posts | 0 | | |
| 13a. client@A sees 0 B slots | 0 | | |
| 13b. team@A sees 0 B posts | 0 | | |
| 13b. team@A sees 0 B slots | 0 | | |

### Test 14 — Cascade behavior

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 14a. delete client → posts + slots cascade | 0 / 0 after delete | | |
| 14b. delete media_asset → posts.media_asset_id NULL | NULL | | |
| 14c. delete post → slot resets + reserved_post_id NULL | open / NULL | | |
| 14d. delete post → linked_post_id NULL | NULL | | |
| 14e. both user FK constraints exist | 2 rows | | |

### Test 15 — Anon access fully blocked

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 15a. anon SELECT posts | 0 rows | | |
| 15b. anon SELECT slots | 0 rows | | |
| 15c. anon INSERT | ERROR | | |

### Test 16 — Helper short-circuits still apply

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 16a. operator manages both clients | 1 row each | | |

### Test 17 — Concept / variant placeholders as bare UUIDs

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 17a. insert with random concept_id/draft_variant_id | 1 row | | |
| 17b. no FK constraints yet | 0 rows | | |

### Test 18 — View stub conformance (deferred)

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 18a. view not yet created | 0 rows | | ⏭ Deferred |
| 18b. posts indexes exist | 6+ indexes | | |
| 18b. post_slots indexes exist | 5+ indexes | | |

---

## Slot Reset Trigger Tests

### Guard-T1 — reserved slot resets to open when post deleted

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| Slot status | open | | |
| reserved_post_id | NULL | | |

### Guard-T2 — unrelated slot unchanged

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| SLOT_A1 resets | open / NULL | | |
| SLOT_A2 unchanged | reserved / temp_post_id | | |

### Guard-T3 — scheduled slot NOT reset (publishing history preserved)

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| Status stays 'scheduled' | scheduled | | |
| reserved_post_id | NULL (FK set null) | | |

### Guard-T4 — bulk delete resets all reserved slots

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| SLOT_A2 | open / NULL | | |
| SLOT_A3 | open / NULL | | |

### Guard-T5 — re-delete non-existent post is a no-op

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| Row count | 0 rows, no error | | |

### Guard-T6 — client delete blocked; trigger never fires

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| Client delete | 0 rows | | |
| SLOT_A1 still reserved | reserved / POST_A1 | | |

### Guard-T7 — trigger exists with correct configuration

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| DELETE / BEFORE / ROW | 1 row | | |

---

## Total check count

| Section | Checks |
|---|---|
| Tests 1–18 | 42 |
| Guard tests | 14 |
| **TOTAL** | **56** |

---

## Decision

- [ ] **M004 GREEN** — all required tests passed (Test 1a documented as predicted fail — source draft needs correction). Ready to draft posts_select_staff fix and then plan M005 dev test.
- [ ] **M004 NEEDS CORRECTION** — unexpected failures beyond Test 1a. Do not proceed to M005.
- [ ] **STOP — MAJOR ISSUE** — unexpected behavior found. Document and escalate.

**Note on Test 1a:** A predicted fail on Test 1a (client sees 5 posts instead of 2) is an expected diagnostic, not a full stop. Record the actual, mark FAIL, and link to the README defect note. Continue running all other tests. The source-draft correction (swap `can_view_client` → `is_assigned_to_client` in `posts_select_staff` and `post_slots_select_staff`) must be drafted before M004 is promoted beyond dev.

**F7 decision (append-only on posts):** Any role with manage permissions can currently DELETE posts. Record here: _(allow staff to delete during planning state / OR require archival-only pattern)_.

**Failed tests (if any):**

**Root cause (if any):**
