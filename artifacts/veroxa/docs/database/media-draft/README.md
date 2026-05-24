# `media-draft/`

Planning-only directory for the **future** client-media storage + metadata
write surface.

## Status

- **No Supabase Storage bucket has been created.**
- **No upload code has been added.** No `fetch`, no `FormData`, no Supabase
  Storage SDK calls anywhere in the frontend.
- `/demo/client/media` (`src/pages/client-media.tsx`) is **local-state-only**
  — the file picker reads file *names / sizes / MIME types* into React state
  and never uploads. Selected files are wiped on refresh.
- The Supabase frontend client remains anon read-only for the Client Portal
  demo only.

## What's in here

| File | Purpose |
| --- | --- |
| `001_media_storage_plan.md` | Bucket name, path layout, allowed MIME types, size limits, upload flow, signed-URL strategy, RLS direction. |
| `002_media_assets_metadata_draft.sql` | Draft ALTER / CHECK / index direction for `media_assets`. **Commented; do not apply.** |

## Prerequisites before any real upload ships

1. Real Supabase Auth wired (`signInWithPassword` / session listener).
2. `user_profiles` + `veroxa_user_role` enum applied.
3. `team_client_assignments` applied (team can only see assigned clients).
4. Production SELECT RLS reviewed and applied.
5. `audit_logs` table applied.
6. Storage bucket `veroxa-client-media` created **private**, with storage
   policies reviewed and applied.
7. Server-side upload endpoint that:
   - validates role / `client_id` / MIME type / file size,
   - writes the file under `clients/{client_id}/...`,
   - inserts the `media_assets` row,
   - inserts the matching `audit_logs` row.
8. Signed-URL strategy (short-lived, server-issued, never persisted).

## Out of scope for the first storage phase

- AI review / scoring (`quality_score`, `ai_review_summary`).
- Direct social publishing from media (Priority 4 — see
  `docs/FIRST_WRITE_SURFACE_PLAN.md`).
- Malware / content moderation — revisit before real production traffic.
