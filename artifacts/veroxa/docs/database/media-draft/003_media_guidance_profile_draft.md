# `client_media_guidance_profiles` — Draft

> **Docs only. No SQL applied.** This file plans the eventual data
> shape for per-client media guidance configuration. **No table has
> been created. The current Restaurant Media Guidance Engine is
> entirely static and lives in `src/lib/mediaGuidance.ts`.**

## Purpose

Once real onboarding writes ship (see
[`../../FIRST_WRITE_SURFACE_PLAN.md`](../../FIRST_WRITE_SURFACE_PLAN.md)
Priority 3), Veroxa will know the client's cuisine / restaurant type.
A per-client media-guidance profile can then refine the rule-based
plan (intensity, preferred platforms, weekly goals, GBP priority,
seasonal focus) without changing the underlying rules.

## Possible future table

Field-level direction (not a binding migration):

| Field | Type (likely) | Notes |
| --- | --- | --- |
| `id`                     | `uuid`        | PK |
| `client_id`              | `uuid`        | FK → `clients.id`, unique per client |
| `restaurant_type`        | `text` / enum | Matches `RestaurantType` in `src/lib/mediaGuidance.ts` |
| `preferred_platforms`    | `text[]`      | Subset of `Instagram | Facebook | TikTok | Google Business Profile | Ads` |
| `guidance_intensity`     | `text` / enum | `light` / `standard` / `aggressive` |
| `weekly_capture_goal`    | `integer`     | Target number of capture moments per week |
| `google_photo_priority`  | `boolean`     | Whether to prioritize GBP-friendly shots |
| `seasonal_focus`         | `text` / `jsonb` | Upcoming holidays / promos to emphasize |
| `created_at`             | `timestamptz` | default `now()` |
| `updated_at`             | `timestamptz` | trigger-managed |

## Why this is not built yet

- **Do not create this table yet.** It is premature until onboarding
  writes (Priority 3) and `audit_logs` are in place.
- This may instead **live inside `onboarding_items.answer_payload`
  first** (under a key like `media_guidance`), and only graduate to
  its own table when the team is editing / overriding per-client
  guidance frequently enough to justify the schema.
- Real persistence requires:
  - real auth (see [`../../REAL_AUTH_READINESS_CHECKLIST.md`](../../REAL_AUTH_READINESS_CHECKLIST.md)),
  - RLS for `client` / `team` / `operator` (see [`../../PRODUCTION_RLS_FINALIZATION_CHECKLIST.md`](../../PRODUCTION_RLS_FINALIZATION_CHECKLIST.md)),
  - matching writes + `audit_logs` rows on every profile change.
- **Current guidance is static and not saved.** The on-page restaurant
  type selector in `/demo/client/media` uses local React state only
  and disappears on refresh.

## When this graduates

A reasonable rollout:

1. V1.5 — store `restaurant_type` inside
   `onboarding_items.answer_payload.brand_and_positioning`. Read at
   render time. No new table.
2. V2 — once operators want to override `guidance_intensity` /
   `weekly_capture_goal` per client, extract into
   `client_media_guidance_profiles` with the shape above.
3. V3 — feeds the AI Media Review Agent and the active client
   prompts described in [`../../MEDIA_GUIDANCE_ENGINE_PLAN.md`](../../MEDIA_GUIDANCE_ENGINE_PLAN.md).
