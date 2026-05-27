# M002 Dev Test Results

**Date:** _______________
**Tester:** _______________
**Dev Supabase project:** _______________
**Project URL:** _______________
**Source commit:** _______________

## Pre-run checklist

- [ ] DEV project confirmed (not production)
- [ ] M001 was previously applied and tested green on this project
- [ ] M001 fixture users exist in `auth.users` + `public.user_profiles`
- [ ] team@veroxa.test has a `public.team_members` row
- [ ] No real client or restaurant data in this project
- [ ] AUTH_MODE = "placeholder" in the app
- [ ] Portal not connected to this project
- [ ] 01_apply_m002.sql applied without errors
- [ ] 02_seed_m002_dev_data.sql applied without errors
- [ ] Seed verify counts: clients=2, team_client_assignments=2, client_platforms=4, onboarding_items=6, client_requests=3

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

### Test 1 — FK on user_profiles.client_id

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 1a. Non-existent client_id | FK violation | | |
| 1b. Real clients.id | success | | |
| 1c. on delete set null behavior | client_id → NULL | | |

### Test 2 — Pricing-as-cents and locked values

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| All 5 locked-price inserts succeed | 5 rows | | |

### Test 3 — service_package vs plan_type checks

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 3a. GPS as plan_type | check violation | | |
| 3b. twelve_month as service_package | check violation | | |

### Test 4 — Client sees only own client

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 4a. Client total visible | 1 | | |
| 4b. Visible is Restaurant A | A | | |
| 4c. Sees Restaurant B | 0 | | |

### Test 5 — Client portal view column-hiding (DEFERRED to M003)

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| client_portal_clients_view query | relation does not exist | | |

### Test 6 — Team sees only assigned clients

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 6a. team@ → A only | 1 row A | | |
| 6b. team2@ → B only | 1 row B | | |

### Test 7 — Inactive assignment cuts off access

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| Owner deactivates team@/A assignment | 1 row | | |
| (Optional commit-and-test) team@ sees 0 | 0 | | |
| team_members.is_active=false also revokes | 0 | | |

### Test 8 — Operator/Owner see all

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 8a. operator count | 2 | | |
| 8b. owner count | 2 | | |

### Test 9 — Pricing-write guard: operator denied

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 9a. monthly_fee_cents | ERROR | | |
| 9b. plan_type | ERROR | | |
| 9c. service_package | ERROR | | |
| 9d. contract_months | ERROR | | |
| 9e. start_date | ERROR | | |
| 9f. assigned_operator_id | ERROR | | |

### Test 10 — Operator can change operational fields

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| account_status | 1 row | | |
| content_health_status | 1 row | | |
| risk_status | 1 row | | |
| posting_frequency_weekly | 1 row | | |
| assigned_team_label | 1 row | | |

### Test 11 — Owner can change pricing

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| monthly_fee_cents | 1 row | | |
| plan_type | 1 row | | |
| service_package | 1 row | | |
| assigned_operator_id | 1 row | | |

### Test 12 — team_client_assignments unique constraint

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 12a. dup (team1, A) | unique violation | | |
| 12b. (team1, B) | success | | |
| 12c. (team2, A) | success | | |

### Test 13 — Client request creation: own client only

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 13a. client@ inserts for A | success | | |
| 13b. client@ inserts for B | RLS denial | | |

### Test 14 — Client request select scoping

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 14a. client@ | A=2, B=0 | | |
| 14b. team@ | A=2, B=0 | | |
| 14c. team2@ | A=0, B=1 | | |
| 14d. operator | 3 | | |

### Test 15 — Onboarding item ownership

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 15a. client@ on client-owned A item | 1 row | | |
| 15b. client@ on operator-owned A item | 0 rows | | |
| 15c. client@ on B item | 0 rows | | |
| 15d. team@ on A items (any owner) | 2 rows | | |

### Test 16 — client_platforms internal notes (DEFERRED to M003)

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 16a. client_portal_platforms_view query | relation does not exist | | |
| 16b. client@ reads base-table notes | rows incl. notes (documented OK) | | |

