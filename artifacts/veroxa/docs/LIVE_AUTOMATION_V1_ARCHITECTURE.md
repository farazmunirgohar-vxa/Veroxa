# Live Automation V1 Architecture + Schema Design

Status: source-of-truth architecture plan for PR 99. This document is design only and does not mark live auth, database writes, storage uploads, live messages, AI runtime calls, platform publishing, payments, cron jobs, webhooks, or customer-visible automation as built.

## 2026-06-15 — PR 100 implementation status

- Supabase Auth Foundation is now implemented in code behind `AUTH_MODE`.
- `AUTH_MODE` remains `placeholder`; current pilot access still uses `/api/pilot-access`.
- The real-auth foundation validates active `user_profiles`, restricts active roles to `client` and `team`, requires active restaurant membership for client users, prepares password reset, and keeps client/team route guards separated.
- This does not mark full Live Automation V1 as live: no media uploads, live messages, profile correction persistence, activity log implementation, AI runtime calls, reports from real activity, integrations, payments, publishing, cron jobs, or webhooks were added.
- Momo owner walkthrough remains blocked until the full PR 100–PR 109 sequence is completed and approved.

## 1. Live Automation V1 Definition

**Live Automation V1** is the first production-style operating layer that lets Momo upload, message, request corrections, and see real activity-backed updates while Veroxa automatically organizes, drafts, routes, tracks, and prepares reports, with Faraz approving public/customer-visible actions.

Live Automation V1 is required before any Momo owner walkthrough. Veroxa should not walk Momo through a polished static/manual portal and imply it is live automation. The walkthrough remains blocked until the acceptance criteria in this document are met.

Live Automation V1 is:

- real enough for the Momo pilot account to use live login, uploads, messages, correction requests, activity-backed updates, and activity-backed reports;
- automatic enough to reduce manual Veroxa/Faraz workload through intake, organization, routing, draft preparation, status tracking, activity logging, and report preparation;
- approval-gated so Faraz reviews public/customer-visible actions before anything goes live;
- confirmation-gated so business-truth changes require restaurant confirmation before approval or execution;
- designed for Momo first while avoiding decisions that block future multi-client scale.

Live Automation V1 is **not**:

- full SaaS;
- unrestricted auto-posting;
- ordering platform integration;
- payment, billing, subscriptions, invoices, or checkout;
- Meta/Google publishing API activation;
- multi-client scale readiness, even though the architecture must avoid hard-coding Momo in a way that blocks future clients;
- a reason to show fake metrics, fake uploads, fake messages, fake reports, or fake live claims.

## 2. Product Principles

- Veroxa exists to make restaurant growth easier for the restaurant.
- The restaurant should do the least possible work.
- The portal should reduce stress, not create homework.
- Automation should reduce Veroxa/Faraz workload.
- Public/customer-visible actions require approval.
- Business-truth changes require restaurant confirmation.
- No fake metrics, fake uploads, fake messages, fake reports, or fake live claims.
- No public/client-facing guarantees for orders, revenue, ROI, profit, rankings, customers, walk-ins, or growth.

## 3. Live Automation V1 Modules

### Module 1 — Real Auth

**Purpose:** Replace placeholder pilot access with real user authentication for Momo and Team Faraz. This is design only; PR 99 does not implement auth.

**Required capabilities:**

- Momo owner login.
- Team Faraz login.
- Role-based access.
- Session persistence.
- Logout.
- Password reset.
- Account disabled/status control.
- Client/team route protection.

**Roles:** only `client` and `team`.

Do not add Owner, Operator, Super Admin, generic Admin, or Execution roles.

**Route rules:**

- Client role can access `/client/dashboard`, `/client/media`, `/client/messages`, `/client/reports`, `/client/connections`, and `/client/profile`.
- Team role can access `/team/*`.
- Client cannot access Team.
- Team should not accidentally be treated as client.

**Client-facing behavior:** Momo signs in, stays signed in appropriately, can log out, can reset password, and sees only Client Portal routes.

