# M003 Dev Test Results

**Date:** _______________
**Tester:** _______________
**Dev Supabase project:** _______________
**Source commit:** _______________

## Pre-run checklist

- [ ] DEV project confirmed (not production)
- [ ] M001 + M002 previously applied and tested green
- [ ] M001 fixture users + M002 demo clients exist
- [ ] No real client / restaurant data in this project
- [ ] AUTH_MODE = "placeholder" in the app
- [ ] Portal not connected to this project
- [ ] 01_apply_m003.sql applied without errors
- [ ] 01b_apply_notifications_status_guard.sql applied without errors
- [ ] 02_seed_m003_dev_data.sql applied without errors
- [ ] Seed verify counts: media_assets=5, notifications=4, client_health_snapshots=2, activity_logs=3

**UUIDs used:**

| User | UUID |
|---|---|
| owner@veroxa.test | |
| operator@veroxa.test | |
| team@veroxa.test | |
| team2@veroxa.test | 12222222-2222-4222-a222-222222222222 |
| client@veroxa.test | |
| Demo Restaurant A | a0000000-0000-4000-a000-00000000000a |
| Demo Restaurant B | b0000000-0000-4000-b000-00000000000b |

---

## Test Results

### Test 1 — media_assets client own-write rules

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 1a. defaults insert succeeds | source_type=client_upload, status=uploaded | | |
| 1b. cross-client insert | RLS denial | | |
| 1c. source_type=team_upload | RLS denial | | |
| 1d. review_status=approved | RLS denial | | |
| 1e. source_type=legacy_reuse | RLS denial | | |

### Test 2 — media_assets client read scoping

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 2a. for_a=3, for_b=0 | | | |
| 2b. sees_b | 0 | | |

### Test 3 — media_assets client cannot edit staff fields

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 3a. review_status update | 0 rows | | |
| 3b. internal_note update | 0 rows | | |
| 3c. quality_score update | 0 rows | | |

### Test 4 — client portal media view (DEFERRED)

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| view query | relation does not exist | | |

### Test 5 — media_assets team review

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 5a. team@ A update | 1 row | | |
| 5b. team@ B update | 0 rows | | |
| 5c. team2@ B update (reporter) | 0 rows | | |

### Test 6 — operator / owner full access

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 6a. operator SELECT | 5 | | |
| 6b. operator UPDATE | 1 row | | |
| 6c. owner SELECT/UPDATE/DELETE | 5 / 1 / 1 | | |

### Test 7 — notifications client scoping  ⚠ PREDICTED FAIL (source defect)

See README "Predicted source-draft defects". `can_view_client` in the
`notifications_select_assigned_team` policy extends visibility to client
role for own-tenant team/operator notifications.

| Check | Plan-intended | Predicted actual | Recorded actual | Pass/Fail |
|---|---|---|---|---|
| count + role filter | 1, 1 | 3, 1 | | |
| row identity | NOTIF_A_CLIENT only | NOTIF_A_CLIENT + NOTIF_A_TEAM + NOTIF_A_OPERATOR | | |

### Test 8 — notifications client status flip (baseline)

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 8a. seen on own | 1 row | | |
| 8b. dismissed on own | 1 row | | |
| 8c. seen on B's | 0 rows | | |

### Test 9 — notifications team scoping

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| team_a=1, op_a=1, client_a=0, any_b=0 | | | |

### Test 10 — notifications operator/owner all

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| operator count | 4 | | |
| owner count | 4 | | |

### Test 11 — health snapshots system insert + client visibility

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 11a. service-role insert | 1 row | | |
| 11b. client SELECT own | ≥1 row | | |

### Test 12 — health snapshots append-only

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 12a. client UPDATE | 0 rows | | |
| 12b. team UPDATE | 0 rows | | |
| 12c. operator UPDATE | 0 rows | | |
| 12d. owner UPDATE | 1 row (D4 design choice) | | |

### Test 13 — activity_logs client no access  ⚠ PREDICTED FAIL on 13a (source defect)

See README "Predicted source-draft defects". `can_view_client` in
`activity_logs_select_assigned_team` extends read visibility to client
role for own-tenant rows whose entity_type is allowlisted.

| Check | Plan-intended | Predicted actual | Recorded actual | Pass/Fail |
|---|---|---|---|---|
| 13a. SELECT | 0 | 1 (LOG_A_MEDIA) | | |
| 13b. INSERT | RLS denial | RLS denial (no defect) | | |

### Test 14 — activity_logs team allowlist

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| media_rows=1, client_entity_rows=0, any_b=0 | | | |

