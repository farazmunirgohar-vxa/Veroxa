# SaaS Route Data Boundary Plan

Status: Design-only. No route behavior changes are made by this plan. No production auth enabled yet. No storage uploads enabled yet. No migrations created yet. No live AI enabled yet. No payments enabled yet.

This document defines current and future route/data boundaries for the Client Portal Full SaaS Foundation. It protects the current pre-live/review-mode app from accidentally becoming a runtime SaaS product before RR approval.

## Current route groups

### Public website

- Public marketing pages and audit entry points.
- No real client data.
- No team data.
- No private account information.
- Must not imply customer, revenue, ranking, or integration guarantees.

### Public Client Demo

- `/demo/client/*` remains the public demo walkthrough surface.
- Sample/demo data only.
- No auth.
- No real client data.
- No production writes.
- Safe for sales/demo walkthrough.

### Guarded Client Portal

- `/client/*` is currently a guarded review-mode shell.
- It must not be converted into production auth in this task.
- It must not perform production writes in this task.

### Guarded Team Portal

- `/team/*` is currently a guarded internal review-mode shell.
- It stays Faraz/team oriented.
- It must not become an Owner/Operator dashboard.

## Future SaaS route rules

### Public routes

- No real client data.
- No team data.
- No private account information.
- Free Audit can create prospect/audit records only after production persistence is intentionally enabled.
- Public pages must not imply guaranteed customer outcomes, revenue, rankings, or live integrations.

### `/demo/client/*`

- Sample/demo data only.
- No auth.
- No real client data.
- No production writes.
- Must remain safe for sales/demo walkthrough.
- Demo restaurants must remain clearly separate from real client restaurants.

### `/client/*`

- Production auth required in future.
- Client must only see own restaurant/account data.
- No fixture/demo data after real account mode is active.
- Client-safe language only.
- No internal scores, raw scoring, internal IDs, backend/API/Supabase/OpenAI/RLS terms.
- Client writes must be scoped to their restaurant and activity-logged.
- `/client/*` cannot use demo/sample fixtures once authenticated real mode is enabled.

### `/team/*`

- Team/Faraz auth required in future.
- Team may access operational records.
- Team-only internal scores and Restaurant Opportunity Engine can appear here.
- Public/customer-visible actions still require Faraz approval.
- All team writes must be activity-logged.
- No Owner/Operator dashboards unless explicitly approved later.
- `/team/*` cannot use demo/sample fixtures once authenticated real mode is enabled.

## Future data-mode transition plan

1. `placeholder/review`
   - Current guarded shell and deterministic review-mode behavior.
   - No production persistence.
   - No real private records.

2. `demo`
   - Public demo/sample data only.
   - Explicitly separate from real accounts.
   - Safe for walkthroughs.

3. `authenticated_client`
   - Future-only until RR-approved.
   - Production auth required.
   - Reads/writes scoped to the authenticated user's active restaurant membership.
   - No demo/sample fixture fallback once enabled.
   - All writes activity-logged.

4. `authenticated_team`
   - Future-only until RR-approved.
   - Team/Faraz auth required.
   - Can access operational records and internal scores.
   - All writes activity-logged.

5. `future_live_integration`
   - Future-only until account scoping, service credentials, activity logs, approval gates, and connector-specific safety checks are approved.
   - Connector actions must never bypass Faraz approval for public/customer-visible work.

## Non-goals for this task

- Do not add production auth.
- Do not change `AUTH_MODE`.
- Do not add runtime routes.
- Do not change route behavior.
- Do not add storage uploads, migrations, live AI, payments, or integrations.

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
