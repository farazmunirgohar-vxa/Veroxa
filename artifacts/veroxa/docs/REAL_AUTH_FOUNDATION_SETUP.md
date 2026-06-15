# Real Auth Foundation Setup — PR 100

Status: setup checklist only. This document does not activate production auth, database writes, storage uploads, messages, media upload, AI, publishing, payments, cron jobs, or integrations.

## Current decision

- `AUTH_MODE` remains `"placeholder"` after PR 100.
- Current Momo House San Antonio and Team Faraz pilot access continues through `/api/pilot-access`.
- Real authentication code is prepared behind the existing mode switch and must not be activated until the readiness checks below pass.
- Momo owner walkthrough remains blocked until the full Live Automation V1 sequence is built and approved.

## Required environment variables

Browser-safe variables only:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Never place service-role keys, production passwords, or private credentials in frontend source code or browser-exposed variables.

## Minimum auth tables for PR 100 activation readiness

The future Supabase project must provide these minimum tables before `AUTH_MODE` can flip to `"real"`:

### `user_profiles`

- `user_id` mapped to the auth user id and unique.
- `email` for operational matching.
- `role` constrained to exactly `client` or `team`.
- `display_name` for safe UI labeling.
- `status` constrained to `active`, `disabled`, or `pending`.
- `created_at` and `updated_at`.

### `restaurants`

- `id`.
- `name`.
- `address`.
- `phone`.
- `timezone`.
- `status` constrained to `active`, `disabled`, or `pending`.
- `created_at` and `updated_at`.

### `restaurant_members`

- `id`.
- `restaurant_id` mapped to `restaurants.id`.
- `user_id` mapped to the auth user id.
- `role` constrained to exactly `client` or `team`.
- `status` constrained to `active`, `disabled`, or `pending`.
- `created_at` and `updated_at`.

PR 100 frontend code reads `user_profiles` and, for `client` users, requires both an active `restaurant_members` row and an active linked `restaurants` workspace before allowing `/client/*` access. A missing, pending, disabled, or unsupported restaurant status must deny client access. Team users do not get treated as clients and do not require a client restaurant workspace.

## First Momo client user setup

1. Create the Momo user in the auth dashboard with a private password or invite flow.
2. Create one `user_profiles` row with:
   - `user_id`: the auth user id.
   - `email`: the Momo account email.
   - `role`: `client`.
   - `display_name`: a client-safe name.
   - `status`: `active` only when ready.
3. Create the Momo House San Antonio `restaurants` row with `status = active` only when ready.
4. Create one `restaurant_members` row connecting the Momo user to the Momo restaurant with `role = client` and `status = active`.
5. Confirm the Momo user can reach `/client/dashboard`, `/client/media`, `/client/messages`, `/client/reports`, `/client/connections`, and `/client/profile` only after active profile and membership rows exist.

## Team Faraz user setup

1. Create the Team Faraz user in the auth dashboard with a private password or invite flow.
2. Create one `user_profiles` row with:
   - `user_id`: the auth user id.
   - `email`: the Team Faraz account email.
   - `role`: `team`.
   - `display_name`: `Team Faraz` or another safe internal label.
   - `status`: `active` only when ready.
3. Do not create Owner, Operator, Super Admin, generic Admin, Execution, or other parked-role users.
4. Confirm the Team Faraz user reaches `/team/dashboard` and other guarded `/team/*` routes, and is not treated as a client.

## Role routing tests before flipping auth mode

Test all of these in a non-production environment first:

- Active client user reaches every guarded `/client/*` route.
- Active client user is denied from `/team/*` and receives a calm wrong-portal message.
- Active team user reaches `/team/*` routes.
- Active team user is denied from `/client/*` and receives a calm wrong-portal message.
- Missing-profile user cannot reach client or team routes.
- `pending` user cannot reach client or team routes.
- `disabled` user cannot reach client or team routes.
- Client user with no active `restaurant_members` row cannot reach `/client/*`.
- Client user with a missing restaurant row cannot reach `/client/*`.
- Client user linked to a `pending`, `disabled`, or unsupported restaurant status cannot reach `/client/*`.
- Unsupported role values do not route anywhere.
- Password reset can be requested from `/login` without exposing implementation details.
- Password reset completion works as a two-step flow: request a reset email, then return from the recovery link to set and confirm a new password.
- Password reset mismatch and unusable-link states show calm client-safe copy.
- Logout clears the real session and returns the user to `/login` when logout UI is exposed by the portal shell.

## Requirements before setting `AUTH_MODE` to `"real"`

Do not flip until all are true:

1. Required browser-safe env vars are configured locally and in Vercel.
2. `user_profiles`, `restaurants`, and `restaurant_members` exist with reviewed constraints and policies.
3. RLS blocks anonymous users from portal data.
4. RLS limits clients to their own restaurant workspace.
5. Test users and workspace states exist for active client, active team, missing profile, pending user, disabled user, missing restaurant, pending restaurant, disabled restaurant, unsupported restaurant status, and wrong-role/unsupported-role scenarios.
6. `/api/pilot-access` still works as rollback while placeholder mode remains available.
7. No public preview credentials or frontend passwords are present.
8. No service-role key is bundled into browser code.
9. The full Live Automation V1 Momo walkthrough gate remains closed until later modules are complete.

## PR #101 database foundation note

PR #101 adds the required Live Automation V1 database migration and TypeScript contracts, including `user_profiles`, `restaurants`, `restaurant_members`, and future automation tables. This does not activate real auth. Before `AUTH_MODE = "real"`, the target Supabase project still needs environment configuration, the migration applied, RLS verification with test client/team users, Momo/Team Faraz records, route/auth/data-boundary QA, rollback readiness, and explicit approval. `/api/pilot-access` remains active until that approval.

