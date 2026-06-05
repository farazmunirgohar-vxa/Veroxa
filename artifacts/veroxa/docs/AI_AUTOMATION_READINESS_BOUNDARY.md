# AI + Automation Readiness Boundary

Status: final-trim boundary for preview/manual/pre-live Veroxa. This document prepares the next AI + automation readiness blueprint; it does **not** activate live AI or automation.

## Current state

Veroxa remains preview/manual/pre-live. `AUTH_MODE` remains `placeholder`. The active product is still the manual Complete Online Presence flow with public pages, audit intake, guarded client/team review routes, client onboarding/media/requests/updates/reports, and supporting Team routes for Faraz review.

No production auth, production database, live storage, live AI runtime, platform connectors, payments, webhooks, cron jobs, background jobs, or automated customer-visible execution are active.

## What AI may later assist with

AI readiness planning may prepare deterministic interfaces, prompt review notes, and human-review workflows for:

- Media review suggestions.
- Caption drafts.
- Weekly update drafts.
- Monthly report drafts.
- Request classification.
- Client-safe summaries.
- Internal QA checks.

These are future assistance areas only. They must stay behind Veroxa team review and may not become live execution in this readiness step.

## What AI must not do yet

AI must not:

- Publish automatically.
- Message customers.
- Create offers, discounts, BOGO language, price cuts, or lower-price promotions.
- Guarantee results, rankings, customers, orders, revenue, profit, ROI, walk-ins, or growth.
- Modify Google, Meta, Yelp, TikTok, YouTube, websites, or other live platforms.
- Use live platform APIs.
- Bypass Veroxa team review.
- Present internal proof math or raw risk/scoring logic to clients.

## Automation boundaries

Automation readiness may document queues, approvals, rollback needs, and future adapter boundaries, but the following remain blocked:

- No cron or background jobs yet.
- No webhooks yet.
- No customer-visible automated execution yet.
- No platform connectors yet.
- No automated publishing yet.
- No live integrations yet.

## Required human review

Veroxa team review is required before anything becomes public-facing or client-visible. Human review is especially required for:

- Anything public-facing.
- Anything business-truth-related.
- Anything involving prices, offers, promotions, claims, hours, menu details, ordering links, access, customer-service issues, or sensitive replies.
- Anything client-visible.
- Anything that could affect a live restaurant profile, website, social profile, customer communication, or report.

## Future activation prerequisites

Before live AI or automation can be activated, Veroxa needs RR-approved readiness across:

- Production auth.
- Database and storage architecture.
- Activity logs and audit trails.
- Rollback plan.
- Prompt QA and output evaluation.
- Public/client/team guardrails.
- Approval gates for public-facing work.
- Business-truth confirmation rules.
- Clear adapter boundaries for future platform connectors.
- RR approval before implementation and wiring.

## Reminder

AI/automation readiness is next. Live AI/automation is not active yet, and this boundary must stay in force until a future explicitly approved activation build.