**Team/Faraz-facing behavior:** Faraz signs in as Team, sees Team routes, can review account status, and is never routed into the client experience by mistake.

**Data created:** `user_profiles`, `restaurant_members`, sessions/auth-provider user records in the future implementation.

**Activity log events:** `user_signed_in`, `user_signed_out`, `password_reset_requested`, `account_status_changed`, `role_access_denied` where useful and safe.

**Safety rules:** disabled users cannot access routes; role checks must be server-enforced where relevant; client copy must not expose Supabase/backend/RLS language.

**Explicitly not included:** production auth implementation, migrations, RLS, new roles, owner/operator dashboards, generic admin dashboards, payment-gated auth, or multi-tenant scale beyond the minimum contract.

**Proposed tables/contracts:** `user_profiles`, `restaurant_members`. Do not implement migrations in PR 99.

### Module 2 — Database Foundation

**Purpose:** Define the minimum database tables needed for Momo Live Automation V1. This is design only; PR 99 adds no migrations.

**Client-facing behavior:** Client pages read real restaurant, media, message, correction, activity, and report status after future implementation.

**Team/Faraz-facing behavior:** Team pages read and manage real work queues, activity records, drafts, approvals, and report review state after future implementation.

**Minimum tables:**

#### `user_profiles`

- `id`
- `email`
- `role`
- `display_name`
- `status`
- `created_at`
- `updated_at`

#### `restaurants`

- `id`
- `name`
- `address`
- `phone`
- `timezone`
- `status`
- `created_at`
- `updated_at`

#### `restaurant_members`

- `id`
- `restaurant_id`
- `user_id`
- `role`
- `status`
- `created_at`
- `updated_at`

#### `restaurant_profile_fields`

- `id`
- `restaurant_id`
- `section`
- `label`
- `value`
- `status`
- `source`
- `updated_at`

#### `media_assets`

- `id`
- `restaurant_id`
- `storage_path`
- `file_url`
- `file_type`
- `mime_type`
- `file_size`
- `uploaded_by`
- `status`
- `ai_summary`
- `veroxa_notes`
- `created_at`
- `updated_at`

#### `messages`

- `id`
- `restaurant_id`
- `sender_user_id`
- `sender_role`
- `body`
- `status`
- `created_at`
- `updated_at`

#### `profile_corrections`

- `id`
- `restaurant_id`
- `field_id`
- `field_label`
- `current_value`
- `requested_value`
- `status`
- `requested_by`
- `reviewed_by`
- `review_note`
- `created_at`
- `updated_at`

#### `activity_log`

- `id`
- `restaurant_id`
- `actor_type`
- `actor_user_id`
- `event_type`
- `title`
- `description`
- `related_entity_type`
- `related_entity_id`
- `visibility`
- `report_eligible`
- `created_at`

#### `ai_drafts`

- `id`
- `restaurant_id`
- `draft_type`
- `source_entity_type`
- `source_entity_id`
- `draft_text`
- `status`
- `safety_flags`
- `created_at`
- `updated_at`

#### `approvals`

- `id`
- `restaurant_id`
- `item_type`
- `item_id`
- `status`
- `reviewed_by`
- `decision_note`
- `created_at`
- `updated_at`

#### `reports`

- `id`
- `restaurant_id`
- `report_type`
- `period_start`
- `period_end`
- `status`
- `summary`
- `body_json`
- `created_at`
- `updated_at`

**Data created:** the tables above, once future migrations are approved.

**Activity log events:** `restaurant_created`, `restaurant_status_changed`, `profile_field_updated`, `connection_status_changed`, plus module-specific events below.

**Safety rules:** every row that belongs to a restaurant must carry `restaurant_id`; client-visible reads must be scoped to the authenticated member's restaurant; internal-only records must not leak to client routes.

**Explicitly not included:** migrations in PR 99, RLS policies, DB adapters, production writes, storage buckets, seed scripts, or live repository wiring.

### Module 3 — Real Media Upload

