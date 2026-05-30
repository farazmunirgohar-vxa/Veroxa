# Client Portal Persistence Contract

## Purpose

This is a planning contract for a future Supabase-backed Client Portal journey/report pipeline. It does **not** create migrations, run SQL, or change the database today.

The current implementation remains deterministic and local/demo-safe. Future persistence should preserve the same client-safe domain shape exposed by `src/domain/clientPortalJourney/`.

## Shared rules

- Restaurant partners only see client-safe fields.
- Team users can write and review operational fields.
- Owner/admin rules should be defined later with production auth; do not expose Owner/Operator dashboards now.
- Business-truth changes require client confirmation before public use.
- Public or customer-visible work still requires Veroxa team review.
- Clients never see internal analysis fields, raw scoring, queue mechanics, execution machinery, or vendor implementation details.

## `client_journey_items`

**Purpose:** Canonical client-visible work item stream from uploads, requests, prepared work, visibility progress, weekly updates, and monthly reports.

**Client-safe fields:**

- `id`
- `client_id`
- `restaurant_name`
- `type`
- `source`
- `status`
- `priority`
- `title`
- `description`
- `created_label`
- `submitted_label`
- `updated_label`
- `needs_client_input`
- `next_step`
- `action_label`
- `href`
- `report_inclusion_state`
- `visibility_category`

**Internal-only fields:** source record references, team notes, review decisions, safety gates, execution state, raw inputs, and audit details.

**RLS expectation:** Client role can read rows for its own `client_id` where `client_visible = true`. Team role can read/write scoped rows. Admin/owner rules are future production-auth work.

**Visibility rules:** Only statuses from the Client Journey domain are allowed on client-readable rows.

**Relationship to existing tables:** May link to workflow submissions, prepared actions, report records, and visibility records by internal reference columns that are never selected in client views.

**Migration timing:** Later only. No migration in this stage.

## `client_workflow_events`

**Purpose:** Append-only client-safe timeline events for uploads, requests, clarifications, content preparation, report readiness, and completed work.

**Client-safe fields:**

- `id`
- `client_id`
- `journey_item_id`
- `client_safe_label`
- `description`
- `event_label`
- `created_label`
- `visible_to_client`

**Internal-only fields:** actor IDs, internal event type, raw event payload, team-only notes, queue references, and system diagnostics.

**RLS expectation:** Client reads only visible events for its own `client_id`. Team writes events through approved server-side paths later.

**Visibility rules:** Events without a client-safe label stay team-only.

**Relationship to existing tables:** Future adapter can map current workflow activity events into this table/view.

**Migration timing:** Later only.

## `client_weekly_updates`

**Purpose:** Store reviewed weekly update payloads for the Client Portal.

**Client-safe fields:**

- `id`
- `client_id`
- `restaurant_name`
- `week_label`
- `headline`
- `completed_work`
- `in_progress_work`
- `needs_client_input`
- `visibility_progress`
- `content_progress`
- `review_progress`
- `next_week_focus`
- `client_safe_summary`
- `status`
- `published_label`

**Internal-only fields:** draft notes, review status, preparer, reviewer, source item references, and any future drafting metadata.

**RLS expectation:** Client reads only reviewed/published updates for its own account. Team can draft/review/publish.

**Visibility rules:** Drafts are not client-visible until Veroxa team review is complete.

**Relationship to existing tables:** Can aggregate from `client_journey_items`, `client_workflow_events`, and report source records.

**Migration timing:** Later only.

## `client_monthly_reports`

**Purpose:** Store reviewed monthly report payloads for the Client Portal.

**Client-safe fields:**

- `id`
- `client_id`
- `restaurant_name`
- `month_label`
- `executive_summary`
- `visibility_progress`
- `media_and_content_summary`
- `review_reputation_summary`
- `completed_work`
- `pending_client_input`
- `next_month_focus`
- `client_safe_recommendations`
- `status`
- `published_label`

**Internal-only fields:** validation notes, internal report checklist, source references, team review state, and future drafting metadata.

**RLS expectation:** Client reads only reviewed/published reports for its own account. Team can draft/review/publish.

**Visibility rules:** No fake metrics, no guarantees, no unreviewed drafts.

**Relationship to existing tables:** Can aggregate reviewed weekly updates, completed journey items, visibility progress, and future real metrics.

**Migration timing:** Later only.

## `client_visibility_progress`

**Purpose:** Store client-safe local visibility progress without exposing audit mechanics.

**Client-safe fields:**

- `id`
- `client_id`
- `restaurant_name`
- `google_profile_freshness`
- `review_response_progress`
- `photo_freshness_need`
- `business_details_need_confirmation`
- `menu_or_ordering_link_check`
- `local_search_focus`
- `next_visibility_action`
- `updated_label`

**Internal-only fields:** source findings, scoring, severity, audit IDs, rule outputs, external payloads, and team notes.

**RLS expectation:** Client reads only client-safe summaries for its own account. Team writes reviewed summaries.

**Visibility rules:** Never expose raw audit scores, severity, finding IDs, crawler details, live integration state, or ranking promises.

**Relationship to existing tables:** Future adapter can map visibility audit outputs into this client-safe summary table/view.

**Migration timing:** Later only.

## `client_needs`

**Purpose:** Store active items Veroxa needs from the restaurant partner.

**Client-safe fields:**

- `id`
- `client_id`
- `restaurant_name`
- `journey_item_id`
- `type`
- `priority`
- `title`
- `description`
- `action_label`
- `href`
- `status`
- `created_label`
- `resolved_label`

**Internal-only fields:** team owner, reason code, internal blocker, safety gate, and source references.

**RLS expectation:** Client reads unresolved/resolved needs for its own account. Team creates/resolves needs.

**Visibility rules:** Use calm copy: “Needs your input,” “More content needed,” “Confirm details,” or “Upload media.” Do not expose internal blockers.

**Relationship to existing tables:** Can be derived from workflow items, prepared actions needing confirmation, media guidance, and business update requests.

**Migration timing:** Later only.

## Future adapter approach

When persistence is approved, implement adapters behind the existing `clientPortalJourney` helper surface so pages keep calling:

- `getClientPortalJourney(clientId)`
- `getClientProgressSummary(clientId)`
- `generateClientWeeklyUpdate(clientId)`
- `generateClientMonthlyReport(clientId)`
- `getClientLocalVisibilityProgress(clientId)`

Do not make client pages know whether data comes from local fixtures or persisted tables.
