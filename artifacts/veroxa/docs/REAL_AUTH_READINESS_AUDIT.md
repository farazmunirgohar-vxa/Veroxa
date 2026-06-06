# Real Auth Readiness Audit

Status: audit/checklist only. This document does **not** activate real auth.

Authority: read [`ACTIVE_DOCS_INDEX.md`](./ACTIVE_DOCS_INDEX.md) first. Do not override current docs with older SaaS/auth notes.

## Current decision

- `AUTH_MODE` remains `"placeholder"`.
- Real auth activation requires a separate owner-approved PR after the manual first-client flow is approved.
- This audit must not add Supabase migrations, production database writes, storage uploads, payments, live AI, platform connectors, webhooks, cron/background jobs, or automated publishing.

## Required Supabase tables/views before activation

Before any future `AUTH_MODE="real"` activation PR, the production project must have owner-reviewed tables/views for:

- `auth.users` managed by Supabase Auth.
- `public.user_profiles` for role, display name, account status, and client workspace mapping.
- Client/account tables that can identify the restaurant workspace a client may access.
- Client-safe read views for portal pages, such as client dashboard summary, media summary, requests, weekly updates, and monthly reports.
- Team-safe read views for team queues, onboarding status, media review, request review, reporting queues, and audit leads.
- Optional audit/activity log tables only after RLS and client-safe visibility are approved.

No frontend route should read raw base tables if a safer view is expected.

## `user_profiles` requirements

`user_profiles` must exist before activation and should include, at minimum:

- `user_id` mapped to `auth.users.id` and unique.
- `role` with only approved active role values: `client` and `team`.
- `display_name` or equivalent safe label for UI.
- `status` or equivalent account state, with disabled/paused users blocked.
- `clientId` / restaurant workspace mapping for client users.
- Created/updated timestamps for operational review.

Owner, Operator, Super Admin, generic Admin, and Execution roles remain parked and must not be reintroduced by the auth activation PR.

## Client workspace mapping requirement

Every `client` profile must map to exactly the restaurant workspace the client is allowed to see. The future activation PR must prove:

- A client without a `clientId` cannot open `/client/*` pages.
- A client cannot switch to another restaurant workspace by changing a URL or local state.
- Team users can review team routes but do not create client-visible work without the established Veroxa review gates.
- Real `/client/*` routes never fall back to demo restaurant names, demo counts, fake metrics, or sample reports.

## RLS expectations

Future RLS must enforce:

- Clients can read only their own client-safe views/rows.
- Clients cannot read internal notes, pricing internals, queue internals, raw scores, internal IDs, private activity logs, or team-only proof math.
- Team role can read/update only owner-approved operational surfaces needed for manual service.
- Public anon users cannot read client/team data.
- Service-role keys are never shipped to the frontend.
- Any write table used later has explicit insert/update/delete policies and rollback tests.

## Test user requirements

Before activation, create owner-approved non-real-customer test users:

- One `client` test user mapped to a test restaurant workspace.
- One `team` test user for Faraz/team review.
- One missing-profile user to validate safe failure.
- One wrong-role/disabled-profile user to validate safe denial.

Do not document production passwords in public docs.

## Login success path

Future real auth login should:

1. Sign in with Supabase Auth using email/password.
2. Fetch the current session.
3. Read `user_profiles` by `user_id` through an approved safe query.
4. Validate role is exactly `client` or `team`.
5. Validate client users have a workspace mapping before `/client/*` access.
6. Route `client` to `/client/dashboard` and `team` to `/team/dashboard`.

## Missing profile behavior

If a signed-in user has no `user_profiles` row, Veroxa should show a calm setup/access message and should not render client/team data. The user should be able to sign out. The app should not guess a role and should not fall back to preview credentials or demo data.

## Wrong role behavior

If a profile has any unsupported role, Veroxa should deny portal access with a calm access message and sign-out option. Unsupported roles must not route to Owner, Operator, Super Admin, generic Admin, or Execution dashboards.

## Sign-out/session expiration expectations

- Sign-out clears the Supabase session and returns to `/login`.
- Expired sessions redirect to `/login` or a safe access message.
- Client/team pages should not flash protected data while session status is unknown.
- Local placeholder sessions should not be treated as production auth.

## Production environment requirements

Required frontend env vars for a future activation PR:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Frontend must not include a Supabase service-role key. If any service-role key is required for future backend work, it must live only in a server environment and only after a separate owner-approved backend PR.

## Rollback plan for future activation

If real auth activation fails later:

1. Set `AUTH_MODE` back to `"placeholder"` in the frontend config PR or deployment env.
2. Set production/custom-domain preview-login exposure according to [`PRODUCTION_PREVIEW_LOGIN_CHECKLIST.md`](./PRODUCTION_PREVIEW_LOGIN_CHECKLIST.md).
3. Redeploy Vercel because env changes require redeploy.
4. Confirm `/login`, `/client/*`, and `/team/*` return to safe placeholder review behavior.
5. Keep migrations/data untouched until the owner reviews the failure.
6. Document the failure, affected routes, and rollback confirmation before attempting another activation PR.
