# Veroxa — Supabase Dev Setup Checklist

## Status

This checklist is for manual dev database setup only. No database is currently connected. No credentials exist.

---

## 1. Before starting

- [ ] All files in `docs/database/migrations-draft/` have been reviewed
- [ ] All files in `docs/database/seeds-draft/` have been reviewed
- [ ] `MIGRATION_NOTES.md` and `RLS_PLAN.md` have been read
- [ ] This is a **dev** Supabase project only — not production
- [ ] No real client data is used — seed data is demo-only

---

## 2. Create Supabase project

- [ ] Go to [supabase.com](https://supabase.com) and create a new project
- [ ] Name it **Veroxa Dev** (or similar — keep it clearly labelled as dev)
- [ ] Choose a strong database password and store it securely
- [ ] Save the **Project URL** and **anon key** in a private secrets manager
- [ ] Do **not** commit any keys, URLs, or credentials to version control

---

## 3. Apply draft migrations — SQL Editor

Open the Supabase SQL Editor and run each file in this exact order. Do not skip or reorder.

- [ ] `docs/database/migrations-draft/000_enable_extensions.sql`
- [ ] `docs/database/migrations-draft/001_create_enums.sql`
- [ ] `docs/database/migrations-draft/002_create_tables.sql`
- [ ] `docs/database/migrations-draft/003_create_indexes.sql`
- [ ] `docs/database/migrations-draft/004_create_triggers.sql`

Check for errors after each file before running the next.

---

## 4. Apply seed files — SQL Editor

Run each file in this exact order after all migrations have applied cleanly.

- [ ] `docs/database/seeds-draft/001_seed_clients.sql`
- [ ] `docs/database/seeds-draft/002_seed_platforms_and_onboarding.sql`
- [ ] `docs/database/seeds-draft/003_seed_media_assets.sql`
- [ ] `docs/database/seeds-draft/004_seed_posts_and_slots.sql`
- [ ] `docs/database/seeds-draft/005_seed_reports.sql`
- [ ] `docs/database/seeds-draft/006_seed_concepts_and_drafts.sql`
- [ ] `docs/database/seeds-draft/007_wire_post_draft_variants.sql`

> **Note on `007_wire_post_draft_variants.sql`:** This file temporarily disables `trg_posts_lock_guard` before running its UPDATE statements and re-enables it immediately afterward. This is a seed-only bypass required because demo published posts (004–007) are already locked when `007` runs. If you see the error `Cannot modify media_asset_id or draft_variant_id on a locked post`, confirm you are using the current version of `007` which includes the `DISABLE`/`ENABLE TRIGGER` statements.

---

## 5. Verification checklist

Use the Supabase Table Editor or SQL Editor to run these checks.

### Row counts

- [ ] `clients` — 1 row (Mamadali Kebab House)
- [ ] `client_platforms` — 4 rows
- [ ] `onboarding_items` — 6 rows
- [ ] `media_assets` — 10 rows
- [ ] `posts` — 7 rows
- [ ] `post_slots` — 8 rows
- [ ] `weekly_reports` — 2 rows
- [ ] `monthly_reports` — 1 row
- [ ] `content_concepts` — 7 rows
- [ ] `draft_sets` — 7 rows
- [ ] `draft_variants` — 21 rows

### Relationship integrity

- [ ] `posts` where `id = '00000000-0000-0000-0005-000000000003'` has `draft_variant_id = NULL` (post-003 — kitchen BTS, draft set still under review)
- [ ] `posts` where `id` IN (001, 002, 004, 005, 006, 007) all have a non-null `draft_variant_id`

### used_in_post_id — published variants only

- [ ] `draft_variants` where `id = '00000000-0000-0000-000a-000000000010'` (variant-004-A) has `used_in_post_id` set
- [ ] `draft_variants` where `id = '00000000-0000-0000-000a-000000000013'` (variant-005-A) has `used_in_post_id` set
- [ ] `draft_variants` where `id = '00000000-0000-0000-000a-000000000016'` (variant-006-A) has `used_in_post_id` set
- [ ] `draft_variants` where `id = '00000000-0000-0000-000a-000000000019'` (variant-007-A) has `used_in_post_id` set
- [ ] `draft_variants` where `id = '00000000-0000-0000-000a-000000000001'` (variant-001-A) has `used_in_post_id = NULL` (scheduled, not yet published)
- [ ] `draft_variants` where `id = '00000000-0000-0000-000a-000000000005'` (variant-002-B) has `used_in_post_id = NULL` (scheduled, not yet published)

### Lock integrity

- [ ] `posts` with `status = 'published'` all have a non-null `locked_at`
- [ ] `media_assets` with `review_status = 'used'` all have a non-null `used_in_post_id`

---

## 5b. Optional: Apply temporary dev read policies

After verification, you can optionally apply temporary anon read policies to allow the frontend data layer to query the dev database without authentication.

> This step is optional and dev-only. Do not apply in production.

- [ ] Open the Supabase SQL Editor on the **dev project only**
- [ ] Run `docs/database/rls-draft/001_dev_read_policies.sql`
- [ ] Confirm no errors in the SQL Editor output
- [ ] Verify in Supabase **Authentication → Policies** that SELECT policies exist for all 11 tables
- [ ] Do **not** add any write policies (INSERT, UPDATE, DELETE)
- [ ] Do **not** run this file on any production Supabase project

These policies allow read-only anon access to Mamadali demo rows only. They must be replaced with authenticated, role-based RLS policies before any real client data is introduced.

---

## 6. Do not do yet

After verification, stop. The following steps belong to later phases and must not be started until the schema and seed data are confirmed correct.

- Do not connect the frontend app to Supabase
- Do not add a Supabase client to the codebase
- Do not add environment variables or secrets to the app
- Do not implement authentication or session management
- Do not apply production/authenticated RLS policies yet (the temporary dev anon read policy from section 5b is the only RLS policy exception at this stage)
- Do not set up Supabase Storage or file uploads
- Do not integrate AI, automation, or publishing workflows

---

## 7. Next step after manual verification

Once the data is verified in the Supabase dev project:

1. Build a read-only API data access layer (Express routes, GET only)
2. Replace demo data imports in portals one at a time — starting with the simplest portal (Client)
3. Keep the TypeScript contracts in `src/lib/database/` as the source of truth for types
4. Do not touch the UI until the data layer is stable