### Test 17 — Helper semantics

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 17a. is_assigned(A) team@ | true | | |
| 17b. is_assigned(A) team2@ | false | | |
| 17c. is_assigned(A) operator | true | | |
| 17d. is_assigned(A) owner | true | | |
| 17e. is_assigned(A) client@ | false | | |
| 17f. is_assigned(A) anon | permission denied | | |
| 17g. can_view_client(A) client@ | true | | |
| 17h. can_view_client(B) client@ | false | | |
| 17i. can_manage_ops(A) team@ executor | true | | |
| 17j. can_manage_ops(B) team2@ reporter | false | | |
| 17k. can_manage_pricing() owner | true | | |
| 17l. can_manage_pricing() operator | false | | |

### Test 18 — Helper inactive-user behavior

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| Operator deactivated → is_operator() | false | | |
| Operator deactivated → can_view_client(A) | false | | |
| Operator deactivated → sees | 0 | | |
| Re-activated → is_operator() | true | | |
| Re-activated → sees | 2 | | |

### Test 19 — Helper EXECUTE grants

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 19a. anon → is_assigned_to_client | permission denied | | |
| 19a. anon → can_manage_pricing | permission denied | | |
| 19b. authenticated → all 4 helpers | succeed | | |

### Test 20 — Anon access blocked

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| clients | 0 | | |
| team_client_assignments | 0 | | |
| client_platforms | 0 | | |
| onboarding_items | 0 | | |
| client_requests | 0 | | |
| anon insert clients | RLS denial | | |
| anon insert client_requests | RLS denial | | |

### Test 21 — Cross-tenant isolation

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 21a. client@ reads B platforms | 0 | | |
| 21b. client@ updates B onboarding | 0 | | |
| 21c. team@ reads B platforms | 0 | | |
| 21d. team@ updates B requests | 0 | | |

### Test 22 — Cascade behavior

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 22a. Delete client B → child tables cascade | all 0 | | |
| 22b. Delete client A → client@ client_id nulls | NULL | | |
| 22c. Delete team_members → TCAs cascade | 0 remaining | | |

---

## Summary

| Section | Required | Passed | Failed | Notes |
|---|---|---|---|---|
| Test 1 (FK) | 3 | | | |
| Test 2 (pricing values) | 1 | | | |
| Test 3 (check constraints) | 2 | | | |
| Test 4 (client own) | 3 | | | |
| Test 5 (view deferred) | 1 | | | |
| Test 6 (team assigned) | 2 | | | |
| Test 7 (inactive assignment) | 3 | | | |
| Test 8 (operator/owner) | 2 | | | |
| Test 9 (pricing guard) | 6 | | | |
| Test 10 (operational fields) | 5 | | | |
| Test 11 (owner pricing) | 4 | | | |
| Test 12 (unique TCA) | 3 | | | |
| Test 13 (request own) | 2 | | | |
| Test 14 (request scoping) | 4 | | | |
| Test 15 (onboarding) | 4 | | | |
| Test 16 (notes hiding) | 2 | | | |
| Test 17 (helpers) | 12 | | | |
| Test 18 (inactive user) | 5 | | | |
| Test 19 (grants) | 3 | | | |
| Test 20 (anon) | 7 | | | |
| Test 21 (cross-tenant) | 4 | | | |
| Test 22 (cascade) | 3 | | | |
| **TOTAL** | **81** | | | |

---

## Decision

- [ ] **M002 GREEN** — all required tests passed. Ready to plan M003 dev test.
- [ ] **M002 NEEDS CORRECTION** — failures noted above. Do not proceed to M003.
- [ ] **STOP — MAJOR ISSUE** — unexpected behavior found. Document and escalate.

**Failed tests (if any):**

**Root cause (if any):**

**Recommended action:**

---

## Final confirmations

- [ ] M003–M006 were NOT applied during this run
- [ ] Portal-connect views were NOT applied
- [ ] Notification status guard was NOT applied
- [ ] Post-slot reset guard was NOT applied
- [ ] AUTH_MODE remains "placeholder" in the app
- [ ] Portal not connected to this dev project
- [ ] No real client credentials issued
- [ ] No real restaurant data in seed
- [ ] Pricing values in seed match the locked pricing table (49700 / 99700 / 109700 / 119700 / 149700)
