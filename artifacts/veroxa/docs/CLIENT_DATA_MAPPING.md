# Client Onboarding & Media — Demo-to-DB Data Mapping

> **Docs only.** Maps the current demo UI fields to their future
> production database fields. **Nothing in this document is wired or
> saved today.** Both `/demo/client/onboarding` and `/demo/client/media`
> use local React component state and never call Supabase, never upload,
> never persist.

---

## Client Onboarding

- **Demo page:** `/demo/client/onboarding` (`src/pages/client-onboarding.tsx`)
- **Future real page:** `/client/onboarding` (currently placeholder)
- **Data source today:** local React component state only
- **Future table:** `onboarding_items`
- **Future payload column:** `answer_payload jsonb`
- **Future audit actions (examples):**
  - `onboarding.answer_save`
  - `onboarding.mark_complete`
  - `onboarding.review_request`
  - `onboarding.approve`

### Section → `answer_payload` key mapping

| Demo section | Future `answer_payload` key |
| --- | --- |
| Restaurant Basics       | `restaurant_basics` |
| Brand & Positioning     | `brand_and_positioning` |
| Menu & Offers           | `menu_and_offers` |
| Content Preferences     | `content_preferences` |
| Media Instructions      | `media_instructions` |
| Google Visibility       | `google_visibility` |

Field-level shapes for each section live in
`docs/database/onboarding-draft/001_onboarding_answer_payload_draft.md`.

### Not built yet

- Real saves (no `INSERT` / `UPDATE` / `UPSERT` anywhere).
- Per-section validation against the payload schema.
- Operator review queue for completed onboarding.
- Audit log row insertion on save / review / approve.

---

## Client Media

- **Demo page:** `/demo/client/media` (`src/pages/client-media.tsx`)
- **Future real page:** `/client/media` (currently placeholder)
- **Data source today:** local selected file metadata only (file names,
  sizes, MIME types in React state — disappears on refresh)
- **Future table:** `media_assets`
- **Future storage bucket:** `veroxa-client-media` (private)
- **Future audit actions (examples):**
  - `media.upload_requested`
  - `media.upload_completed`
  - `media.review_started`
  - `media.approved`
  - `media.rejected`
  - `media.archived`

Field-level shape for `media_assets` lives in
`docs/database/media-draft/002_media_assets_metadata_draft.sql`. Bucket
layout, MIME allow-list, size limits, signed-URL strategy, and
server-mediated upload flow live in
`docs/database/media-draft/001_media_storage_plan.md`.

### Not built yet

- Real uploads (no `fetch`, no `FormData`, no Storage SDK calls).
- The Supabase Storage bucket itself.
- Server-issued, short-lived signed URLs for reads.
- Server-side upload-intent endpoint (validates role / `client_id` /
  MIME type / file size).
- Audit log row insertion on each upload / status change.
- Team review queue wiring against `media_assets.review_status`.

---

## Cross-references

- `docs/database/onboarding-draft/`
- `docs/database/media-draft/`
- `docs/FIRST_WRITE_SURFACE_PLAN.md` (Priority 3 — client-facing writes)
- `docs/WORKFLOW_STATE_MACHINES.md` (onboarding + media state machines)
- `docs/SAFETY_AUDIT_CHECKLIST.md`
