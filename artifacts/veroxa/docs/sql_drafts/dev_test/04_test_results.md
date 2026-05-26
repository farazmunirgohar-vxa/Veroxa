# M001 Dev Test Results

**Date:** _______________
**Tester:** _______________
**Dev Supabase project:** _______________
**Project URL:** _______________
**Commit tested:** c0c727ed3641aa1f2fe95b0cfdc228e6fe35c5ba

## Pre-run checklist

- [ ] Confirmed this is the DEV project, not production
- [ ] No real client data in this project
- [ ] AUTH_MODE = "placeholder" in the app — confirmed
- [ ] Portal NOT connected to this dev database
- [ ] 01_apply_m001.sql applied without errors
- [ ] 02_seed_dev_users.sql applied without errors
- [ ] 5 rows visible in `public.user_profiles`
- [ ] 1 row visible in `public.team_members`

**Actual UUIDs used in this test run:**

| User | UUID |
|---|---|
| owner@veroxa.test | |
| operator@veroxa.test | |
| team@veroxa.test | |
| client@veroxa.test | |
| inactive@veroxa.test | |

---

## Test Results

### Test 1 — Anonymous access fully blocked

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 1a. Anon SELECT user_profiles | 0 rows | | |
| 1b. Anon SELECT team_members | 0 rows | | |
| 1c. Anon INSERT user_profiles | denied / 0 rows | | |

Notes:

---

### Test 2 — Client sees only own profile

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 2a. Client SELECT all profiles | 1 row | | |
| 2b. Client SELECT other profiles | 0 rows | | |
| 2c. Client SELECT team_members | 0 rows | | |

Notes:

---

### Test 3 — Team sees only own profile and team_member row

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 3a. Team SELECT all profiles | 1 row | | |
| 3b. Team SELECT team_members | 1 row | | |
| 3c. Team SELECT other team_member rows | 0 rows | | |

Notes:

---

### Test 4 — Operator can view all profiles and team_members

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 4a. Operator SELECT count profiles | 5 | | |
| 4b. Operator SELECT team_members count | ≥1 | | |
| 4c. Operator UPDATE display_name | 0 rows (no UPDATE policy) | | |

Notes:

---

### Test 5 — Owner can view and update profiles

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 5a. Owner SELECT count profiles | 5 | | |
| 5b. Owner UPDATE another display_name | success / 1 row | | |
| 5c. Owner INSERT team_members row | success | | |

Notes:

---

### Test 6 — Role changes (owner vs non-owner)

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 6a. Owner changes team user's role | success | | |
| 6b. Operator tries to change role | ERROR: role changes restricted to owner | | |
| 6c. Team tries to change role | ERROR: role changes restricted to owner | | |
| 6d. Client tries to change own role | ERROR: role changes restricted to owner | | |
| 6e. Owner changes OWN role | ERROR: users cannot change their own role | | |

Notes:

---

### Test 6a — Email is owner-only

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| Client self-update email | ERROR: email changes restricted to owner | | |
| Team self-update email | ERROR: email changes restricted to owner | | |
| Owner updates another user's email | success | | |
| display_name / avatar_url self-edit still work | success | | |

Notes:

---

### Test 7 — is_active changes are owner-only

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| Owner deactivates team user | success | | |
| Operator tries is_active change | ERROR or 0 rows (document which) | | |
| User deactivates self | ERROR: is_active restricted to owner | | |

Notes:

---

### Test 8 — client_id changes are owner-only

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| Owner sets client_id | success | | |
| Client changes own client_id | ERROR: client_id restricted to owner | | |

Notes:

---

### Test 9 — current_user_role() returns expected values

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| owner session | 'owner' | | |
| operator session | 'operator' | | |
| team session | 'team' | | |
| client session | 'client' | | |
| inactive user | NULL (no exception) | | |
| anon session | NULL or permission denied | | |

Notes:

---

### Test 10 — is_owner / is_operator / is_team_member

| User | is_owner | is_operator | is_team_member | Pass/Fail |
|---|---|---|---|---|
| owner | true | true | true | |
| operator | false | true | true | |
| team | false | false | true | |
| client | false | false | false | |
| anon | false/denied | false/denied | false/denied | |

Notes:

---

### Test 11 — current_user_client_id()

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| Client with client_id set | that uuid | | |
| Owner (any client_id value) | NULL | | |
| Inactive client | NULL | | |

Notes:

---

### Test 12 — is_system_actor()

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| End-user context | false | | |
| SQL editor (postgres) context | false | | |
| Service-role JWT (external SDK test) | true | | |

