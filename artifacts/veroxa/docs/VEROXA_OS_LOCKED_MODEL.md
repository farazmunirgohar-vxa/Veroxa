# Veroxa OS — Locked Operating Model
> Do not override current docs: read `ACTIVE_DOCS_INDEX.md` first. Any old pricing, role, auth, or automation language in this file is historical/deprecated unless the active docs index confirms it.


This document captures the current locked Veroxa OS direction. It is intended for Faraz, ChatGPT, Codex, and future coding agents. `CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md` controls build/hold/RR/merge/deploy command semantics.

## 1. Correct platform reality

The active Veroxa build stack is **ChatGPT-managed GitHub + Codex + ChatGPT Sites**, with Vercel retained temporarily for migration compatibility and rollback:

- **ChatGPT** is Faraz's primary planning, orchestration, review, GitHub, and deployment interface.
- **GitHub main** is the source of truth.
- **Codex** is the engineering capability ChatGPT invokes for engineering, architecture review, hardening, PRs, and tests.
- **ChatGPT Sites** is the primary application/deployment surface.
- **Vercel** remains a temporary fallback during verified Sites and custom-domain stabilization.
- **Browser/manual QA** is used for visual checks.
- **Supabase** is connected as the future app/data backend, but production writes/auth/storage/RLS must remain staged and intentional.
- **OpenAI Platform** is connected for future server-side AI work, but no frontend key exposure and no runtime AI calls unless explicitly requested.

## 2. Product identity

Veroxa is an AI-assisted, automation-powered restaurant online presence and customer-growth operating system.

Veroxa is not just:

- a website
- a client portal
- a dashboard
- a content scheduler
- a traditional marketing agency

Veroxa is becoming a system that helps restaurants become:

- easier to find
- easier to trust
- easier to choose
- easier to return to

The restaurant partner should feel that Veroxa is handling the online presence without making them manage another complicated system.

## 3. Current active operating model

Active roles today:

1. **Restaurant Partner / Client**
2. **Veroxa Team / Faraz**

Owner and Operator roles are parked until explicitly requested.

The restaurant partner gives minimal, meaningful input:

- access
- media when available
- important business changes
- confirmation for sensitive business truth
- corrections when needed

Veroxa does the maximum practical work:

- audits
- strategy
- prepared actions
- content ideas
- visibility tasks
- review response drafts
- Google/profile tasks
- website/SEO recommendations
- reports and updates
- client reminders

## 4. Core OS flow

The locked Veroxa OS flow:

**Veroxa audits -> Veroxa prepares exact action -> action enters Approval Queue -> Faraz approves / edits / skips / asks client -> Veroxa queues for later execution -> future connectors execute approved work -> restaurant partner sees simple progress.**

The system should not merely recommend work. It should prepare work.

Examples:

- Not: "Update Google profile."
- Yes: "Google visibility update prepared. Review and queue for later."

- Not: "Reply to reviews."
- Yes: "Review reply prepared. Approve, edit, or skip."

- Not: "Website needs SEO."
- Yes: "Local search wording prepared. Hold for later or request client confirmation."

## 5. Current built foundations

The repo currently includes these major Veroxa foundations:

- public website foundation
- locked pricing source of truth
- Demo Preview separated from Portal Access/Login
- client portal foundation
- team portal foundation
- client media submission foundation
- central write adapter pattern
- team Upload Inbox with read-only/fallback foundation
- mobile-friendly team review card foundation
- Daily Customer Opportunity Engine
- Approval-to-Execution Queue
- Visibility Audit Engine
- prepared actions feeding the Approval Queue
- client-safe helper foundations
- Codex hardening workflow through draft PRs

## 6. Approval Queue as the central engine

The Approval Queue is the center of Veroxa OS.

Current and future prepared-action sources should feed the queue:

- Visibility Audit Engine
- Daily Customer Opportunity Engine
- Google/Profile Agent
- SEO Keyword Agent
- Review Growth Agent
- Social Content Agent
- Website Audit Agent
- Menu/Catering Visibility Agent
- Client Reminder Agent
- Weekly Update Agent
- Monthly Report Agent
- future AI caption/image agents

The queue should stay calm, useful, mobile-friendly, and action-focused.

## 7. Client experience rule

The client should not see the machine.

Clients should not see:

- AI agent internals
- OpenAI
- Supabase
- RLS
- fixture/demo terminology
- backend/debug language
- connector/API language
- raw scoring
- internal risk levels
- internal IDs
- approval logic
- draft variants that are not ready

Clients should see:

