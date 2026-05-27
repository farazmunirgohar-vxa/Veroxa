# M005 Dev Test Results

**Run start:** _<fill in>_
**Run end:** _<fill in>_
**Operator:** _<fill in>_
**Dev project ref:** _<fill in>_

**Pre-flight confirmations**

- [ ] AUTH_MODE is `"placeholder"` and unchanged
- [ ] Portal NOT connected to this database
- [ ] No real client / restaurant data present
- [ ] M001 through M004 applied + green
- [ ] M003 team-scope correction applied (`m003/01c`)
- [ ] M004 staff-policy correction applied (`m004/01c`)
- [ ] M001–M004 fixtures present (clients A + B, posts A1/A2)
- [ ] M005 apply step succeeded (no errors from `01_apply_m005.sql`)
- [ ] M005 staff-policy correction is BAKED IN to `01_apply_m005.sql` (no separate 01b step required for fresh runs; `01b_apply_reports_select_staff_correction.sql` is retained only as a no-op re-apply for dev projects that ran the pre-correction apply step)
- [ ] `pg_policies` confirms `weekly_reports_select_staff` and `monthly_reports_select_staff` both contain `is_assigned_to_client` and NOT `can_view_client`
- [ ] M005 seed step succeeded (`weekly_reports`=6, `monthly_reports`=6)

## Test results

| #   | Test                                                          | Result | Notes |
|-----|---------------------------------------------------------------|--------|-------|
| 1   | Client sees only own published weeklies (view + base = 2 rows)| ☐      |       |
| 2   | Client cannot see drafted / validated weeklies                | ☐      |       |
| 2c  | ACCEPTANCE — client reads drafted weeklies → 0 (staff policy uses `is_assigned_to_client`) | ☐ | M005 correction |
| 3   | Client view does not include `internal_validation_note` col   | ☐      |       |
| 4   | Client sees only own published monthlies (view = 1 row)       | ☐      |       |
| 5   | Client cannot see drafting / operator_review / approved monthlies | ☐  |       |
| 5d  | ACCEPTANCE — client reads operator_review monthly (MR_A2 by id) → 0 (staff policy uses `is_assigned_to_client`) | ☐ | M005 correction |
| 6a  | team@A INSERT weekly for A → default `drafted`                | ☐      |       |
| 6b  | team@A UPDATE drafted → validated                             | ☐      |       |
| 6c  | team@A INSERT weekly for B → denied                           | ☐      |       |
| 6d  | team@A UPDATE → `published` → denied (WITH CHECK)             | ☐      |       |
| 6e  | team2@B (reporter) INSERT weekly → denied                     | ☐      |       |
| 6f  | team2@B can SELECT B's reports                                | ☐      |       |
| 7a  | team UPDATE monthly → `approved` → denied                     | ☐      |       |
| 7b  | team UPDATE monthly drafting → operator_review → succeeds     | ☐      |       |
| 7c  | team UPDATE monthly → `published` → denied                    | ☐      |       |
| 8a  | operator approve operator_review → approved → succeeds        | ☐      |       |
| 8b  | operator publish approved row (approved_by NOT NULL) → succeeds | ☐    |       |
| 8c  | operator publish operator_review without approved_by → **denied** by gate | ☐ | CORE M005 PROTECTION |
| 8d  | operator publish + set approved_by in same UPDATE → succeeds  | ☐      |       |
| 9a  | owner counts: weekly=6, monthly=6, can read internal columns  | ☐      |       |
| 9b  | owner publish without approved_by → **denied** (owner does NOT bypass) | ☐ |   |
| 9c  | owner publish + set approved_by in same UPDATE → succeeds     | ☐      |       |
| 10a | Duplicate (client_id, week_start) → unique violation          | ☐      |       |
| 10b | Same week_start different client → succeeds                   | ☐      |       |
| 10c | Duplicate (client_id, month_key) → unique violation           | ☐      |       |
| 10d | month_key='2026-13' → check violation                         | ☐      |       |
| 10e | month_key='26-05' → check violation                           | ☐      |       |
| 11a | client@A: B rows invisible (view + base = 0)                  | ☐      |       |
| 11b | team@A: B rows invisible (weekly + monthly = 0)               | ☐      |       |
| 11c | team@A UPDATE on B's report → 0 rows affected                 | ☐      |       |
| 12a | Delete post → top_post_id becomes NULL                        | ☐      |       |
| 12b | Delete client → cascades to weekly + monthly                  | ☐      |       |
| 13a | Anon SELECT → 0 rows                                          | ☐      |       |
| 13b | Anon INSERT → denied                                          | ☐      |       |
| 14a | Weekly view column list matches spec exactly                  | ☐      |       |
| 14b | Monthly view column list matches spec exactly                 | ☐      |       |
| 14c | client_safe_summary_json = summary_json->'client_safe'        | ☐      |       |
| 15a | reloptions contains `security_invoker=true` on both views     | ☐      |       |
| 15b | Client sees only own rows via view (RLS scoping)              | ☐      |       |
| 16a | Operator sees all rows (helper short-circuit)                 | ☐      |       |
| 16b | team@A with is_active=false → 0 rows                          | ☐      |       |

## Stop conditions hit

_None expected. Record any here if encountered. No predicted-fail tests in M005._

## Post-run state

- [ ] AUTH_MODE still `"placeholder"`
- [ ] Portal still NOT connected
- [ ] team_members.is_active restored to true for team@A
- [ ] No M006 applied yet
- [ ] Seed rows remain intact (6 weekly + 6 monthly)

## Sign-off

- [ ] All required tests PASS → safe to proceed to M006 dev test package.
- [ ] If any test FAIL → file findings; do NOT promote M005 SQL to `supabase/migrations/`.
