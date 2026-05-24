# Auth Test User Matrix

> Companion to
> [`MANUAL_SUPABASE_AUTH_SETUP_GUIDE.md`](./MANUAL_SUPABASE_AUTH_SETUP_GUIDE.md).
> Describes what each manually-created Supabase Auth test user should
> and should not be able to see **once `AUTH_MODE` is flipped to
> `"real"`**. Today everything is still placeholder, so none of these
> access rules are enforced yet.

## Test users

| Test user              | Role       | Expected home path     | Needs `client_id`? | Should access (once real auth + routes ship)                                                | Should not access                                                                  | Notes                                                                                                  |
| ---------------------- | ---------- | ---------------------- | ------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `owner@veroxa.test`    | `owner`    | `/owner/dashboard`     | No                 | All `/owner/*` routes (dashboard, revenue, client-health, alerts, settings).                | Should not be routed into a client-only view; not treated as a client.             | Highest-trust role. Owner-only data exposure decisions are deferred to a separate prompt.              |
| `operator@veroxa.test` | `operator` | `/operator/overview`   | No                 | All `/operator/*` routes (overview, alerts, client-health, failed-posts, report-approvals). | Should not access owner-only routes unless explicitly allowed in a later phase.    | Agency-wide ops role. Cross-client read scope to be confirmed when real `/operator/*` routes are built.|
| `team@veroxa.test`     | `team`     | `/team/tasks`          | No (in `user_profiles`) | All `/team/*` routes (tasks, media-review, ai-review, drafts, scheduling) **for clients assigned via `team_client_assignments`**. | Should not access unassigned clients. Should not access `/owner/*` or `/operator/*`. | Team-to-client scope comes from `team_client_assignments`, not `user_profiles.client_id`.              |
| `client@veroxa.test`   | `client`   | `/client/dashboard`    | **Yes**            | Only their own client's `/client/*` routes (dashboard, calendar, google, reports, updates, onboarding, media). | Must not access `/team/*`, `/operator/*`, `/owner/*`. Must not see another client's data. | The `client_id` in `user_profiles` is the only client this user is allowed to read.                   |

## Wrong-role behavior — decision pending

When a signed-in user hits a route that does not match their role
(e.g. an `operator` user navigates to `/client/dashboard`):

- **Option A — show a clear 403** ("Not your portal") card with a
  link back to their own role home.
- **Option B — silently redirect** to their own role home
  (`getRoleHomePath(role)`).

**Recommended V1:**

- During QA / initial real-auth testing: **show a clear 403** so
  routing bugs are visible.
- Once real auth is stable: **redirect** to the user's own role home
  to reduce friction.

This decision must be locked in
[`AUTH_MODE_SWITCH_PLAN.md`](./AUTH_MODE_SWITCH_PLAN.md) before the
`AUTH_MODE` flip prompt runs.

## Cross-references

- [`MANUAL_SUPABASE_AUTH_SETUP_GUIDE.md`](./MANUAL_SUPABASE_AUTH_SETUP_GUIDE.md)
  — how these users are created and how their `user_profiles` rows are
  populated.
- [`AUTH_QA_CHECKLIST.md`](./AUTH_QA_CHECKLIST.md) — exercises this
  matrix during pre-flip and post-flip QA.
- `src/lib/auth/authContract.ts` —
  `ROLE_HOME_PATH` is the single source of truth for the home paths
  above. If those paths change, update this matrix in the same PR.