- Submitted
- In review
- Prepared by Veroxa
- Veroxa team review
- Needs your input
- Visibility update
- More content needed
- Included in report
- Completed

## 8. Team experience rule

Team means Faraz right now.

The Team portal should help Faraz answer:

- What needs attention today?
- What media/client submissions came in?
- What prepared actions need approval?
- What visibility issues need review?
- What customer-growth opportunity should be pushed?
- What client needs follow-up?
- What report/update is due?

The Team portal should be usable on both mobile and computer:

- mobile = fast review and approval
- desktop = deeper review and setup

The Team portal should not feel like an AI lab, backend console, or giant agency operations dashboard.

## 9. Approval and safety rules

Internal analysis can be automatic:

- audits
- keyword analysis
- content classification
- visibility findings
- internal task creation
- draft preparation

Faraz approval is required before public/customer-visible action:

- Google posts
- social posts
- review replies
- website copy changes
- client reminders
- weekly updates
- monthly reports

Client confirmation is required before business-truth changes:

- hours
- holiday hours
- menu changes
- prices
- discounts
- offers
- catering availability
- halal/organic/health claims
- serious complaint responses

Never automatic:

- ad budget changes
- unverified sensitive claims
- deleting reviews/comments/content
- legal/health guarantees
- unverified religious/dietary claims
- aggressive complaint responses

## 10. AI and automation direction

AI should be used to reduce work for Faraz and the restaurant partner.

Future AI should prepare:

- captions
- Google updates
- review replies
- website copy
- local SEO wording
- weekly updates
- monthly reports
- client reminders
- image quality notes
- image enhancements later

AI output should be treated as a draft until reviewed.

The client should usually experience AI output only as "Prepared by Veroxa."

## 11. Build cadence

Use ChatGPT as Faraz's command center and use Codex internally for:

- engineering/build work
- source-of-truth updates
- architecture review
- type safety
- domain logic hardening
- tests/test plans
- backend architecture
- PR cleanup
- future Supabase/RLS work when explicitly approved
- future server-side AI architecture when explicitly approved
- future connector architecture when explicitly approved

Use ChatGPT Sites as the primary deployment surface and use browser/manual QA plus route/build checks for visual and behavioral verification. Retain Vercel only as a temporary compatibility and rollback surface.

Recommended cadence:

1. Faraz and ChatGPT agree on the next product outcome.
2. Faraz authorizes `Build it`, `Build it, but hold for review`, or `Build and deploy it`.
3. ChatGPT refreshes current source-of-truth state and invokes Codex on a controlled task branch.
4. ChatGPT/Codex build, review, harden, test, and open/update the PR.
5. ChatGPT runs RR, fixes in-scope defects/CI, and verifies the exact reviewed head against the green gate.
6. `Build it` merges only when green; `Build it, but hold for review` stops at the green PR.
7. `Build and deploy it` synchronizes the exact merged GitHub state to Sites, runs Sites verification, checkpoints/deploys, and verifies access plus both custom domains.

GitHub merge and Sites deployment are separate actions. `RR` alone does not authorize either action. Pause at the material boundaries in `CHATGPT_MANAGED_BUILD_OPERATING_PROTOCOL.md`.

## 12. High-risk areas

Do not build these unless explicitly requested:

- production auth
- Supabase RLS changes/migrations
- storage uploads
- OpenAI runtime calls
- image generation/editing
- Google Business Profile APIs
- Meta/social publishing APIs
- website/CMS write integrations
- payments/checkout
- ads budget changes
- Owner/Operator dashboards

## 13. First-client target

The first-client target is a semi-real, high-trust system before full automation.

Manual publishing is acceptable at first.

The important first-client flow is:

1. restaurant gives access / submits media
2. Veroxa audits visibility
3. Veroxa prepares actions
4. Faraz reviews from mobile or computer
5. Veroxa tracks status and reports progress
6. client sees simple updates and low-effort requests

Full connector execution comes later.

## 14. Near-term roadmap

Next controlled layers:

1. Keep the ChatGPT-managed operating protocol, active memory, CI, and Sites deployment truth aligned.
2. Create a shared route-and-capability manifest for the canonical and Sites applications.
3. Complete Client behavior parity for onboarding, media, messages/requests, reports, connections, and business-truth corrections.
4. Complete grouped Momo Workspace behavior parity and safe internal action routing.
5. Remove misleading secure/internal labels from publicly reachable pre-live shells and keep real data out.
6. Design production identity and persistence adapters only under separate explicit approval.
7. Run security, accessibility, desktop/mobile, build, route, and live-domain verification.
8. Add storage, live AI, or execution connectors only after their separate approval gates are satisfied.

