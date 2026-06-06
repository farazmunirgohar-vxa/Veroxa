# SaaS Persistence Model
> Do not override current docs: read `ACTIVE_DOCS_INDEX.md` first. Any old pricing, role, auth, or automation language in this file is historical/deprecated unless the active docs index confirms it.


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

- Historical note: Starter $295/month, Growth $495/month, and Premium $995/month are deprecated/archive-only and are not active public pricing. Current public pricing is Complete Online Presence — $495/month.
- Growth is the main recommended package for strong-fit restaurants; Starter is the low-friction entry plan; Premium is selective and readiness-gated.
- Premium requires readiness assessment, client approval, and an agreed ad budget; ad spend is separate.
- Profit Fit Layer is internal/team-only and uses `requiredDailyOrders = monthlyFee / netMargin / averageTicket / 30` with conservative defaults of $15 average ticket and 5% net margin.
- Online-influenced orders/actions include online orders, phone/order clicks, direction/address clicks that become visits, menu/order-link clicks, Google profile actions, customer mentions, social content-driven visits, and repeat-customer attention.
- Public/client surfaces must not promise orders, profit, ROI, customers, revenue, rankings, or exact order targets.
- This update does not mark production auth, migrations, storage, live AI, connectors, payments, or runtime SaaS wiring as built.
## Profit validation and online-influenced action layer (internal only)

Veroxa sells online presence publicly, but internally validates whether the work is becoming cost-justifiable through profitable online-influenced orders/actions. This is an internal operating model, not public/client-facing guarantee language.

- Starter internal 2-month proof standard: 20 online-influenced actions/day for right-fit restaurants.
- 2–3 months: service delivery plus cost justification through tracking setup, Google/Maps cleanup, best sellers, and order/contact paths.
- 6–9 months: profit progress should be visible through careful signal review, not service delivery volume alone.
- 12 months: online presence should be reviewed as a meaningful order channel when attribution confidence is strong enough.
- Tracking hierarchy: business outcome signals, conversion/action signals, attention signals, engagement signals, and execution signals.
- Attribution confidence must stay explicit: confirmed, strong signal, directional, owner reported, or unknown.
- Break-even progress and exact proof math are internal only and must not appear as public/client guarantees.

No runtime SaaS implementation is added by this layer: no production auth, database migrations, storage uploads, live AI, connectors, payments, or real client data writes.

## 2026-06-03 — Client Portal Full SaaS Foundation Phase 1 scaffold

- Phase 1 SaaS foundation scaffolding has been added as TypeScript contracts and guardrails only.
- `SaasDataMode`, future restaurant/account/user/media/request/action/report/activity domain models, repository interfaces, placeholder repository adapters, demo repository adapters, and a `RepositoryBundle` selector now exist.
- Activity log scaffolding exists through `ActivityLogRepository` contracts and preview helpers; no future write should ship without activity logging.
- Profit validation persistence hooks now include `ProfitValidationSnapshotRecord` for team/internal-only snapshot previews.
- Production DB/auth/storage is still not connected: no production auth, migrations, RLS policies, storage uploads, live AI, connectors, payments, or real client data writes are enabled.
- Demo fixture leakage is guarded with `assertNoDemoFixturesInAuthenticatedMode`; `/client/*` and `/team/*` cannot use demo/sample fixtures once authenticated real mode is enabled.
- A future production adapter requires RR approval before implementation or wiring.

## 2026-06-03 — Client Portal Full SaaS Foundation Phase 2 account/data-flow buildout

- Built the deterministic account activation model for demo-only, prospect review, onboarding, client portal ready, team review ready, active manual service, paused, canceled, and archived states.
- Built normalized client portal page state and team portal repository state models so UI surfaces can read through repository/data-mode boundaries instead of mixing demo and real-route behavior.
- Expanded repository contracts and placeholder/demo adapters with client dashboard, media, request, update, report, team repository, activity preview, account activation summary, and profit validation snapshot methods.
- Updated client portal pages to show richer repository-driven demo states while keeping real guarded routes in premium, client-safe setup states.
- Updated team portal surfaces to show account/data-mode visibility, demo-vs-placeholder labels, activity log preview status, and internal profit validation snapshot previews.
- Integrated non-persisted activity log previews and internal-only profit validation snapshot previews without production writes.
- Production runtime is still not connected: no production auth enablement, database tables, migrations, RLS policies, storage uploads, payments, live AI, or publishing integrations were added.
- Next recommended phase: RR-approved production adapter design and test harness planning before any real auth/database/storage wiring.