### Test 15 — activity_logs operator/owner all

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| operator count | 3 | | |
| owner count | 3 | | |

### Test 16 — activity_logs immutability

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 16a. client UPDATE | 0 rows | | |
| 16b. team UPDATE | 0 rows | | |
| 16c. operator UPDATE | 0 rows | | |
| 16d. owner UPDATE | 1 row (D4 design choice) | | |

### Test 17 — activity_logs manual insert

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 17a. operator INSERT | 1 row | | |
| 17b. client INSERT | RLS denial | | |
| 17c. team INSERT | RLS denial | | |

### Test 18 — cascade

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 18a. delete client B → 0 in all 4 | | | |

### Test 19 — cross-tenant probe

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 19a. client@ probe B | all 0 | | |
| 19b. team@ probe B | all 0 | | |

### Test 20 — anon blocked

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| anon media | 0 | | |
| anon notif | 0 | | |
| anon snap | 0 | | |
| anon logs | 0 | | |
| anon insert media | RLS denial | | |

### Test 21 — Notifications client-update column guard

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 21a. status=seen | 1 row, updated_at advanced | | |
| 21b. status=dismissed | 1 row | | |
| 21c. status=escalated | ERROR (guard) | | |
| 21d. status=created | ERROR (guard) | | |
| 21e. title change | ERROR (guard) | | |
| 21f. message_body change | ERROR (guard) | | |
| 21g. priority change | ERROR (guard) | | |
| 21h. notification_type change | ERROR (guard) | | |
| 21i. trigger_source change | ERROR (guard) | | |
| 21j. target_role change | ERROR (guard) | | |
| 21k. target_user_id change | ERROR (guard) | | |
| 21l. client_id change | ERROR (guard) | | |
| 21m. dismissed→seen | ERROR (guard) | | |
| 21n. target B notification | 0 rows | | |
| 21o. team title change | 1 row (bypass) | | |
| 21p. operator priority change | 1 row (bypass) | | |
| 21q. owner full update | 1 row (bypass) | | |

---

## Summary

| Section | Required | Passed | Failed | Notes |
|---|---|---|---|---|
| Test 1 | 5 | | | |
| Test 2 | 2 | | | |
| Test 3 | 3 | | | |
| Test 4 (view deferred) | 1 | | | |
| Test 5 | 3 | | | |
| Test 6 | 3 | | | |
| Test 7 | 2 | | | |
| Test 8 | 3 | | | |
| Test 9 | 1 | | | |
| Test 10 | 2 | | | |
| Test 11 | 2 | | | |
| Test 12 | 4 | | | |
| Test 13 | 2 | | | |
| Test 14 | 1 | | | |
| Test 15 | 2 | | | |
| Test 16 | 4 | | | |
| Test 17 | 3 | | | |
| Test 18 | 1 | | | |
| Test 19 | 2 | | | |
| Test 20 | 5 | | | |
| Test 21 (guard) | 17 | | | |
| **TOTAL** | **68** | | | |

---

## Decision

- [ ] **M003 GREEN** — all required tests passed. Ready to plan M004 dev test.
- [ ] **M003 NEEDS CORRECTION** — failures noted above. Do not proceed to M004.
- [ ] **STOP — MAJOR ISSUE** — unexpected behavior found. Document and escalate.

**Note on Tests 7 + 13:** Both are predicted to fail due to the
`can_view_client` over-broad-scope defect in the M003 source draft (see
README). If the recorded actuals match the predicted values, the
correct decision is **M003 NEEDS CORRECTION** with a follow-up to draft
the `*_select_assigned_team` policy fix (swap `can_view_client` →
`is_assigned_to_client`, or add explicit `current_user_role() <>
'client'`) before promoting M003 anywhere beyond the dev project.

**Failed tests (if any):**

**Root cause (if any):**

**Recommended action:**

### Decision on D4 (owner-trusted append-only)

Tests 12d and 16d expect owner UPDATE to succeed (owner_all is `for all`).
Confirm your stance:

- [ ] **Keep as-is** — owner is trusted to not edit append-only tables; documented weakness
- [ ] **Tighten in next pass** — replace `owner_all` with explicit `for select` + `for insert` owner policies on `client_health_snapshots` and `activity_logs`

---

## Final confirmations

- [ ] M004–M006 were NOT applied during this run
- [ ] Portal-connect views were NOT applied
- [ ] Post-slot reset guard was NOT applied
- [ ] AUTH_MODE remains "placeholder" in the app
- [ ] Portal not connected to this dev project
- [ ] No real client credentials issued
- [ ] No real restaurant content in seed
- [ ] Locked pricing untouched
