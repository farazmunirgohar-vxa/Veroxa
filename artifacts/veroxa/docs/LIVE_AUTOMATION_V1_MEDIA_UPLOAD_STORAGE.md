# Live Automation V1 Media Upload + Storage

Status: PR #102 media upload/storage foundation. This prepares private storage, validation, upload service code, and safe UI gating only; it does not make Veroxa fully live.

## 1. What PR #102 added

- Private Supabase Storage bucket setup for restaurant media.
- Conservative authenticated storage policies for client/team access.
- Media validation utilities for photos/videos, file size, safe type, safe extension, and batch count.
- Restaurant-scoped storage path generation.
- A gated media upload service that can upload to storage and create a `media_assets` record only when safe runtime gates are active.
- A client media upload panel that returns nothing unless real auth and the explicit upload flag are enabled.
- Guardrails for bucket privacy, path safety, validation, upload status, no public publishing language, no service-role frontend key, and placeholder-mode safety.

## 2. Storage bucket name and privacy rule

Bucket name: `restaurant-media`.

The bucket is private. It must not be public and must not become a public customer-facing gallery/CDN surface. Anonymous users have no read or write policy. Browser code uses only the anon key with authenticated user policies; service-role credentials are not exposed.

## 3. Storage path convention

Media paths use:

`restaurants/{restaurantId}/uploads/{yyyy}/{mm}/{uuid}.{extension}`

Rules:

- The path includes the restaurant id.
- Raw user filenames are not used as storage keys.
- The object name uses a generated UUID.
- Extensions are derived from supported media type validation.
- Path traversal and arbitrary folders are rejected by the path helper and storage policies.

## 4. File validation rules

Supported images: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif`.

Supported videos: `video/mp4`, `video/quicktime`, `video/webm`.

Limits:

- Images: 25 MB maximum.
- Videos: 100 MB maximum.
- Batch upload: 10 files maximum.

Client-facing errors stay owner-safe, such as “This file type is not supported yet,” “This file is too large,” “Please upload photos or videos only,” and “Upload failed. Please try again.”

## 5. Media asset DB record behavior

When real auth, active restaurant access, configured storage, and `VITE_VEROXA_MEDIA_UPLOAD_ENABLED=true` are all in place, successful upload creates a `media_assets` row with:

- `restaurant_id`
- `storage_path`
- `file_url = null` because the bucket is private and signed URLs can be added later
- `file_type`
- `mime_type`
- `file_size`
- `uploaded_by`
- `status = uploaded`
- `ai_summary = null`
- `veroxa_notes = null`

Uploaded media is not published, posted, approved, live on Google, live on Instagram/Facebook, or part of a public campaign.

## 6. Client upload behavior

When upload is safely available, the Client Media page can show an upload area with selected file validation, uploading state, a success message, and owner-safe status. Copy says the restaurant can upload photos or videos whenever it is easy and Veroxa will review them.

## 7. Placeholder mode behavior

`AUTH_MODE` remains `placeholder` in PR #102. `/api/pilot-access` remains active.

In placeholder mode, upload is not active and the upload panel is not shown. The Momo Client Portal keeps the current safe media recommendation/review experience with no fake upload controls, no fake upload progress, no fake upload history, and no fake “uploaded successfully” records.

## 8. Team-side boundary

PR #102 does not add the full Team Automation Control Center, media approval workflow, caption workflow, or publishing workflow. Team-side media intake can be read-only in a later scoped step after real auth/storage is proven.

## 9. Activity log boundary

PR #105 owns the Activity Log module. PR #102 does not centralize event writing and does not generate reports from activity. A later PR may add `media_uploaded` events after the activity module exists.

## 10. What remains before PR #103

Before PR #103, this media foundation remains gated and safe. PR #103 will handle real messages/portal threads; it should not reuse media upload work as proof that messaging is live.

## 11. What remains before Momo walkthrough

Momo owner walkthrough remains blocked until full Live Automation V1 is built and approved. Media upload/storage is only the third implementation step after auth and database foundations; it does not complete Live Automation V1.

## 12. What is not live yet

- `AUTH_MODE` remains `placeholder`.
- `/api/pilot-access` remains active.
- Upload is not active in placeholder mode.
- Uploaded media is not published.
- No AI captions are generated.
- No AI media analysis is connected.
- No social posting is connected.
- No Google/Meta integrations are connected.
- No reports are generated from uploads.
- No real messages, profile correction runtime, payments, cron jobs, background jobs, or webhooks were added.
- Momo owner walkthrough remains blocked.

## 2026-06-16 — PR #102 RR patch: storage path and metadata hardening

- Storage policies now enforce the full `restaurants/{restaurantUuid}/uploads/{yyyy}/{mm}/{objectUuid}.{safeExtension}` path shape through SQL helpers, not only through the frontend path builder.
- Raw filename paths, missing date folders, arbitrary nested folders, unsupported extensions, non-UUID restaurant ids, and non-UUID object names are rejected at the policy/helper layer.
- `media_assets` inserts now require a private safe storage path, matching parsed restaurant id, active client restaurant membership, `uploaded_by = auth.uid()`, `status = uploaded`, null `file_url`, null `ai_summary`, null `veroxa_notes`, non-null `file_type`, non-null `mime_type`, and non-null positive `file_size`.
- SQL constraints/policies mirror media validation for image MIME types, video MIME types, 25 MB image limit, and 100 MB video limit so direct authenticated calls cannot insert unsupported or fake media rows.
- Frontend validation remains, but DB/storage boundaries now also enforce the same safety model.
- `AUTH_MODE` remains `placeholder`; upload remains inactive in placeholder mode; uploaded media remains not published; no PR #103+ scope was added; Momo owner walkthrough remains blocked.

## 2026-06-19 — PR #116 Momo Media + Content Inventory Pack

GitHub PR #116 adds Momo Media + Content Inventory Pack only. PR #109 Momo Live Pilot Readiness Gate is merged. PR #110 Post-PR109 Momo readiness alignment is merged. PR #111 Controlled Momo Pilot Activation Gate is merged. PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged. PR #113 Post-PR112 Source-of-Truth Finalization is merged. PR #114 Momo Internal Pilot Prep Pack is merged. PR #115 Momo Business Truth Review Pack is merged. PR #116 is internal media/content inventory only. PR #116 does not activate the pilot, does not activate real auth, does not create credentials, does not contact Momo’s House, does not upload, create, seed, generate, or fake media, does not publish externally, does not connect external platforms, and does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners. AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval. Business-truth changes require owner confirmation before any public/customer-visible use. Media usage rights require owner confirmation before public/customer-visible use. Sensitive claims are blocked until owner-confirmed. AI may use only confirmed business truth and permissioned media in later internal drafts.