**Purpose:** Let Momo upload real photos/videos from the Media page so Veroxa can review, organize, prepare drafts, and use approved assets later.

**Client-facing behavior:** Momo can upload photos or videos directly from Media. Client copy stays low-pressure: “Upload photos or videos whenever it is easy. They do not need to be perfect. Veroxa will review them.” Momo sees preview, upload status, and review status.

**Team/Faraz-facing behavior:** Faraz sees uploaded media in a Media Review Queue, can mark status, add notes, request a better version, save for later, or create a draft.

**Required behavior:** file upload, file validation, preview, upload status, `media_assets` record, storage path, Team review queue item, and activity log event.

**Client statuses:** Uploaded, Under Veroxa Review, Ready to Use, Saved for Later, Better Version Helpful, Used.

**Data created:** `media_assets`, related `activity_log`, optional `ai_drafts`, optional `approvals` for public/customer-visible use.

**Activity log events:** `media_uploaded`, `media_reviewed`, `media_saved_for_later`, `media_better_version_requested`, `media_marked_ready_to_use`, `media_used`.

**Safety rules:** upload does not mean publish; uploaded media is not public by default; no automatic posting; file type/size validation is required; every asset must belong to a restaurant; client pages must not show storage/backend internals.

**Explicitly not included:** storage bucket code in PR 99, upload UI behavior in PR 99, automatic publishing, public social posting, image generation/editing, or using uploads without review.

### Module 4 — Real Messages

**Purpose:** Provide real client/team communication in the portal for media, profile, access, and report questions.

**Client-facing behavior:** Momo can send messages to Veroxa, view Veroxa replies, and see read/unread state for profile/media/access/report questions.

**Team/Faraz-facing behavior:** Faraz sees a Message Inbox, replies, marks messages resolved, and links messages to media, profile corrections, or activity/work items.

**Data created:** `messages`, linked `activity_log`, optional follow-up/correction/draft records.

**Activity log events:** `client_message_sent`, `team_reply_sent`, `message_resolved`, `message_linked_to_work_item`.

**Safety rules:** messages are not public; client messaging does not imply instant completion; complaint/reputation-risk language must be flagged before public use; client pages should not expose internal routing details.

**Explicitly not included:** live messaging implementation in PR 99, SMS, email automation, DMs/inboxes/comments/customer-service handling, push notifications, or external chat integrations.

### Module 5 — Profile Correction Requests

**Purpose:** Keep Profile review-first while letting Momo request corrections that Faraz reviews before internal profile updates.

**Client-facing behavior:** Momo sees profile fields and can request a correction. Example: Field: Hours; Current value: Needs confirmation; Requested value: Monday–Saturday 11am–9pm.

**Team/Faraz-facing behavior:** Faraz can approve, edit, reject, ask client, or mark pending confirmation.

**Data created:** `profile_corrections`, updated `restaurant_profile_fields` after approval, related `activity_log`, optional `approvals` if a public/platform change is later proposed.

**Activity log events:** `profile_correction_requested`, `profile_correction_approved`, `profile_correction_rejected`, `profile_field_updated`.

**Safety rules:** approved correction updates internal restaurant profile only; public/platform changes require separate approval; business-truth changes require owner confirmation; sensitive claims must be flagged.

**Explicitly not included:** direct public Google/Meta/website updates, automatic platform publishing, unreviewed profile edits, or production persistence in PR 99.

### Module 6 — Activity Log

**Purpose:** The activity log is the backbone of Veroxa automation and reporting.

**Client-facing behavior:** Client-visible activity becomes simple progress language and report inputs, not raw operational logs.

**Team/Faraz-facing behavior:** Faraz sees meaningful work history, blockers, linked entities, report eligibility, and internal/client visibility.

**Visibility levels:** `internal_only`, `client_visible`, `report_eligible`.

**Data created:** `activity_log` records for meaningful events across modules.

**Activity log events:** `media_uploaded`, `media_reviewed`, `ai_draft_created`, `message_sent`, `profile_correction_requested`, `correction_approved`, `connection_status_changed`, `report_generated`, `report_published_to_client`.

