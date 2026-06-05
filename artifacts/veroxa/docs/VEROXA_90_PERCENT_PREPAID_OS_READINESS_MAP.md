# Veroxa 90% Pre-Paid OS Readiness Map

## Current readiness estimate

Veroxa is approximately **86–90% ready for pre-paid/manual first-client preview operation** after this build. The product is not production SaaS yet; it is a manual operating system with prepared interfaces, client-safe portal flows, deterministic preview logic, and SOPs.

## Already built

- Public Home → Audit → Login flow with one active public offer: **Complete Online Presence — $495/month**.
- Client and Team portal foundations with placeholder auth mode.
- Client dashboard, onboarding, media, requests, updates, and reports routes.
- Package boundary, request SLA, restaurant onboarding, media intelligence, and value-proof foundations.
- Guardrails for pricing drift, public cleanup, portal separation, SaaS safety, onboarding, request SLA, value proof, media intelligence, and manual execution.

## What this PR adds

- Client readiness snapshot/checklist/summary domain.
- Weekly update domain and client UI for what Veroxa worked on, prepared, needs, and will do next.
- Monthly report domain and client UI for report readiness, media learnings, reach/action signals, limitations, and next month focus.
- Add-on readiness domain for +$95 new basic website and +$45/profile missing Facebook/Instagram profile creation.
- Onboarding expectation acknowledgement polish, access checklist, and business-truth confirmation requirements.
- Client-safe value proof summaries and guardrails preventing proof math from leaking to public/client pages.
- Backend SOP suite for Pakistan backend execution later.
- First-5-client readiness plan and audit-to-first-client operating flow.
- Pre-paid activation gate criteria before paying for live systems.

## What remains before paid systems

- Manual QA of Home, Audit, Login, Client Dashboard, Onboarding, Media, Requests, Updates, and Reports.
- First-client execution pack: exact manual checklists, folder naming, response templates, and report calendar.
- Final visual polish for client-facing surfaces.
- RR review of any live-system architecture before spending on production infrastructure.
- Manual test of first 5 client archetypes through audit, onboarding, weekly update, request handling, media review, and monthly report baseline.

## What must wait until paid/live systems

- Production auth, database, storage, live AI, Google/Meta/Yelp/TikTok integrations, payments, publishing connectors, webhooks, cron jobs, and automated customer-visible execution.
- Real analytics ingestion, real file uploads, real account creation, live posting, and background automation.

## Why Team complexity is deferred

Faraz is the active Team role. The near-term bottleneck is client clarity, request boundaries, weekly/monthly proof, onboarding, and SOP quality. Advanced Team OS complexity would create more review burden before the client/manual operating flow is stable.

## First 5 clients require

- Clear audit fit decision: Complete Online Presence fit, manual review/not ready, or not fit yet.
- Onboarding expectation acknowledgement.
- Access checklist for Google Business Profile, website, Facebook, and Instagram.
- Business-truth confirmations before public copy.
- Media supply standards and weekly rhythm expectations.
- Request boundary enforcement for included, confirmation-needed, add-on, coming-soon, not-included, and manual-review requests.
- Weekly update cadence and monthly report baseline.
- Internal value proof review without public/client proof math.

## What Faraz must be able to review

- Client setup readiness and next action.
- Media quality and what to ask for next.
- Confirmation gaps for hours, address, phone, menu, prices if mentioned, existing offers, catering, claims, order links, and reservation links.
- Included/add-on/coming-soon/not-included request decisions.
- Weekly update preview and monthly report preview.
- Whether a restaurant remains right-fit for manual service.

## What clients must experience

- Simple, premium, calm portal language.
- Clear next step and clear boundaries.
- No fake metrics, no internal proof math, no technical internals, and no guarantee language.
- Confidence that nothing goes live without Veroxa team review.
- 24-hour portal response meaning review/answer/next step, not guaranteed completion.

## What the Pakistan backend must eventually follow

- Portal-first work intake.
- SOP-driven weekly updates, monthly reports, media review, website alignment, and request handling.
- No offer invention, no guarantees, no live platform action without approval, and confirmation required for business-truth changes.
- Escalation to Faraz for sensitive, unclear, risky, or out-of-scope work.
- Quality control before any customer-visible action.

## No-live-system rules

No live auth, production database, storage upload, AI call, Google/Meta/Yelp/TikTok integration, checkout/payment, webhook, cron job, publishing connector, or automated customer-visible execution is allowed before a future RR-approved paid-system build. `AUTH_MODE` remains `placeholder`.

## Readiness checklist before spending on paid systems

- [ ] Public offer stable: Complete Online Presence — $495/month.
- [ ] Yelp/TikTok/Reels/video/ads/daily posting/automated publishing/live integrations remain coming soon.
- [ ] Add-ons stable: new basic website +$95 and missing Facebook/Instagram profile +$45/profile.
- [ ] Onboarding expectations stable and client-safe.
- [ ] Request boundary classification stable.
- [ ] Weekly update process stable.
- [ ] Monthly report process stable.
- [ ] Backend SOPs drafted and manually usable.
- [ ] First 5 client workflow manually tested.
- [ ] Proof math guardrail passes.
- [ ] No public demo promotion.
- [ ] No live-system drift.
- [ ] RR approves production architecture before any paid/live system work.

## 2026-06-05 — Post-PR70 RR cleanup alignment

PR #70 built the 90% pre-paid/manual OS foundations for client readiness, weekly updates, monthly reports, launch add-ons, SOPs, readiness mapping, value-proof guardrails, and client portal readiness surfaces. This cleanup fixed RR issues around preview login, the public header, loaded weekly/monthly client data states, client dashboard setup/demo separation, old tier leakage in onboarding, request boundary counts, public/client polish, and guardrail coverage. Veroxa remains manual/pre-live: no production auth, storage, database writes, live AI, connectors, payments, webhooks, cron jobs, or automated customer-visible execution were added. Team complexity remains deferred and supporting/action-focused. The next big build should wait until this cleanup passes RR and should focus on a dormant live-system blueprint and first-client execution pack, not paid/live systems yet.