Notes:

---

### Test 13 — updated_at trigger

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| user_profiles updated_at advances on UPDATE | after > before | | |
| team_members updated_at advances on UPDATE | after > before | | |

Notes:

---

### Test 14 — RLS bypass for service role (postgres / service key)

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| Postgres (superuser) sees all 5 profiles | 5 | | |
| Service-role SDK sees all 5 profiles | 5 | | |

Notes:

---

### Test 15 — Search-path hijack defense

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| current_user_role() in hostile session | 'client' (reads public.user_profiles) | | |
| is_owner() in hostile session | false | | |

Notes:

---

### Test 16 — Cascade on auth.users delete

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| Delete auth.users → user_profiles deleted | 0 rows | | |
| Delete auth.users → team_members deleted | 0 rows | | |

Notes:

---

### Test 17 — Helper EXECUTE grants

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| anon cannot EXECUTE helpers | permission denied | | |
| authenticated can EXECUTE helpers | result returned | | |

Notes:

---

### Test 18 — INSERT denial for non-owner

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| Client INSERT user_profiles | 0 rows / denied | | |
| Operator INSERT user_profiles | 0 rows / denied | | |
| Owner INSERT (FK test) | FK violation (acceptable) | | |

Notes:

---

### Test 19 — DELETE denial for operator and below

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| Operator DELETE profile | 0 rows | | |
| Team DELETE own profile | 0 rows | | |
| Owner DELETE profile | 1 row (rolled back) | | |

Notes:

---

### Test 20 — Orphan auth.users (no user_profiles row)

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| current_user_role() for orphan | NULL (no exception) | | |
| Own profile count | 0 | | |
| is_owner / is_operator / is_team_member | all false | | |

Notes:

---

### Test 21 — Email uniqueness conflict

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| Duplicate email INSERT | unique constraint violation | | |

Notes:

---

### Test 22 — Operator without team_members row

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| Operator sees all team_members | ≥1 | | |
| is_operator() | true | | |
| is_team_member() | true | | |

Notes:

---

### Test 23 — JWT-expiry / stale session

| Check | Expected | Actual | Pass/Fail |
|---|---|---|---|
| current_user_role() for unknown UUID | NULL | | |
| is_owner / is_operator | false | | |
| Profile count | 0 | | |

Notes:

---

### Test 24 — Self-edit allowed/denied matrix

| Actor | Column | Expected | Actual | Pass/Fail |
|---|---|---|---|---|
| client (self) | display_name | success | | |
| client (self) | avatar_url | success | | |
| client (self) | role | denied | | |
| owner (self) | display_name | success | | |
| owner (self) | role | denied (anti-lockout) | | |
| owner (other) | role | success | | |
| owner (other) | is_active | success | | |

Notes:

---

## Summary

| Section | Total checks | Passed | Failed | Notes |
|---|---|---|---|---|
| Test 1 | 3 | | | |
| Test 2 | 3 | | | |
| Test 3 | 3 | | | |
| Test 4 | 3 | | | |
| Test 5 | 3 | | | |
| Test 6 | 5 | | | |
| Test 6a | 4 | | | |
| Test 7 | 3 | | | |
| Test 8 | 2 | | | |
| Test 9 | 6 | | | |
| Test 10 | 5 | | | |
| Test 11 | 3 | | | |
| Test 12 | 3 | | | |
| Test 13 | 2 | | | |
| Test 14 | 2 | | | |
| Test 15 | 2 | | | |
| Test 16 | 2 | | | |
| Test 17 | 2 | | | |
| Test 18 | 3 | | | |
| Test 19 | 3 | | | |
| Test 20 | 3 | | | |
| Test 21 | 1 | | | |
| Test 22 | 3 | | | |
| Test 23 | 3 | | | |
| Test 24 | 7 | | | |
| **TOTAL** | **74** | | | |

---

## Decision

- [ ] **M001 GREEN** — all tests passed. Ready to plan M002 dev test.
- [ ] **M001 NEEDS CORRECTION** — failures noted above. Do not proceed to M002.
- [ ] **STOP — MAJOR ISSUE** — unexpected behavior found. Document and escalate.

**Failed tests (if any):**

**Root cause (if any):**

**Recommended action:**

---

## Confirmations

- [ ] M002–M006 were NOT applied during this test run
- [ ] AUTH_MODE remains "placeholder" in the app
- [ ] Portal was not connected to this dev database
- [ ] No production data was used
- [ ] No real client credentials were issued