**Safety rules:** not every internal event should be visible to the restaurant; internal-only AI/safety details must stay internal; report eligibility is not the same as client visibility.

**Explicitly not included:** full audit logging/security monitoring in PR 99, analytics events, fake activity, or client exposure of internal IDs and backend terms.

### Module 7 — AI-Assisted Drafting / Preparation

**Purpose:** Let AI prepare internal work so Faraz reviews a managed queue instead of creating everything manually.

**AI can prepare:** media summaries, food/menu guesses, usability suggestions, caption drafts, Google update drafts, Instagram/Facebook caption drafts, message reply drafts, profile correction summaries, report drafts, and next-step recommendations.

**Client-facing behavior:** Clients see polished Veroxa-safe outputs only after review/approval where applicable. They do not see raw AI internals.

**Team/Faraz-facing behavior:** Faraz sees drafts with safety flags, source links, confidence/confirmation needs, and approve/edit/reject/hold controls.

**Data created:** `ai_drafts`, related `activity_log`, optional `approvals`.

**Activity log events:** `ai_draft_created`, `ai_draft_flagged`, `ai_draft_approved`, `ai_draft_edited`, `ai_draft_rejected`, `ai_draft_held`.

**AI must not:** publish, approve itself, change public profile info, invent claims, invent menu items, invent offers/promotions, invent sales/reach/ranking metrics, guarantee results, or bypass Faraz approval.

**Safety flags:** `business_truth_confirmation_required`, `sensitive_claim`, `promotion_or_discount`, `dietary_or_religious_claim`, `complaint_or_reputation_risk`, `low_confidence`, `needs_owner_input`, `ready_for_faraz_review`.

**Explicitly not included:** live AI runtime calls in PR 99, autonomous publishing, autonomous approval, training/fine-tuning, image generation/editing, or client-visible raw AI output.

### Module 8 — Team Automation Control Center

**Purpose:** Evolve the Team Portal into a calm Automation Control Center for Faraz.

**Client-facing behavior:** Clients see calmer statuses, replies, profile review outcomes, and reports caused by Team review decisions, not the internal control center.

**Team/Faraz-facing behavior:** Faraz works through unified queues and makes decisions quickly from mobile or computer.

**Required queues:**

- **Media Review Queue:** mark Ready to Use, Save for Later, request better version, add notes, create draft.
- **Message Inbox:** reply, mark resolved, create correction task, create follow-up.
- **Profile Correction Queue:** approve, edit, reject, ask client.
- **AI Draft Queue:** approve, edit, reject, hold.
- **Approval Queue:** for public/customer-visible work; approve, hold, request client confirmation, reject.
- **Report Review Queue:** approve report, edit report, publish report to client portal.
- **Activity Log:** view filtered internal/client/report-eligible events.

**Data created:** queue views over `media_assets`, `messages`, `profile_corrections`, `ai_drafts`, `approvals`, `reports`, and `activity_log`.

**Activity log events:** queue-specific review events, decision events, `approval_requested`, `approval_approved`, `approval_held`, `approval_rejected`, `client_confirmation_requested`.

**Safety rules:** Team Portal should become a calm Automation Control Center, not a manual-only command center or AI lab; decisions must preserve approval and owner-confirmation gates.

**Explicitly not included:** production implementation in PR 99, broad role dashboards, Owner/Operator/Super Admin/generic Admin/Execution roles, live publishing buttons, or complex enterprise admin tooling.

### Module 9 — Reports Generated From Real Activity

**Purpose:** Generate weekly updates and monthly reports from real activity log data.

**Client-facing behavior:** Momo sees what Veroxa did, what is next, and what needs owner attention. If nothing is needed, say: “Nothing needed at the moment.”

**Team/Faraz-facing behavior:** Faraz reviews generated report drafts, edits if needed, approves, and publishes to client portal.

**Weekly update generated from:** uploaded media, reviewed media, profile corrections, messages, access status, drafts created, approvals completed, and blockers.

