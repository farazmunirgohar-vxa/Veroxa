# Veroxa OS System Map

_Last updated: 2026-06-14 — Automation-first Momo pivot._

Veroxa is currently a **preview/manual/pre-live** restaurant online presence operating system. It is designed so the public site, Client Portal, Team/manual surfaces, repository boundaries, SOPs, and dormant AI/server inventory can be reviewed before any paid or live infrastructure is activated.

Source docs to keep nearby: [Current Build Status](./CURRENT_BUILD_STATUS.md), [Route Page Inventory](./ROUTE_PAGE_INVENTORY.md), [Route Surface Map](./VEROXA_ROUTE_SURFACE_MAP.md), [Pricing Source of Truth](./PRICING_SOURCE_OF_TRUTH.md), [Pre-Paid Activation Gate](./PRE_PAID_ACTIVATION_GATE.md), and [AI Automation Readiness Boundary](./AI_AUTOMATION_READINESS_BOUNDARY.md).

## 2026-06-14 — Automation-first target before Momo walkthrough

- The previous manual/pre-live model remains the current code state: `AUTH_MODE` is still `placeholder`, and live auth, database, storage, messages, media handling, live AI, integrations, payments, publishing, webhooks, cron jobs, and automated customer-visible execution are not active.
- The newest target state is **Live Automation V1 before any Momo owner walkthrough**. The old manual-first Momo walkthrough path is historical/stale for the current Momo plan unless Faraz explicitly re-approves it.
- The next build sequence is real auth, database-backed account/restaurant records, media upload and storage, messages/portal request threads, profile corrections pending Veroxa review, activity log, AI drafting/preparation, Team Automation Control Center, and reports generated from activity.
- Automation may prepare and process internal drafts, classifications, activity records, and Team review items. Public/customer-visible actions still require Veroxa/Faraz approval, and business-truth changes still require client confirmation before approval or execution.
- This map describes target sequence and docs authority only; it does not mark Live Automation V1 as built.

## 1. Current status

- Mode: **preview/manual/pre-live**.
- `AUTH_MODE` remains `placeholder`.
- No production auth, database/storage writes, live AI, live publishing, connectors, payments, webhooks, cron jobs, background jobs, or automated customer-visible execution are active.
- Veroxa team review remains required before anything goes live.

## 2. Route surfaces

### Active public flow

- `/` — public homepage and one-offer positioning.
- `/free-audit` — restaurant online presence audit request preview/manual flow.
- `/login` — preview login / portal access surface.

### Hidden compatibility routes

- `/services` — compatibility page only; not the active public funnel.
- `/pricing` — compatibility page only; one launch offer, not a multi-package funnel.

### Hidden demo/QA routes

- `/demo` — sample/QA Client Demo hub.
- `/guided-demo` — sample guided walkthrough.
- `/demo/client/*` — demo client portal pages using sample data only.
- `/upload` — demo-only upload-key preview; no live storage.

### Guarded client routes

- `/client/dashboard`
- `/client/onboarding`
- `/client/media`
- `/client/requests`
- `/client/updates`
- `/client/reports`

### Guarded Team/manual routes

- `/team/dashboard`
- `/team/onboarding`
- `/team/upload-inbox`
- `/team/work-queue`
- `/team/manual-execution`
- `/team/direction-queue`
- `/team/report-queue`
- `/team/audit-leads`
- `/team/approval-queue`
- `/team/visibility-audit`
- `/team/first-client-readiness`
- `/team/first-client-ops`

## 3. Core domains

- `pricing` — locked Complete Online Presence offer, add-ons, coming-soon boundaries, and launch rules.
- `packageBoundary` — included/add-on/coming-soon/not-included request classification.
- `requestSla` — portal-first 24-hour review/answer/next-step response model.
- `clientReadiness` — first-client readiness checks and safe client messaging.
- `restaurantOnboarding` — preview/manual onboarding acknowledgement and confirmation requirements.
- `mediaIntelligence` — media quality/direction/reporting helpers without live uploads.
- `weeklyUpdates` — weekly update structure and client-safe summaries.
- `monthlyReports` — monthly online presence report structure and limitations language.
- `valueProof` / `restaurantReach` — internal-only signal/proof framing; no proof math on public/client pages.
- `addOns` — new basic website and missing Facebook/Instagram profile creation boundaries.
- `saas` placeholder/demo repositories — TypeScript contracts and demo/placeholder adapters only.
- `aiReadiness` — dormant AI readiness contracts, review gates, validators, and seed data only.

## 4. API server status

- API access is protected by internal API security middleware.
- AI routes remain gated behind `requireAiRoutesEnabled` / `VEROXA_ENABLE_AI_ROUTES` and are not connected to public/client UI.
- Google routes remain gated and are not connected to public/client UI.
- No public or client UI path performs live API writes, live AI calls, live publishing, or live platform changes.

See [AI Server Code Inventory](./AI_SERVER_CODE_INVENTORY.md) for the protected dormant server inventory.

## 5. Guardrail categories

- Pricing and one-offer alignment.
- Public/client language safety.
- Route inventory and route surface containment.
- Auth safety and placeholder-mode protection.
- API security and route gating.
- Proof math leakage prevention.
- Team deferral / no advanced Team OS expansion.
- AI readiness without activation.
- No live systems: no auth, database/storage, payments, connectors, webhooks, cron jobs, background jobs, live publishing, or live AI.

## 6. Frozen for launch alignment

- One active public offer: **Complete Online Presence — $495/month**.
- Add-ons: **new basic website +$95** and **missing Facebook/Instagram profile creation +$45/profile**.
- Coming-soon/not-included boundaries: Yelp, TikTok, Reels/video content, ads management, daily posting, automated publishing, and live integrations.
- No guarantees for orders, revenue, rankings, walk-ins, ROI, profit, customers, or growth.
- No live systems are activated in this cleanup.

## 7. Still later

- Production auth.
- Database/storage architecture and migrations.
- Live AI activation.
- Google/Meta/Yelp/TikTok/YouTube connectors.
- Payments, checkout, subscriptions, invoices, and billing.
- Automated publishing or customer-visible execution.
- Advanced Team OS / broader role dashboards.

Future activation work should update this map, route docs, source-of-truth pricing docs, and the relevant guardrails before RR approval.

## 2026-06-06 — Final deletion/quarantine review

- Final deletion/quarantine review completed.
- No delete-now page files are confirmed.
- Parked/future/debug/AI draft pages are hard-quarantined and require owner approval, route inventory update, route surface map update, guardrail update, and RR before routing.
- Active demo/QA routes remain active, labeled, and guarded from public promotion.
- Route inventory now distinguishes active routes from demo aliases with `active_routed + demo_alias`.
- No live systems were added: no production auth, database/storage writes, live AI, payments, connectors, publishing, webhooks, cron jobs, background jobs, or automated customer-visible execution.
- Next recommended step is the Manual First-Client Launch Pack after RR.
