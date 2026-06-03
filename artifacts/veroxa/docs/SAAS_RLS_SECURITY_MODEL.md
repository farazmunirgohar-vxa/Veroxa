# SaaS RLS Security Model

Status: Design document only. No SQL migrations are created. No Supabase RLS policies are added. No production auth enabled yet. No storage uploads enabled yet. No live AI enabled yet. No payments enabled yet.

## Security goals

- Client can only access own restaurant data.
- Team/Faraz can access operational data.
- Public routes cannot access real private records.
- Service role must be server-only.
- Demo/sample data must remain separate.
- All sensitive writes require account scoping.
- All operational writes require activity logs.
- `/client/*` and `/team/*` cannot use demo/sample fixtures once authenticated real mode is enabled.
- No future write should ship without activity logging.

## Proposed RLS policy matrix

| Table | Client read rules | Client write rules | Team read rules | Team write rules | Public/no-auth rules | Service-role/server rules | Audit-log requirement |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `restaurants` | Read only restaurants where user has active `client_admin` or `client_member` membership. | No direct client writes except future approved profile/contact update flows requiring confirmation. | Read operational restaurants. | Manage status/contact fields through approved server actions. | No private reads. | Server-only service role may manage scoped records. | Log status/contact/account changes. |
| `restaurant_profiles` | Read own restaurant profile with client-safe fields only. | Update confirmation/intake fields through scoped forms. | Read full profile. | Manage strategy notes and business-truth confirmation state. | No access. | Server-only scoped writes. | Log profile updates and confirmations. |
| `memberships` | Read own active membership summary. | No direct writes except invite acceptance. | Read/manage memberships. | Invite, disable, remove scoped memberships. | No access. | Server-only membership management. | Log invite, accept, disable, remove. |
| `media_assets` | Read own restaurant media with client-visible fields. | Create scoped submissions; update own note before review if allowed. | Read all operational media. | Review, prepare, approve, hold, archive. | No private file reads. | Server-only signed URL and scan operations. | Log upload, review, approval, archive, delete. |
| `client_requests` | Read own restaurant requests. | Create/update own scoped requests. | Read operational requests. | Triage, resolve, request confirmation. | No access. | Server-only workflow automation. | Log create, update, resolve. |
| `prepared_actions` | Read only client-safe approved/visible summaries if exposed later. | No direct writes. | Read internal prepared actions. | Create, edit, hold, queue. | No access. | Server-only generation/queueing. | Log create and status changes. |
| `approval_decisions` | Read client-safe outcome only if exposed later. | No direct writes. | Read decisions. | Record approve/edit/ask/hold/skip decisions. | No access. | Server-only enforcement. | Log every decision. |
| `manual_execution_events` | Read client-safe completed/in-report summaries if exposed later. | No writes. | Read execution history. | Mark manual execution status. | No access. | Server-only connector/manual execution support. | Log execution status and report inclusion. |
| `reports` | Read own published reports only. | No direct writes; future client acknowledgement only if approved. | Read/manage drafts and published reports. | Draft, review, publish, hold. | No access. | Server-only report assembly. | Log draft, review, publish, hold. |
| `activity_logs` | Read client-visible logs for own restaurant only. | No direct writes. | Read team/system logs. | Append through controlled actions only. | No access. | Server-only append and integrity checks. | Activity log is the audit trail; do not mutate except controlled redaction. |
| `audit_leads` | No client access by default. | No writes. | Read/manage prospect/audit leads. | Create, score, qualify, archive. | Public audit creation only after production persistence is approved. | Server-only prospect workflow. | Log lead create/update/status. |
| `visibility_findings` | Read client-safe findings only if published. | No direct writes. | Read/manage findings. | Create, connect prepared actions, update status. | No access. | Server-only audit generation. | Log finding creation/status. |
| `opportunity_scores` | No direct client reads. | No writes. | Read internal scores. | Generate/update internal scores. | No access. | Server-only scoring. | Log score generation and major updates. |

## Security tests to write later

- Client A cannot read client B.
- Client A cannot write client B.
- Public cannot read private records.
- Client cannot read internal notes/opportunity scores.
- Team can view operational data.
- Team writes create activity logs.
- Storage paths are account-scoped.
- Service role not exposed to browser.
- Demo/sample records cannot appear in authenticated client/team mode.

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