**Monthly report generated when enough real activity exists. Can include:** work completed, media reviewed, profile/access progress, content prepared, approved updates, pending blockers, and recommendations.

**Data created:** `reports`, related `activity_log`, optional `ai_drafts` for draft report text.

**Activity log events:** `weekly_update_generated`, `monthly_report_generated`, `report_reviewed`, `report_published_to_client`.

**Safety rules:** reports must come from real activity; do not include fake reach, fake rankings, fake revenue, fake orders, fake sales, or fake ROI; Faraz approval is required before client visibility.

**Explicitly not included:** live report generation in PR 99, analytics integrations, revenue/order attribution, fake benchmark metrics, or automatic client publication.

## 4. Data Flow Diagrams

### Auth + restaurant membership

```text
User signs in
  -> auth provider session
  -> user_profiles
  -> restaurant_members
  -> role check
  -> client routes or team routes
  -> activity_log(user_signed_in / access_denied where appropriate)
```

### Media upload

```text
Client Media Upload
  -> file validation
  -> storage path
  -> media_assets
  -> activity_log(media_uploaded)
  -> AI preparation
  -> ai_drafts
  -> Team Media Review Queue
  -> approval / hold / better version helpful
  -> activity_log(media_reviewed)
  -> client-visible status
```

### Message flow

```text
Client sends message
  -> messages
  -> activity_log(client_message_sent)
  -> Team Message Inbox
  -> Faraz reply / resolve / link to work item
  -> messages update
  -> activity_log(team_reply_sent / message_resolved / message_linked_to_work_item)
  -> client sees reply or resolved state
```

### Profile correction flow

```text
Client requests correction
  -> profile_corrections
  -> activity_log(profile_correction_requested)
  -> Profile Correction Queue
  -> Faraz approve / edit / reject / ask client / pending confirmation
  -> restaurant_profile_fields update only if approved
  -> activity_log(profile_correction_approved / profile_correction_rejected / profile_field_updated)
  -> separate approval required for any public/platform change
```

### AI draft flow

```text
Source entity: media / message / profile correction / activity period
  -> AI preparation request after allowed trigger
  -> ai_drafts with safety_flags
  -> activity_log(ai_draft_created)
  -> AI Draft Queue
  -> Faraz approve / edit / reject / hold
  -> approvals if public/customer-visible
  -> activity_log(ai_draft_approved / ai_draft_edited / ai_draft_rejected / ai_draft_held)
```

### Report generation flow

```text
Activity period closes
  -> query activity_log where report_eligible is true
  -> report draft preparation
  -> reports(status: draft)
  -> activity_log(report_generated)
  -> Report Review Queue
  -> Faraz edit / approve / hold
  -> reports(status: published) only after approval
  -> activity_log(report_published_to_client)
  -> client sees activity-backed report
```

## 5. Safety Gate Matrix

| Action | Can AI prepare? | Needs Faraz approval? | Needs owner confirmation? | Can publish automatically in V1? |
| --- | --- | --- | --- | --- |
| Caption draft | Yes | Yes before public/customer-visible use | Maybe, if business truth is uncertain | No |
| Google update draft | Yes | Yes | Maybe, if business truth is involved | No |
| Instagram/Facebook post draft | Yes | Yes | Maybe, if business truth is involved | No |
| Profile hours change | Yes, as summary/check | Yes | Yes | No |
| Menu change | Yes, as summary/check | Yes | Yes | No |
| Price change | Yes, as summary/check | Yes | Yes | No |
| Catering claim | Yes, as summary/check | Yes | Yes | No |
| Delivery claim | Yes, as summary/check | Yes | Yes | No |
| Discount/offer | Yes, only if existing offer is provided for confirmation | Yes | Yes | No |
| Uploaded photo | Yes, for summary/usability | Yes before public use | Maybe, if content/claim is unclear | No |
| Report generation | Yes | Yes before client visibility | No, unless it contains business-truth claims needing confirmation | No |
| Report visible to client | Yes, as draft only | Yes | Maybe, if business-truth claims are included | No |
| Complaint response | Yes, as cautious draft only | Yes | Yes for sensitive reputation-impacting language | No |

