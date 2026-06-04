# Veroxa OS Current Master

Status: Current source of truth for the Veroxa preview/manual/pre-live operating model.

## Locked principle

**Veroxa should be theoretically complete in preview/manual/pre-live mode before paid infrastructure is activated.**

**Paid systems should be connected into existing prepared interfaces, not used while the product is still being designed.**

This means Veroxa should build the operating system first: draft systems, manual workflows, approval gates, confirmation gates, onboarding readiness, queue language, adapter contracts, guardrails, and QA checklists. Paid services should only be activated when the product is clean, secure, operational, and ready to connect.

## Product identity

Veroxa is an AI-assisted, automation-powered restaurant online presence and customer-growth operating system. Publicly, Veroxa helps restaurants become easier to find, easier to trust, easier to choose, and easier to return to.

Veroxa is not just a website, client portal, dashboard, content scheduler, or traditional marketing agency portal. The restaurant partner should experience Veroxa as simple, premium, calm, and low-effort while Veroxa does the maximum practical work behind the scenes.

Internal opportunity and profit-fit reasoning remains internal only. Public/client surfaces must never promise revenue, orders, profit, ROI, rankings, walk-ins, customers, or guaranteed growth.

## Current build stack

The current active stack is **GitHub + Codex + Vercel**.

- GitHub main is the source of truth.
- Codex is the primary engineering/build agent.
- Vercel is the deployment target.
- Browser/manual QA is used for visual checks.
- **Replit is historical only** and must not be described as the active build workflow.

## Active roles

The active product roles are **Client and Team**.

- Client means Restaurant Partner.
- Team means Veroxa Team / Faraz.
- Faraz is the current operator of the Team OS.

## Parked roles

**Owner/Operator parked** means Owner, Operator, Super Admin, generic Admin, and Execution roles are not active product roles. Do not build dashboards, routes, credentials, workflows, or public language for those roles unless Faraz explicitly reintroduces them.

## Pricing

Locked current public pricing:

- Starter: **$295/month**
- Growth: **$495/month**
- Premium: **$995/month**

Global pricing rules:

- No contract.
- Cancel anytime.
- Ad spend is separate and paid directly by the restaurant.
- Starter is capped at up to 3 posts/week depending on usable client-provided media.
- Growth and Premium are capped at up to 1 post/day depending on usable client-provided media.
- Premium requires a Veroxa readiness assessment, client approval, and an agreed ad budget.
- Veroxa does not handle comments, DMs, inboxes, complaints, refunds, order questions, or customer-service conversations at launch.

## Current public surfaces

Current public surfaces include:

- Homepage / landing page.
- Services page: explains what Veroxa does and must not show prices.
- Pricing page: shows prices and services listed under each plan.
- Free Audit page: safe intake and preview flow without fake live claims.
- Login page: Portal Access for preview/review routing.
- Public Client Demo at `/demo/client/dashboard`.

Public surfaces must stay clear, premium, and honest. They must not expose implementation terms, internal math, raw scores, backend language, fixture language, connector/API language, Supabase/RLS language, OpenAI language, or internal risk logic.

## Current client surfaces

Current client surfaces are guarded review/preview routes for the Client Portal, including dashboard, media, requests, updates, and reports. The Client Portal should feel calm and useful while remaining honest about pre-live/manual mode.

Client-safe language includes:

- Prepared by Veroxa.
- In review.
- Veroxa team review.
- Needs your input.
- Visibility update.
- Prepared action.
- Included in report.
- More content needed.
- Nothing goes live without Veroxa team review.

Client surfaces must not claim live AI, live storage, live database operation, live platform publishing, payments, or automated customer-visible execution.

## Current team surfaces

Current Team/Faraz surfaces include Team Dashboard, Work Queue, Report Queue, Audit Leads, Visibility Audit, Direction Queue, Manual Execution Center, First-Client Readiness, and First-Client Ops if present.

Team surfaces may use internal operating language, but they should remain calm and action-focused:

- pre-live/manual mode
- draft only where appropriate
- no auto-posting
- no paid integrations active
- human review required
- client confirmation required for business-truth changes
- onboarding gap acknowledged where appropriate

## Current pre-live/manual operating model

The core operating flow is:

Veroxa audits -> Veroxa prepares exact action -> action enters Approval Queue -> Faraz approves / edits / skips / asks client -> Veroxa queues for later execution -> future connectors execute approved work -> client sees simple progress.

