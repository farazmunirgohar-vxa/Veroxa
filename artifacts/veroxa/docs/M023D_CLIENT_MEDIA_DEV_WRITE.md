# M023D — Connect Client Media Submit to Dev Write Adapter

Continues from M023C (which created the disabled-by-default central write adapter
but did not connect `/client/media` to it).

## What changed

`/client/media` now calls the **central** write adapter after the local/demo
submission succeeds. The page imports only `veroxaWriteAdapter` — it never
imports `devSupabaseWriteAdapter`, never picks an adapter, and never calls
Supabase directly.

Flow in `handleSubmitToTeam` (`src/pages/client-media.tsx`):

1. `createWorkflowItem(...)` runs first and is the **source of truth** (unchanged).
2. React state is cleared and the client-safe confirmation is shown.
3. A dev client UUID is read via `getDevClientIdFromEnv()`. If absent, the write
   is skipped (the local `demo-a` id is not a UUID and would fail the
   `restaurant_id` FK).
4. If present, `veroxaWriteAdapter.createUploadSubmission(...)` is called once per
   selected file. The adapter alone decides whether to write or return a disabled
   envelope.
5. Any failure is swallowed — the local/demo flow remains a success.

## Where the page calls the adapter

`src/pages/client-media.tsx` → `handleSubmitToTeam` → `veroxaWriteAdapter.createUploadSubmission(...)`
(inside a non-blocking `Promise.all`, after the local workflow item is created).

## Flag required

```
VITE_VEROXA_ENABLE_DEV_WRITES="true"
```

Only the exact string `"true"` enables writes (`writeReadiness.ts`). The adapter
selector (`writeAdapter.ts`) resolves to `devSupabaseWriteAdapter` when enabled,
otherwise `disabledWriteAdapter`.

A valid dev client UUID is also required for the insert to run:

```
VITE_VEROXA_DEV_CLIENT_ID="<uuid>"
```

Read and UUID-validated by `getDevClientIdFromEnv()` (`devClientId.ts`). Must match
a seeded `public.clients.id` row. Dev-only; never commit it.

## Table targeted

`public.upload_submissions` (migration M024A). Metadata only — no file bytes, no
Supabase Storage, no FormData/fetch upload, no service-role key.

## Fields written

| Column | Value |
|---|---|
| `restaurant_id` | `getDevClientIdFromEnv()` UUID |
| `upload_key_id` | `null` (nullable; no upload key in the client portal demo flow) |
| `category` | `video/*` → `short_video`, `image/*` → `food_photo`, else `other` |
| `priority` | `use_anytime` |
| `note` | client's optional note (sanitized by `writeMappers.sanitizeNote`) |
| `submitted_by_label` | `client_portal` |
| `status` | `received` (schema-safe default, set by the row mapper) |

## What happens when the flag is off (default)

- The central adapter resolves to `disabledWriteAdapter`, which returns a disabled
  envelope with **no** network call.
- No Supabase write. No console spam (the page logs only when ≥1 row is saved).
- The local/demo flow behaves exactly as before; the client sees the same clean
  confirmation.

## What happens when the adapter insert fails

- `devSupabaseWriteAdapter` returns a safe `WriteFailureResult` — it never throws.
- The page's `Promise.all().catch()` swallows any unexpected error.
- The local workflow item already exists and the confirmation is already shown.
- The UI does not crash; no raw DB error reaches the client.

## Containment rules honored

- Page imports only `veroxaWriteAdapter` — not `devSupabaseWriteAdapter`, not
  `getSupabaseClient`.
- No page-level `supabase.from(...).insert/update/upsert/delete`.
- No file storage, no file bytes, no FormData/fetch upload endpoints.

## Rollback

1. Unset / set `VITE_VEROXA_ENABLE_DEV_WRITES` to anything other than `"true"`.
2. Optionally delete test rows: `DELETE FROM public.upload_submissions WHERE submitted_by_label = 'client_portal';`
3. The local/demo flow continues working with no code change.

## Next build step

**Team Upload Inbox reads real `upload_submissions` rows** when a safe read mode is
enabled (e.g. `VITE_VEROXA_ENABLE_DEV_READS="true"` plus `VITE_VEROXA_DEV_CLIENT_ID`),
via the existing `supabaseReadOnlyClient`, while keeping fixture fallback. No auth,
RLS, or schema changes.