## 15. Locked summary

Veroxa should do the most work possible for restaurant partners.

The restaurant partner should not manage the system.

Faraz should approve prepared work from mobile or computer.

## Veroxa should become the restaurant's quiet, AI-assisted growth operating system: simple outside, powerful inside.

## 15. 2026-05-30 historical package and build-order note — superseded

This section records a retired May 2026 package model and must not govern current product, pricing, UI, or roadmap decisions. The only active public offer is **Complete Online Presence — $495/month**, with launch add-ons and boundaries controlled by `PRICING_SOURCE_OF_TRUTH.md`.

The retired package language was:

- Essential: Google Business Profile optimization, Google Search/Maps SEO basics, Facebook + Instagram presence management, picture-based posting, max 1 picture post/day, weekly updates, monthly snapshot, and Client Portal access.
- Growth: everything in Essential plus TikTok + Reels posting support using the photos and videos the client provides, Reels optimization, and enhanced monthly report.
- Premium: everything in Growth plus ads management after readiness, platform-specific drafting/adaptation, and ad reporting. Posting remains max 1 post/day, and ad spend is separate.

Premium is eligible only after at least 1 month on Essential or Growth, a Veroxa readiness assessment by phone, Zoom, or in person, client approval, and an agreed ad budget. Ads should not be recommended until the restaurant foundation is ready.

Veroxa manages posting, captions, page consistency, Google visibility, online presence, media guidance, weekly updates, monthly snapshots/reports, Premium readiness assessment, and ads management only after readiness. Veroxa does not handle comments, DMs, inboxes, complaints, order questions, refunds, or customer-service conversations at launch.

Posting depends on usable client-provided media and may slow when usable media is unavailable. Veroxa does not create real restaurant media from nothing, and professional filming is not included unless separately arranged in the future.

First clients receive 20% off for the first 12 months. After 12 months, the 20% discount converts into a loyalty discount only while the client remains continuously active. If the client leaves and later returns, the 20% discount is no longer eligible.

Build order remains client side first. Team/Internal Admin heavy AI automation comes after client-side clarity. Future Team Portal should become the AI/automation command center and support media review assist, caption drafting, Google/SEO/Maps task engine, reporting generator, Premium readiness checklist, client risk flags, workload tracking, and Pakistan team handoff after 10 clients.

## 12. Portal separation and launch-readiness order

Current active routing is locked as follows:

- Public flow: Home -> Audit -> Login through ChatGPT Sites.
- Publicly reachable Sites Client and Team routes are non-sensitive pre-live shells and must not contain real client or Team-sensitive data.
- Canonical Client review routes remain `/client/*`; canonical Team review routes remain `/team/*` with their existing guards.
- Retired `/demo/*` routes must not be revived or promoted as the current Veroxa application.

If a Client or Team section is incomplete, it should stay inside the real route and use honest pre-live/coming-next language. It should not claim secure/internal access until authorization is enforced or call the real Sites application a separate demo.

Client behavior parity and safe public-shell boundaries come first. Production identity, persistence, storage, AI, and external execution remain separately gated.

The first 5 clients are the pre-launch readiness benchmark:

1. Healthy Complete Online Presence client.
2. Client with low media availability.
3. Client with incomplete business-truth confirmation.
4. Client with inconsistent submissions or access.
5. Client needing a separately scoped launch add-on or future service assessment.

## 2026-06-04 — Locked current strategy addendum (superseded where noted by the 2026-07-12 protocol)

Veroxa should be theoretically complete in preview/manual/pre-live mode before paid infrastructure is activated. Paid systems should be connected into existing prepared interfaces, not used while the product is still being designed.

Current locked markers:

- Active stack: ChatGPT-managed GitHub + Codex + ChatGPT Sites. Vercel is temporary rollback only; Replit is historical.
- Active roles: Client and Team. Owner/Operator are inactive and parked.
- `AUTH_MODE` remains `placeholder`.
- Historical/deprecated pricing note: Starter $295, Growth $495, and Premium $995 are not active public pricing. Current pricing is Complete Online Presence — $495/month.
- Legacy preview-only credential strings are retired from active operating guidance and must never be reused as production authentication.
- Veroxa remains AI-ready but not connected and integration-ready but not connected until a future approved activation.
- Restaurant Onboarding is a known missing layer and future priority.
- Paid infrastructure remains blocked until the Pre-Paid Activation Gate is satisfied.
- PR #59 style is the ideal normal major build size around 3,000 meaningful changes across 20-30 files; justified big builds may approach 5,000 meaningful additions/deletions; no fake churn.
