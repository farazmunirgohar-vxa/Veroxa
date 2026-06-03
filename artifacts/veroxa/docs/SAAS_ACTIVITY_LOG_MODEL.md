# SaaS Activity Log Model

Status: Design-only. Runtime activity logs are not implemented yet. No production auth enabled yet. No storage uploads enabled yet. No migrations created yet. No live AI enabled yet. No payments enabled yet.

## Activity log goals

- Every important write/action is traceable.
- Faraz can see what changed and why.
- Client-visible changes are auditable.
- Future integrations can record success/failure.
- Mistakes can be investigated.
- `/client/*` and `/team/*` cannot use demo/sample fixtures once authenticated real mode is enabled.
- No future write should ship without activity logging.

## Proposed `activity_logs` fields

- `id`
- `restaurant_id`
- `actor_user_id`
- `actor_role`
- `action_type`
- `entity_type`
- `entity_id`
- `summary`
- `metadata`
- `visibility`
- `created_at`

Visibility values:

- `team_only`
- `client_visible`
- `system`

## Required logged events

- client media submitted
- client request created
- client request updated
- prepared action created
- approval decision recorded
- client confirmation requested
- client confirmation received
- manual execution marked complete
- report draft created
- report published to client
- visibility finding created
- opportunity score generated
- account plan changed
- account status changed
- future connector attempted
- future connector succeeded/failed
- storage upload succeeded/failed

## Logging rules

- No real write should be added later without an activity log plan.
- Team writes must log actor.
- Client writes must log actor and restaurant.
- System actions must be clearly marked system.
- Sensitive metadata must not leak to client-visible logs.
- Client-visible logs should use calm, client-safe language.
- Internal log metadata must not expose service credentials, secrets, raw prompts, raw AI internals, or private connector payloads.
- Activity logs should be append-oriented; destructive mutation should be limited to controlled redaction or compliance workflows.

## Future write categories that require logging

- Account/profile changes.
- Membership invite/accept/disable/remove.
- Media upload/review/approval/deletion.
- Client request create/update/resolve.
- Prepared action create/edit/status.
- Approval decision.
- Manual execution event.
- Report publish.
- Visibility finding create/update.
- Opportunity score generation.
- Connector attempt/success/failure.
- Billing/account plan status changes.

## Non-goals

- Do not implement runtime logs yet.
- Do not create database tables or migrations.
- Do not expose activity logs to clients until client-safe visibility rules are implemented and reviewed.

## 2026-06-03 pricing/profit-fit alignment

- Active public pricing is Starter $295/month, Growth $495/month, and Premium $995/month.
- Growth is the main recommended package for strong-fit restaurants; Starter is the low-friction entry plan; Premium is selective and readiness-gated.
- Premium requires readiness assessment, client approval, and an agreed ad budget; ad spend is separate.
- Profit Fit Layer is internal/team-only and uses `requiredDailyOrders = monthlyFee / netMargin / averageTicket / 30` with conservative defaults of $15 average ticket and 5% net margin.
- Online-influenced orders/actions include online orders, phone/order clicks, direction/address clicks that become visits, menu/order-link clicks, Google profile actions, customer mentions, social content-driven visits, and repeat-customer attention.
- Public/client surfaces must not promise orders, profit, ROI, customers, revenue, rankings, or exact order targets.
- This update does not mark production auth, migrations, storage, live AI, connectors, payments, or runtime SaaS wiring as built.
