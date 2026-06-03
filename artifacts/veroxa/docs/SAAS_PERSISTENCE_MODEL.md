# SaaS Persistence Model

Status: Design-only. No migrations created yet. No production auth enabled yet. No storage uploads enabled yet. No live AI enabled yet. No payments enabled yet.

This model designs production persistence for core Veroxa workflows without enabling runtime database writes. All entities are proposed only. `/client/*` and `/team/*` cannot use demo/sample fixtures once authenticated real mode is enabled. No future write should ship without activity logging.

## `client_requests`

Fields:

- `id`
- `restaurant_id`
- `created_by_user_id`
- `request_type`
- `related_media_asset_id`
- `message`
- `preferred_timing`
- `status`
- `client_visible_status`
- `team_next_action`
- `requires_client_confirmation`
- `created_at`
- `updated_at`
- `resolved_at`

Rules:

- Client can create only for own restaurant.
- Team can triage and resolve.
- Client-safe status must avoid internal details.

## `prepared_actions`

Fields:

- `id`
- `restaurant_id`
- `source_type`
- `source_id`
- `action_type`
- `channel`
- `title`
- `prepared_copy`
- `media_asset_id`
- `risk_level`
- `requires_client_confirmation`
- `status`
- `created_at`
- `updated_at`

Rules:

- Prepared work is not live execution.
- Business-truth changes require confirmation.
- Public/customer-visible work requires Faraz approval.

## `approval_decisions`

Fields:

- `id`
- `prepared_action_id`
- `restaurant_id`
- `reviewed_by_user_id`
- `decision`
- `decision_note`
- `created_at`

Decision values:

- `approved_for_manual_execution`
- `edit_needed`
- `ask_client`
- `hold`
- `skip`

## `manual_execution_events`

Fields:

- `id`
- `prepared_action_id`
- `restaurant_id`
- `executed_by_user_id`
- `execution_channel`
- `status`
- `manual_note`
- `executed_at`
- `included_in_report_at`
- `created_at`

Status values:

- `prepared`
- `needs_approval`
- `approved_for_manual_execution`
- `manually_completed`
- `included_in_report`
- `held`
- `skipped`
- `failed`
- `needs_client_confirmation`

## `reports`

Fields:

- `id`
- `restaurant_id`
- `report_type`
- `period_start`
- `period_end`
- `status`
- `summary`
- `work_completed`
- `media_used`
- `visibility_notes`
- `client_needs`
- `honest_limitations`
- `published_to_client_at`
- `created_at`
- `updated_at`

Status values:

- `draft_needed`
- `ready_for_review`
- `missing_data`
- `reviewed`
- `published_to_client`
- `held`

## `visibility_findings`

Fields:

- `id`
- `restaurant_id`
- `finding_type`
- `title`
- `why_it_matters`
- `customer_opportunity_impact`
- `prepared_action_id`
- `risk_level`
- `requires_client_confirmation`
- `status`
- `created_at`
- `updated_at`

Rules:

- Findings can feed prepared actions.
- Client-facing summaries must be safe and non-guaranteed.

## `opportunity_scores`

Fields:

- `id`
- `restaurant_id`
- `score`
- `status`
- `findability`
- `trust`
- `choice`
- `media_freshness`
- `best_seller_visibility`
- `google_local_readiness`
- `review_reputation_support`
- `content_consistency`
- `client_cooperation`
- `blockers`
- `main_opportunity`
- `main_blocker`
- `suggested_next_action`
- `confidence_level`
- `created_at`

Rules:

- Scores are team/internal only.
- Never public guarantee language.
- Never shown directly to clients unless redesigned safely later.

## Future connector persistence

Future connector records must include restaurant scope, actor/system source, attempted action, status, error summary, and activity log linkage before any live integration can be enabled.

## 2026-06-03 pricing/profit-fit alignment

- Active public pricing is Starter $295/month, Growth $495/month, and Premium $995/month.
- Growth is the main recommended package for strong-fit restaurants; Starter is the low-friction entry plan; Premium is selective and readiness-gated.
- Premium requires readiness assessment, client approval, and an agreed ad budget; ad spend is separate.
- Profit Fit Layer is internal/team-only and uses `requiredDailyOrders = monthlyFee / netMargin / averageTicket / 30` with conservative defaults of $15 average ticket and 5% net margin.
- Online-influenced orders/actions include online orders, phone/order clicks, direction/address clicks that become visits, menu/order-link clicks, Google profile actions, customer mentions, social content-driven visits, and repeat-customer attention.
- Public/client surfaces must not promise orders, profit, ROI, customers, revenue, rankings, or exact order targets.
- This update does not mark production auth, migrations, storage, live AI, connectors, payments, or runtime SaaS wiring as built.
