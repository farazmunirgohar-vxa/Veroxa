# Veroxa — Row Level Security (RLS) Plan

## Status

Planning only. RLS has not been implemented. No Supabase project is connected.

RLS policies must be reviewed and agreed before the authentication layer is built (Phase 6).

---

## Principles

1. **All tables have RLS enabled.** No table is accessible without a matching policy.
2. **`client_id` is the primary scope.** Every data table carries `client_id`. Policies use this to restrict reads and writes.
3. **The service role bypasses RLS.** Automation jobs and system processes use the Supabase service role key — never exposed to the browser.
4. **User role comes from JWT claims.** Supabase Auth stores a custom `role` claim in the JWT. Policies read `auth.jwt() ->> 'role'` to identify the acting role.
5. **Auth enforces; UI reflects.** Client-side permission checks (from `src/lib/permissions/`) mirror but never replace server-side RLS.

---

## Role → RLS Access

### Client

```
Policy scope: rows WHERE client_id = auth.uid()
            OR client_id IN (SELECT id FROM clients WHERE primary_contact_email = auth.email())
```

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `clients` | own simplified record only | — | contact fields only | — |
| `client_platforms` | own records | own records | own records | — |
| `post_slots` | own records | — | — | — |
| `posts` | own records | — | — | — |
| `media_assets` | own records | own records (before use) | own records (before use) | — |
| `weekly_reports` | own records | — | — | — |
| `monthly_reports` | own records | — | — | — |
| `notifications` | own records (target_role = 'client') | — | seen_at, dismissed only | — |

Clients must not see: `content_concepts`, `draft_sets`, `draft_variants`, `activity_logs`, or any row belonging to another client.

---

### Team

```
Policy scope: assigned clients (future: via a team_client_assignments junction table)
             Initially: all clients where account_status IN ('onboarding', 'active', 'needs_attention', 'at_risk')
```

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `clients` | assigned | — | — | — |
| `client_platforms` | assigned | — | status fields | — |
| `media_assets` | assigned | — | review_status, ai fields | — |
| `content_concepts` | assigned | — | status, review fields | — |
| `draft_sets` | assigned | assigned | status, approval fields | — |
| `draft_variants` | assigned | assigned | status, caption, approval | — |
| `posts` | assigned | assigned | status, schedule fields | — |
| `post_slots` | assigned | assigned | status, post_id | — |
| `weekly_reports` | assigned | assigned | status | — |
| `monthly_reports` | assigned | assigned | draft fields only | — |
| `notifications` | assigned (target_role = 'team') | — | seen_at | — |
| `activity_logs` | assigned | — | — | — |
| `alerts` | assigned | — | status | — |
| `client_health` | assigned | — | — | — |

---

### Operator

```
Policy scope: all clients (full portfolio visibility)
```

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `clients` | all | — | risk_status, account_status | — |
| `client_platforms` | all | — | — | — |
| `media_assets` | all | — | — | — |
| `content_concepts` | all | — | — | — |
| `draft_sets` | all | — | — | — |
| `draft_variants` | all | — | — | — |
| `posts` | all | — | — | — |
| `post_slots` | all | — | — | — |
| `weekly_reports` | all | — | — | — |
| `monthly_reports` | all | — | status, approved_at | — |
| `notifications` | all (target_role = 'operator') | — | seen_at, escalated | — |
| `activity_logs` | all | — | — | — |
| `alerts` | all | — | status, escalated_at | — |

Operators must NOT approve individual posts — that authority belongs to the team workflow.

---

### Owner

```
Policy scope: all data (read); commercial and user management (write)
```

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `clients` | all | — | commercial/lifecycle fields | — |
| `media_assets` | all | — | — | — |
| `content_concepts` | all | — | — | — |
| `draft_sets` | all | — | — | — |
| `draft_variants` | all | — | — | — |
| `posts` | all | — | — | — |
| `weekly_reports` | all | — | — | — |
| `monthly_reports` | all | — | — | — |
| `notifications` | all (target_role = 'owner') | — | seen_at | — |
| `activity_logs` | all | — | — | — |
| `alerts` | all | — | — | — |
| `internal_users` *(future)* | all | all | all | soft-delete only |
| `revenue_snapshots` *(future)* | all | — | — | — |

Owners must NOT be pulled into daily execution tasks. Write access is limited to commercial fields and user management.

---

### System (service role)

The system service role bypasses RLS entirely. It is used exclusively for:

- Scheduled automation jobs (health scoring, reporting aggregation, alert generation)
- Simulated publish status updates (post/media/draft marking)
- Activity log creation
- Derived metric updates

The service role key must never be exposed to the browser or client-side code.

---

## Junction table (future)

A `team_client_assignments` table will map team members to their assigned clients once multi-team support is needed. RLS policies for the team role will then scope by this table rather than `account_status`.
