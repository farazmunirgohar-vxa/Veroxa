# M001 — Dev-Flagged Client Upload Submission Write

> **Superseded by M023D.** The implementation now routes through the central
> `veroxaWriteAdapter` (not a direct `devSupabaseWriteAdapter` import) and uses
> `VITE_VEROXA_DEV_CLIENT_ID` via `getDevClientIdFromEnv()` (not
> `VITE_VEROXA_DEV_RESTAURANT_ID`). See `docs/M023D_CLIENT_MEDIA_DEV_WRITE.md`
> for the current, authoritative description. The schema/table/field facts below
> remain accurate.

## What was built

When a client submits media on `/client/media`, the app now:

1. **Always** creates a local workflow item in the session store (existing behavior, unchanged).
2. **Conditionally** — if the dev-write flag is enabled — attempts to insert one metadata row per selected file into the Supabase `upload_submissions` table.

No file bytes are transferred. No Supabase Storage is used. No service-role key is in the frontend. No production writes happen by default.

## What flag controls it

```
VITE_VEROXA_ENABLE_DEV_WRITES="true"
VITE_VEROXA_DEV_WRITE_ENV="dev"
```

Only the exact string `"true"` enables dev writes. Anything else (missing, `"false"`, `"TRUE"`, `"1"`) leaves writes disabled. Controlled by `artifacts/veroxa/src/lib/data/writeReadiness.ts`.

A second env var is required for the Supabase insert to actually run:

```
VITE_VEROXA_DEV_RESTAURANT_ID="<uuid>"
```

This must be set to the `id` of a row already seeded in `public.clients`. If it is not set, the app logs a skip message and continues normally.

## What table is written

`public.upload_submissions` — created by migration `M024A`.

## What fields are inserted

| Column | Value source |
|---|---|
| `restaurant_id` | `VITE_VEROXA_DEV_RESTAURANT_ID` env var |
| `upload_key_id` | `null` (column is nullable; no upload key in the demo flow) |
| `category` | Inferred from file MIME type: `video/*` → `short_video`, `image/*` → `food_photo`, else → `other` |
| `priority` | `"use_anytime"` (safe default) |
| `note` | Client's optional note (sanitized by `writeMappers.sanitizeNote`) |
| `submitted_by_label` | `"client_portal"` |
| `status` | `"received"` (set by the row mapper, not the caller) |

## What remains local/demo

- The local workflow item (`clientTeamWorkRepository`) is always created, whether or not the dev write is enabled.
- The `SessionUploadsSection` component reflects local state only.
- The Content Supply Snapshot numbers are fixture values.

## What happens when the flag is off

- No Supabase call is made. Zero.
- The `assertWritesAllowed()` guard in the adapter would throw if called, but the guard in `handleSubmitToTeam` (`isDevWriteFlagEnabled()`) prevents the adapter from being called at all.
- The local workflow item is created as always.
- The client sees: "Your media has been submitted to the Veroxa team. A team member will review it before anything goes live."

## What happens when Supabase is unavailable or the insert fails

- `devSupabaseWriteAdapter.createUploadSubmission` returns a safe `WriteFailureResult` envelope — it never throws to the page.
- The `Promise.all` `.catch()` in `handleSubmitToTeam` catches any unexpected exception.
- The local workflow item is already in state before the write is attempted.
- The client-facing confirmation message is already shown.
- The UI does not crash. The client experience is identical whether the write succeeds or fails.
- A console warning is logged: `[dev-write] upload_submissions: unexpected error`.

## Why file storage is deferred

- The `upload_submissions` table stores metadata only — category, note, status, label.
- Actual file bytes require a Supabase Storage bucket, an upload endpoint, and proper RLS for object-level access. None of those are built yet.
- This step establishes the metadata write path and schema trust before adding storage.

## Rollback instructions

1. Unset `VITE_VEROXA_ENABLE_DEV_WRITES` or `VITE_VEROXA_DEV_WRITE_ENV`, or set either to anything other than `"true"` / `"dev"` respectively.
2. Optionally delete inserted rows: `DELETE FROM public.upload_submissions WHERE submitted_by_label = 'client_portal';`
3. The local workflow flow continues working without any code change.

## Files changed

- `artifacts/veroxa/src/pages/client-media.tsx` — added dev write call in `handleSubmitToTeam`; cleaned all client-facing "Storage pending" strings.

## Files unchanged (pre-existing infrastructure used as-is)

- `artifacts/veroxa/src/lib/data/devSupabaseWriteAdapter.ts`
- `artifacts/veroxa/src/lib/data/writeReadiness.ts`
- `artifacts/veroxa/src/lib/data/writeAdapterTypes.ts`
- `artifacts/veroxa/src/lib/data/writeMappers.ts`
- `supabase/archive/legacy_unapplied_migrations/20260601000000_m024a_first_client_metadata_schema.sql`

## Next build step

**Team Upload Inbox reads real `upload_submissions` rows.**

When `VITE_VEROXA_ENABLE_DEV_READS="true"` and `VITE_VEROXA_DEV_RESTAURANT_ID` is set, the team's Upload Inbox (`/team/upload-inbox`) should attempt to read from `upload_submissions` via `supabaseReadOnlyClient`, falling back to fixture data when unavailable. No auth changes, no RLS changes, no new tables.