## 6. Route/Page Impact

### Client Portal

- **Home:** evolves from seeded owner actions to activity-backed status.
- **Media:** evolves from recommendation-only to real upload plus real review statuses.
- **Messages:** evolves from static guidance to real messaging.
- **Reports:** evolves from static weekly/monthly cards to activity-backed reports.
- **Connections:** evolves from static Meta/Google status to tracked connection records.
- **Profile:** evolves from read-only review to correction requests.

### Team Portal

Team Portal evolves into the Automation Control Center:

- Media Review Queue.
- Message Inbox.
- Profile Correction Queue.
- AI Draft Queue.
- Approval Queue.
- Report Review Queue.
- Activity Log.

## 7. Build Sequence

### PR 100 — Supabase Auth Foundation

- real auth
- user profiles
- role routing
- logout/password reset
- route protection

### PR 101 — Database Foundation

- schema/migrations
- restaurant/account records
- repository interfaces

### PR 102 — Media Upload + Storage

- storage
- upload UI
- media records
- Team media queue

### PR 103 — Real Messages

- client sends
- team replies
- persistence
- read/unread
- activity events

### PR 104 — Profile Corrections

- correction request
- team review
- approved internal profile update

### PR 105 — Activity Log

- centralize all meaningful events
- visibility/report eligibility

### PR 106 — AI Draft Preparation

- media AI suggestions
- caption drafts
- message reply drafts
- report drafts
- strict safety flags

### PR 107 — Team Automation Control Center

- unified Team queues
- Faraz review/approval workflow

### PR 108 — Reports From Activity

- weekly update from activity
- monthly report from activity
- Faraz approval before client visibility

### PR 109 — Momo Live Pilot Readiness Gate

- final QA gate before owner walkthrough

## 8. Acceptance Criteria For Live Automation V1

Live Automation V1 is complete only when:

- Momo has real login.
- Team Faraz has real login.
- Momo can upload media.
- Uploaded media is stored and visible to Team.
- Momo can send messages.
- Team can reply.
- Momo can request profile corrections.
- Team can review/approve corrections.
- Activity log records meaningful events.
- AI can prepare internal drafts/suggestions.
- Faraz can approve/edit/hold/reject AI-prepared work.
- Reports generate from activity.
- Client sees no fake metrics.
- No public action goes live automatically.
- No business-truth changes happen without owner confirmation.
- Momo walkthrough can happen safely.

## 9. Guardrail Plan

Future guardrails should prevent:

- activating live AI without approval gates;
- adding public auto-publishing in V1;
- exposing raw AI/OpenAI/Supabase/backend language to clients;
- bypassing Faraz approval for public actions;
- bypassing owner confirmation for business truth;
- showing fake metrics/reports;
- storing media without restaurant association;
- showing uploaded media as published;
- adding ordering platform complexity before it is re-approved.

PR 99 only documents this guardrail plan. Future implementation PRs should add tests and guardrails as each live capability is introduced without weakening safety rules.

## 10. Existing Docs Update Requirements

- `ACTIVE_DOCS_INDEX.md` must list this file near the top as a source-of-truth doc and record that Live Automation V1 architecture is planned.
- `VEROXA_LOCKED_OPERATING_MEMORY.md` must reference this file as the detailed build plan.
- `CURRENT_BUILD_STATUS.md` must state that PR 99 added architecture only, not live functionality.
- `VEROXA_OS_SYSTEM_MAP.md` must state that Live Automation V1 architecture is planned but not built.
- `AGENTS.md` must tell future PR 100+ implementers to read this file first.

## 11. PR 99 Explicit Non-Implementation Lock

PR 99 must not add production auth implementation, Supabase migrations, database writes, storage bucket code, file upload behavior, real messaging behavior, live AI calls, Meta/Google APIs, payments, publishing, cron/background jobs, webhooks, or live customer-visible automation.