Today, Veroxa should prepare work for manual execution and review. It must not pretend connectors, publishing, storage, payments, or production user accounts exist.

## No-paid-infrastructure strategy

The current strategy is to build as much as possible before paid infrastructure:

- AI-shaped draft systems.
- Automation preview systems.
- Manual execution workflows.
- Approval gates.
- Client confirmation gates.
- Restaurant Onboarding readiness.
- Report/update draft systems.
- Adapter contracts.
- Guardrails.
- QA checklists.

Paid infrastructure is blocked until the Pre-Paid Activation Gate is satisfied and Faraz explicitly approves activation.

## AI-ready but not connected strategy

Veroxa should be **AI-ready but not connected**. AI-shaped workflows can be built now using deterministic/rule-based draft builders, placeholders, and safe fallbacks. Real OpenAI/live AI calls must be server-side only in the future, with no frontend keys, no auto-publishing, budget caps, activity logging, fallback behavior, and human approval.

Future AI adapters should plug into existing draft interfaces instead of forcing Veroxa to redesign while paying for usage.

## Integration-ready but not connected strategy

Veroxa should be **integration-ready but not connected**. Adapter contracts, UI flows, permission boundaries, error states, activity logs, rollback plans, and approval gates can be designed before live providers are connected.

Future integrations may include Supabase auth/database, Supabase storage, OpenAI, Google, Meta/TikTok, payments, and notifications, but none are active until explicitly approved after the pre-paid gate.

## Current onboarding gap

**Restaurant Onboarding** is now a known major gap. The system needs a future Restaurant Onboarding Center / Onboarding Wizard that collects business info, contact info, profile links, platform access status, menu/order/reservation links, best sellers, food categories, brand tone, posting preferences, media guidance, selected package, business-truth confirmations, first-week setup tasks, welcome/message drafts, Client Portal onboarding status, and Team Portal onboarding queue.

Onboarding should first be built in preview/manual mode with no production auth, database writes, storage uploads, integrations, payments, or auto-posting.

## Route philosophy

Do not merge demo and login flows.

- Demo Preview -> `/demo/client/dashboard`.
- Portal Access / Login -> `/login`.
- Client login -> `/client/dashboard`.
- Team login -> `/team/dashboard`.
- `/demo/client/dashboard` remains the only public demo preview.
- `/demo/team/*` is deprecated/not active and must not be promoted.
- `/team/*` remains the real Team/Internal Admin review route guarded until production auth is explicitly requested.
- `/client/*` remains the real Client Portal review route until production auth is explicitly requested.
- If a real portal section is incomplete, stay inside the real route and show Still Building rather than redirecting to demo.

Preview credentials currently documented for review:

- [client@veroxa.com](mailto:client@veroxa.com) / farazclient
- [team@veroxa.com](mailto:team@veroxa.com) / farazteam

`AUTH_MODE` must remain `placeholder` until production auth is explicitly approved.

## Guardrail philosophy

Guardrails should protect product truth, route separation, pricing, client-safe language, auth mode, no-paid-infrastructure boundaries, and current strategy markers. Do not weaken existing guardrails to pass a build.

## PR size philosophy

PR #59 style is the ideal normal major-build size: around 3,000 meaningful changes across roughly 20-30 files, with domain + UI + docs + guardrails. Big builds may target around 5,000 meaningful additions/deletions when justified. Hotfixes stay small and surgical. No fake churn.

## Cost gate philosophy

Before turning on any paid system, Faraz should approve estimated cost, operational readiness, security posture, and client/pilot readiness. Manual operation must be possible without paid automation.

## Future paid activation sequence

1. Finish current public/client/team alignment and guardrails.
2. Build Restaurant Onboarding OS V1 in preview/manual mode.
3. Complete pre-paid activation gate review.
4. Approve cost and security plan.
5. Activate production auth/database only after a final auth and data-boundary review.
6. Activate storage only after upload, moderation, retention, and access controls are ready.
7. Activate live AI only after server-side adapter, budget caps, logging, fallbacks, and approval gates are ready.
8. Activate Google/Meta/TikTok connectors only after permissions, rate limits, rollback, logs, and human approval gates are ready.
9. Activate payments only after pricing, cancellation, billing support, and legal copy are ready.
10. Keep manual fallbacks and rollback paths available after every paid activation.
