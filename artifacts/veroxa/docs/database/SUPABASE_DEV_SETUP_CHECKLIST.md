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

## 6. Do not do yet

After verification, stop. The following steps belong to later phases and must not be started until the schema and seed data are confirmed correct.

- Do not connect the frontend app to Supabase
- Do not add a Supabase client to the codebase
- Do not add environment variables or secrets to the app
- Do not implement authentication or session management
- Do not apply RLS policies yet
- Do not set up Supabase Storage or file uploads
- Do not integrate AI, automation, or publishing workflows

---

## 7. Next step after manual verification

Once the data is verified in the Supabase dev project:

1. Build a read-only API data access layer (Express routes, GET only)
2. Replace demo data imports in portals one at a time — starting with the simplest portal (Client)
3. Keep the TypeScript contracts in `src/lib/database/` as the source of truth for types
4. Do not touch the UI until the data layer is stable
