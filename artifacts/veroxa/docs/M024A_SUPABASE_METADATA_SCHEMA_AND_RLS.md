# M024A — Supabase metadata schema migration + RLS foundation

## Purpose

Create the first real Supabase metadata schema for Veroxa, plus a
conservative dev-stage RLS foundation. This is the schema piece only —
no frontend page is connected to writes, no storage is added, and no
real-data integrations (AI / publishing / ads / payments) are
introduced.

## Migration

`supabase/migrations/20260601000000_m024a_first_client_metadata_schema.sql`

Single migration. Idempotent (`create table if not exists`,
`drop policy if exists`).

## Tables created

- `public.clients` — Veroxa client (restaurant) registry.
- `public.restaurant_upload_keys` — upload-key registry per
  restaurant. **Stores `key_hash` only — never plain-text keys.**
- `public.upload_submissions` — upload submission metadata. No file
  blobs. No raw filenames.
- `public.direction_requests` — client direction request metadata.
- `public.team_review_decisions` — internal team decisions on
  uploads / direction requests / content workflow items.

## Constraints

Status / category / priority / focus / channel / urgency / decision
values are enforced via `check` constraints aligned with the
TypeScript contracts in
`src/lib/firstClient/firstClientContracts.ts`.

Highlights:

- `clients.status ∈ {active, paused, archived}`
- `clients.service_plan ∈ {google_optimization, complete_online_presence, ads_management_only, complete_plus_ads}`
- `upload_submissions.category ∈ {food_photo, kitchen_prep, restaurant_atmosphere, menu_special, short_video, other}`
- `upload_submissions.priority ∈ {use_anytime, use_next, save_for_weekend, google_post, reel_tiktok_idea}`
- `upload_submissions.status ∈ {received, in_review, accepted, needs_better_photo, saved_for_later}`
- `direction_requests.focus ∈ {lunch_traffic, dinner_traffic, catering, family_platters, new_item, dessert, slow_day, weekend_push, google_visibility, event_or_holiday, ads_goal, avoid_item, use_media_next, other}`
- `direction_requests.channel ∈ {organic_social, google, ads, all}`
- `direction_requests.urgency ∈ {low, normal, high, urgent}`
- `direction_requests.status ∈ {received, interpreted, in_team_review, planned, completed}`
- `team_review_decisions.target_type ∈ {upload_submission, direction_request, content_workflow_item}`
- `team_review_decisions.decision ∈ {accepted, needs_better_photo, saved_for_later, interpreted, sent_to_content_plan, sent_to_google_action, sent_to_ads_planning, completed, rejected}`

## Indexes

- `clients_status_idx`, `clients_service_plan_idx`
- `restaurant_upload_keys_restaurant_id_idx`, `restaurant_upload_keys_status_idx`,
  `restaurant_upload_keys_key_hash_idx` (unique)
- `upload_submissions_restaurant_id_idx`, `upload_submissions_status_idx`,
  `upload_submissions_created_at_idx` (desc),
  `upload_submissions_restaurant_status_idx`
- `direction_requests_restaurant_id_idx`, `direction_requests_status_idx`,
  `direction_requests_urgency_idx`,
  `direction_requests_created_at_idx` (desc)
- `team_review_decisions_restaurant_id_idx`,
  `team_review_decisions_target_idx (target_type, target_id)`,
  `team_review_decisions_created_at_idx` (desc)

## Triggers

`public.set_updated_at()` (plpgsql) attached as a `BEFORE UPDATE`
trigger to:

- `clients`
- `upload_submissions`
- `direction_requests`

`team_review_decisions` is append-only at this stage and has no
`updated_at` column.

## RLS policies

RLS is enabled on every new table. Policies are intentionally
conservative and **dev-stage only**:

- `clients` — `select` for `authenticated`
- `restaurant_upload_keys` — `select` for `authenticated`
  (metadata only; `key_hash` is still on the row)
- `upload_submissions` — `select / insert / update` for `authenticated`
- `direction_requests` — `select / insert / update` for `authenticated`
- `team_review_decisions` — `select / insert` for `authenticated`
  (append-only at this stage)

No `anon` write policies. No public wide-open access.

### Why policies are dev-stage only

- `AUTH_MODE` is still `"placeholder"`. Real auth is not wired.
- Per-restaurant scoping requires a real session model that knows
  which restaurant a user / upload-key represents — that does not
  exist yet.
- `internal_note` visibility must be restricted to team+ in
  production; current policies do not yet enforce that.

### Why restaurant upload-key RLS is not production-ready

The upload-key flow currently uses local/session state. There is no
custom JWT / signed-claim model that binds a request to a specific
`restaurant_upload_keys.id`. Production RLS for upload-key sessions
needs that binding before it can scope writes to a single
restaurant.

## Still NOT connected

- Storage upload — separate later milestone.
- Page-to-adapter write integration — pages still write to
  `localUploadStore` / `localDirectionStore` / session state.
- Real auth — `AUTH_MODE` remains `"placeholder"`.
- Production RLS — current policies are dev-stage only.
- AI (OpenAI / Anthropic / Gemini) — not connected.
- Publishing APIs (Meta / Instagram / TikTok / Google) — not connected.
- Ad platform APIs — not connected.
- Payments (Stripe / PayPal / checkout) — not connected.

## Next safe step

1. Apply this migration in a dev Supabase project.
2. Verify each table exists and `authenticated` can `select` / `insert`
   per the policy matrix.
3. Verify the dev write adapter
   (`VITE_VEROXA_ENABLE_DEV_WRITES === "true"`) can round-trip an
   `upload_submissions` insert.
4. Then plan M024B: connect selected pages to the adapter behind the
   flag, keeping local/session as fallback.

Storage upload remains a separate later milestone.

## M024B addition

M024B provides an internal-only verification + smoke test harness
for this schema:

- Schema verification checks all 5 M024A tables via read-only
  `SELECT id LIMIT 1` — no writes, safe messages only.
- Dev write smoke tests are metadata-only, require an explicit button
  click and a manually-created fictional dev client UUID.
- No storage upload is tested. Storage remains a separate later
  milestone.
