> **Historical reference (pre-2026-05-27).** Pricing and fixture-ID values in this document are out of date. Current source of truth: `docs/PRICING_SOURCE_OF_TRUTH.md` and `src/data/pricing/veroxaPricing.ts`. Fixture IDs are now `demo-a` / `demo-b` / `demo-c` / `demo-d`.

---

# Veroxa — Migration Rules

These rules must be applied when translating the TypeScript contracts and demo seed data into real SQL migrations.

---

## Identity

**All IDs become UUID primary keys.**

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

String IDs in the demo data (e.g. `"client-mamadali-001"`) are placeholders only. They must be replaced with real UUIDs during seed data import.

---

## Universal client scope

**Every operational table must include `client_id`.**

```sql
client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT
```

No operational row (media, post, report, log, etc.) should exist without a valid `client_id`. Use `ON DELETE RESTRICT` to prevent orphaned records when a client is deactivated.

---

## Published post lock

**Once a post is published, `media_asset_id` and `draft_variant_id` become read-only.**

Enforce with a trigger or application-layer check:

- When `posts.status` transitions to `'published'`, set `posts.locked_at = now()`.
- Any subsequent UPDATE to `media_asset_id` or `draft_variant_id` on a locked post must be rejected.

```sql
-- Suggested trigger guard:
-- IF OLD.locked_at IS NOT NULL AND (NEW.media_asset_id != OLD.media_asset_id OR NEW.draft_variant_id != OLD.draft_variant_id)
--   RAISE EXCEPTION 'Cannot modify locked post references';
```

---

## Draft variant reuse lock

**A draft variant with `status = 'used'` must not be assigned to a second published post.**

Enforce with a unique partial index or application-layer check:

```sql
-- Option: unique constraint on used variants
CREATE UNIQUE INDEX draft_variants_used_once
  ON draft_variants (id)
  WHERE status = 'used';

-- Or: check before assigning a variant to a new post
-- SELECT id FROM draft_variants WHERE id = $variantId AND status = 'used'
-- → reject if row exists
```

---

## Media reuse

**Used media cannot be reused unless `clients.reuse_permission = true`.**

When `reuse_permission = false`: once `media_assets.used_in_post_id` is set, the asset may not be assigned to another post.

When `reuse_permission = true`: a new `media_assets` row with `source_type = 'legacy_reuse'` should be created rather than reusing the original row. The original row remains locked to its first post.

---

## Activity logs — append-only

**No UPDATE or DELETE on `activity_logs`.**

Enforce with RLS (no UPDATE/DELETE policy for any role) and optionally a trigger:

```sql
CREATE RULE activity_logs_no_update AS ON UPDATE TO activity_logs DO INSTEAD NOTHING;
CREATE RULE activity_logs_no_delete AS ON DELETE TO activity_logs DO INSTEAD NOTHING;
```

---

## Report snapshot preservation

**Published reports must not be mutated.**

Once `weekly_reports.status = 'published'` or `monthly_reports.status = 'published'`, the row is a permanent snapshot. If corrections are needed, create a new amended report rather than editing the published one.

---

## Soft delete

**Consider soft delete before hard delete for any client-facing entity.**

Recommended pattern: add `deleted_at TIMESTAMPTZ` to key tables (`clients`, `media_assets`, `posts`, `draft_variants`).

- A non-null `deleted_at` means the row is soft-deleted.
- RLS policies filter `WHERE deleted_at IS NULL` for normal queries.
- Hard deletion should be reserved for legal/GDPR requests only and must cascade carefully.

Tables where soft delete is especially important:
- `clients` — deactivation should not destroy historical data
- `media_assets` — rejected assets should remain for audit trail
- `draft_variants` — archived variants should remain for reference

---

## Enum types

All TypeScript enums must be created as Postgres `ENUM` types before the tables that reference them. See `ENUM_MAP.md` for the full list.

Create enums first in migrations, then tables, then indexes, then RLS policies.

---

## Timestamps

- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` — all tables
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` — all tables except `activity_logs`
- Use a `set_updated_at()` trigger function to auto-update `updated_at` on every mutation

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```
