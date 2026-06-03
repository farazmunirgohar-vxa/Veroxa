# SaaS Media Storage Lifecycle

Status: Design-only. No storage uploads enabled yet. No production auth enabled yet. No migrations created yet. No live AI enabled yet. No payments enabled yet.

## Storage goals

- Client uploads media safely after a future RR-approved runtime phase.
- Media belongs to one restaurant.
- Client can view own uploaded media.
- Team can review and prepare media.
- Public cannot access private files.
- Final/edited assets are distinct from raw uploads.
- Deletion/retention policy is clear.
- `/client/*` and `/team/*` cannot use demo/sample fixtures once authenticated real mode is enabled.
- No future write should ship without activity logging.

## Proposed storage structure

- Bucket: `restaurant-media`
- Raw path: `{restaurant_id}/raw/{media_asset_id}/{filename}`
- Prepared path: `{restaurant_id}/prepared/{media_asset_id}/{filename}`
- Final path: `{restaurant_id}/final/{media_asset_id}/{filename}`

Rules:

- `restaurant_id` must be present in every private media path.
- Browser clients should receive scoped, time-limited access only after authorization.
- Raw uploads must not be treated as public-ready assets.
- Prepared/final assets must remain linked to the original `media_asset_id` or a parent asset reference in a future schema.

## Proposed `media_assets` fields

- `id`
- `restaurant_id`
- `uploaded_by_user_id`
- `source`
- `asset_type`
- `original_file_name`
- `storage_bucket`
- `storage_path`
- `mime_type`
- `file_size_bytes`
- `width`
- `height`
- `duration_seconds`
- `status`
- `client_note`
- `team_note`
- `best_use`
- `prep_status`
- `approved_for_use_at`
- `included_in_report_at`
- `created_at`
- `updated_at`
- `deleted_at`

Status values:

- `submitted`
- `needs_review`
- `needs_better_media`
- `ready_for_prep`
- `prepared`
- `approved`
- `scheduled_manual`
- `manually_posted`
- `included_in_report`
- `held`
- `archived`
- `deleted`

Prep status values:

- `not_needed`
- `needs_design_prep`
- `ready_for_design_prep`
- `edited_externally`
- `final_asset_pending`
- `final_asset_ready`

## Validation rules

- Allowed file types should be limited to common image/video types such as JPEG, PNG, WEBP, HEIC/HEIF if supported, MP4, MOV, and WEBM.
- Max file size must be explicit before launch; start conservatively and document the limit in UI copy.
- Max upload count per batch must be explicit before launch to protect performance and review workload.
- Malware/safety scan should be planned before broad client uploads.
- Client note is optional.
- Image content must not create unsupported public claims; dietary, health, religious, price, discount, catering, or offer claims still require confirmation.
- No public use before Veroxa team review and approval.

## Lifecycle

1. `submitted`: client submits media in future authenticated mode.
2. `needs_review`: system/team queues it for review.
3. `ready_for_prep` or `needs_better_media`: team decides whether it is usable.
4. `prepared`: media is drafted/adapted for a platform or report use.
5. `approved`: Faraz approves it for manual use.
6. `scheduled_manual` / `manually_posted`: manual execution is tracked.
7. `included_in_report`: client can see safe summary of work.
8. `held`, `archived`, or `deleted`: retained or removed based on policy.

## Deletion and retention

- Soft-delete with `deleted_at` before physical deletion when possible.
- Deleting a raw upload should not silently delete already-approved final assets without explicit team review.
- Activity logs should preserve a non-sensitive record of deletion/retention decisions.

## Future design studio path

Future-only; do not implement in this task:

- Canva/manual external design link.
- Built-in crop/resize later.
- Cloudinary/PhotoRoom/OpenAI image editing later.
- All editing output must remain tied to original media and activity logs.
- Live AI/image editing must require explicit RR approval and safety checks before runtime use.
